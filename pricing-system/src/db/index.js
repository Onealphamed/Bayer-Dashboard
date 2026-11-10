import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SCHEMA_VERSION = '1';

/** Open (and create if needed) the pricing database. Pass ':memory:' for tests. */
export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(join(here, 'schema.sql'), 'utf8'));
  db.prepare('INSERT OR IGNORE INTO schema_meta(key, value) VALUES (?, ?)').run('schema_version', SCHEMA_VERSION);
  return db;
}

/** Run fn inside a transaction; rolls back on any error. */
export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function audit(db, action, entityType, entityId, detail) {
  db.prepare('INSERT INTO audit_log(action, entity_type, entity_id, detail) VALUES (?, ?, ?, ?)')
    .run(action, entityType, entityId ?? null, detail == null ? null : JSON.stringify(detail));
}

/** Get or create a client by name (case-insensitive). Returns id or null for blank names. */
export function clientId(db, name) {
  if (!name || !String(name).trim()) return null;
  const clean = String(name).trim();
  const row = db.prepare('SELECT id FROM clients WHERE name = ? COLLATE NOCASE').get(clean);
  if (row) return row.id;
  return Number(db.prepare('INSERT INTO clients(name) VALUES (?)').run(clean).lastInsertRowid);
}
