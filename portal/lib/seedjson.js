/*
 * Builds the DASHBOARDS environment-variable value from a list of records.
 * Used to export a backup and, when no storage is connected, to hand the admin
 * the exact value to paste into Vercel after an add / edit / delete.
 */
import { openPassword } from './dashboards.js';

/**
 * Returns { entries, unreadable }. A password that cannot be decrypted (for
 * example after VAULT_KEY changed) is left out of its entry and the dashboard
 * is listed in `unreadable`, instead of failing the whole export.
 */
export async function toSeedEntries(items, vaultKey, { includeSecrets = true } = {}) {
  const entries = [];
  const unreadable = [];
  for (const rec of items) {
    // The id is written out so ids survive a paste round trip in env mode.
    const e = { id: rec.id, name: rec.name, url: rec.url };
    if (rec.description) e.description = rec.description;
    if (rec.category) e.category = rec.category;
    if (rec.color) e.color = rec.color;
    if (rec.links && rec.links.length) e.links = rec.links.map((l) => ({ label: l.label, url: l.url }));
    if (rec.username) e.username = rec.username;
    if (includeSecrets && rec.password) {
      try {
        e.password = await openPassword(rec, vaultKey);
      } catch {
        unreadable.push(rec.name);
      }
    }
    if (rec.notes) e.notes = rec.notes;
    entries.push(e);
  }
  return { entries, unreadable };
}

export async function toSeedJson(items, vaultKey, opts) {
  const { entries, unreadable } = await toSeedEntries(items, vaultKey, opts);
  return { json: JSON.stringify(entries), unreadable };
}
