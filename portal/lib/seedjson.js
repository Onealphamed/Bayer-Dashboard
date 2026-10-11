/*
 * Builds the DASHBOARDS environment-variable value from a list of records.
 * Used to export a backup and, when no storage is connected, to hand the admin
 * the exact value to paste into Vercel after an add / edit / delete.
 */
import { openPassword } from './dashboards.js';

export async function toSeedEntries(items, vaultKey, { includeSecrets = true } = {}) {
  const out = [];
  for (const rec of items) {
    const e = { name: rec.name, url: rec.url };
    if (rec.description) e.description = rec.description;
    if (rec.category) e.category = rec.category;
    if (rec.color) e.color = rec.color;
    if (rec.links && rec.links.length) e.links = rec.links.map((l) => ({ label: l.label, url: l.url }));
    if (rec.username) e.username = rec.username;
    if (includeSecrets && rec.password) e.password = await openPassword(rec, vaultKey);
    if (rec.notes) e.notes = rec.notes;
    out.push(e);
  }
  return out;
}

export async function toSeedJson(items, vaultKey, opts) {
  return JSON.stringify(await toSeedEntries(items, vaultKey, opts));
}
