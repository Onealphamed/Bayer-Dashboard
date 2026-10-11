/*
 * Dashboard records: validation, normalisation and the redacted public view.
 * All user-supplied input passes through normalizeDashboard() before storage.
 */
import { HttpError } from './http.js';
import { b64urlEncode, isEncrypted, randomId, sha256, vaultDecrypt, vaultEncrypt } from './crypto.js';

export const COLORS = ['indigo', 'blue', 'teal', 'green', 'amber', 'orange', 'rose', 'violet', 'slate'];

const LIMITS = {
  name: 80, url: 2048, description: 300, category: 40, linkLabel: 40,
  links: 8, username: 200, password: 500, notes: 1000,
};

function str(value, field, max, { required = false } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text.`, { field });
  const v = value.trim();
  if (required && !v) throw new HttpError(400, `${field} is required.`, { field });
  if (v.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`, { field });
  return v;
}

/** Only absolute http(s) URLs without embedded credentials are accepted. */
export function validUrl(value, field, { required = false } = {}) {
  const v = str(value, field, LIMITS.url, { required });
  if (!v) return '';
  let u;
  try {
    u = new URL(v);
  } catch {
    throw new HttpError(400, `${field} must be a full web address starting with https://`, { field });
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new HttpError(400, `${field} must start with https:// or http://`, { field });
  }
  if (!u.hostname) throw new HttpError(400, `${field} must include a host name.`, { field });
  if (u.username || u.password) {
    throw new HttpError(400, `${field} must not contain a username or password; use the credential fields.`, { field });
  }
  return u.toString();
}

function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

/**
 * Builds a clean record from untrusted input. `existing` supplies values that an
 * update leaves untouched — notably the password, which the edit form only
 * sends when it is being changed.
 */
export function normalizeDashboard(input, existing = null, { idOverride } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Dashboard details are missing.');
  }
  const name = str(input.name, 'Name', LIMITS.name, { required: true });
  const url = validUrl(input.url, 'URL', { required: true });

  const rawLinks = input.links === undefined && existing ? existing.links : input.links;
  if (rawLinks !== undefined && rawLinks !== null && !Array.isArray(rawLinks)) {
    throw new HttpError(400, 'Links must be a list.', { field: 'links' });
  }
  const links = [];
  for (const [i, l] of (rawLinks || []).entries()) {
    if (!l || typeof l !== 'object') continue;
    const label = str(l.label, `Link ${i + 1} label`, LIMITS.linkLabel);
    const lurl = validUrl(l.url, `Link ${i + 1} URL`);
    if (!label && !lurl) continue;
    if (!lurl) throw new HttpError(400, `Link ${i + 1} needs a URL.`, { field: 'links' });
    links.push({ label: label || 'Link', url: lurl });
  }
  if (links.length > LIMITS.links) {
    throw new HttpError(400, `At most ${LIMITS.links} extra links per dashboard.`, { field: 'links' });
  }

  let password;
  if (input.password === undefined) {
    password = existing ? existing.password || '' : '';
  } else {
    if (typeof input.password !== 'string') throw new HttpError(400, 'Password must be text.', { field: 'password' });
    if (input.password.length > LIMITS.password) {
      throw new HttpError(400, `Password must be ${LIMITS.password} characters or fewer.`, { field: 'password' });
    }
    password = input.password; // not trimmed: whitespace can be significant
  }

  const color = COLORS.includes(input.color) ? input.color
    : (existing && COLORS.includes(existing.color) ? existing.color : colorFor(name));

  const now = new Date().toISOString();
  return {
    id: idOverride || (existing && existing.id) || randomId(),
    name,
    url,
    description: str(input.description, 'Description', LIMITS.description),
    category: str(input.category, 'Category', LIMITS.category),
    color,
    links,
    username: str(input.username, 'Username', LIMITS.username),
    password,
    notes: str(input.notes, 'Notes', LIMITS.notes),
    order: Number.isFinite(existing && existing.order) ? existing.order : 0,
    createdAt: (existing && existing.createdAt) || now,
    updatedAt: now,
  };
}

/** What the browser is allowed to see in a list: never the password. */
export function publicView(rec) {
  const { password, ...rest } = rec;
  return { ...rest, hasPassword: Boolean(password) };
}

export async function sealPassword(rec, vaultKey) {
  if (!vaultKey || !rec.password || isEncrypted(rec.password)) return rec;
  return { ...rec, password: await vaultEncrypt(vaultKey, rec.password) };
}

export async function openPassword(rec, vaultKey) {
  if (!rec.password) return '';
  if (!isEncrypted(rec.password)) return rec.password;
  if (!vaultKey) {
    throw new HttpError(500, 'This password is encrypted but VAULT_KEY is not set on the server.');
  }
  try {
    return await vaultDecrypt(vaultKey, rec.password);
  } catch {
    throw new HttpError(500, 'This password cannot be decrypted. VAULT_KEY may have changed since it was saved.');
  }
}

/**
 * Parses the DASHBOARDS environment variable. Ids are derived from content so
 * they stay stable between requests when no storage is connected.
 */
export async function parseSeed(seedJson) {
  if (!seedJson) return { items: [], errors: [] };
  let raw;
  try {
    raw = JSON.parse(seedJson);
  } catch {
    return { items: [], errors: ['DASHBOARDS is not valid JSON.'] };
  }
  if (!Array.isArray(raw)) return { items: [], errors: ['DASHBOARDS must be a JSON array.'] };

  const items = [];
  const errors = [];
  const ids = new Set();
  for (const [i, entry] of raw.entries()) {
    try {
      let id = entry && typeof entry.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(entry.id)
        // Ids double as object keys in the browser; never let one shadow Object.prototype.
        && !(entry.id in Object.prototype) ? entry.id : null;
      if (!id) {
        const digest = await sha256('seed:' + String(entry && entry.name) + '\u0000' + String(entry && entry.url));
        id = 's' + b64urlEncode(digest).slice(0, 11);
      }
      while (ids.has(id)) id = id + '_';
      ids.add(id);
      const rec = normalizeDashboard(entry, null, { idOverride: id });
      rec.order = i;
      rec.createdAt = rec.updatedAt = '1970-01-01T00:00:00.000Z';
      items.push(rec);
    } catch (err) {
      errors.push(`DASHBOARDS entry ${i + 1}: ${err.message}`);
    }
  }
  return { items, errors };
}

export function sortDashboards(items) {
  return items.slice().sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
}
