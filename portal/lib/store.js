/*
 * Persistence.
 *
 *   redis mode  Upstash Redis over its REST API (Vercel's one-click storage).
 *               Full add / edit / delete / reorder, login rate limiting, an
 *               activity log and session revocation. Seeded once from
 *               DASHBOARDS when first used.
 *   env mode    No storage connected. The list comes from the DASHBOARDS
 *               environment variable and is read-only in the UI; rate limiting
 *               falls back to per-instance memory.
 *
 * The REST API is called with fetch, so there are no npm dependencies.
 */
import { getConfig } from './config.js';
import { HttpError } from './errors.js';
import { isEncrypted } from './crypto.js';
import { parseSeed, sealPassword, sortDashboards } from './dashboards.js';

const KEY_LIST = 'portal:dashboards';
const KEY_REV = 'portal:dashboards:rev';
const KEY_AUDIT = 'portal:audit';
const KEY_SEED_ERRORS = 'portal:seed_errors';
const AUDIT_KEEP = 200;

/* Data operations may wait; housekeeping on the sign-in path must not. */
const TIMEOUT_DATA_MS = 8000;
const TIMEOUT_FAST_MS = 1500;

/* ---------- Upstash REST client ------------------------------------------- */

/** Strips anything credential-like from an error message before logging it. */
function scrub(message) {
  return String(message || '')
    .replace(/\/\/[^/@\s]*@/g, '//<redacted>@')
    .replace(/(token|password|secret)=[^&\s]+/gi, '$1=<redacted>')
    .slice(0, 300);
}

async function redisCall(cfg, path, body, timeoutMs = TIMEOUT_DATA_MS) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(cfg.redis.url + path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + cfg.redis.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (err) {
    // Never echo the underlying error: a misconfigured URL can embed credentials.
    console.error('[portal] storage unreachable:', err && err.name, scrub(err && err.message));
    throw new HttpError(503, 'Storage is unreachable right now. Please try again.');
  } finally {
    clearTimeout(timer);
  }
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    console.error('[portal] storage error', res.status, scrub(data && data.error));
    throw new HttpError(503, 'Storage rejected the request. Check the storage connection in Vercel.');
  }
  return data;
}

export async function redis(cfg, ...command) {
  const data = await redisCall(cfg, '', command);
  if (data && data.error) {
    console.error('[portal] storage command error', scrub(data.error));
    throw new HttpError(503, 'Storage command failed.');
  }
  return data ? data.result : null;
}

export async function redisPipeline(cfg, commands, timeoutMs) {
  const data = await redisCall(cfg, '/pipeline', commands, timeoutMs);
  if (!Array.isArray(data)) throw new HttpError(503, 'Unexpected storage response.');
  for (const r of data) {
    if (!r || r.error) {
      console.error('[portal] storage pipeline error', scrub(r && r.error));
      throw new HttpError(503, 'Storage command failed.');
    }
  }
  return data.map((r) => r.result);
}

/* ---------- dashboard list -------------------------------------------------- */

export function storageMode(cfg = getConfig()) {
  return cfg.redis ? 'redis' : 'env';
}

async function sealAll(items, vaultKey) {
  if (!vaultKey) return items;
  const out = [];
  for (const rec of items) out.push(await sealPassword(rec, vaultKey));
  return out;
}

/**
 * Returns { items, rev, mode, seedErrors, uninitialized }.
 *
 * In redis mode an empty store is seeded from DASHBOARDS exactly once (SET NX),
 * so a later change to DASHBOARDS never overwrites edits made in the UI. If
 * DASHBOARDS is set but unreadable (not a JSON array), nothing is seeded: the
 * store stays uninitialised until the variable is fixed, instead of locking in
 * an empty list.
 */
export async function loadDashboards(cfg = getConfig()) {
  if (!cfg.redis) {
    const { items, errors, fatal } = await parseSeed(cfg.seed);
    return { items: sortDashboards(items), rev: 0, mode: 'env', seedErrors: errors, seedFatal: fatal };
  }

  let [raw, rev] = await redisPipeline(cfg, [['GET', KEY_LIST], ['GET', KEY_REV]]);
  if (raw === null || raw === undefined) {
    const parsed = await parseSeed(cfg.seed);
    if (parsed.fatal) {
      return { items: [], rev: 0, mode: 'redis', seedErrors: parsed.errors, uninitialized: true };
    }
    const sealed = await sealAll(parsed.items, cfg.vaultKey);
    // NX on every key: a concurrent first request cannot double-seed. Entry
    // errors are kept so the admin keeps seeing which dashboards were skipped.
    const cmds = [
      ['SET', KEY_LIST, JSON.stringify({ items: sealed }), 'NX'],
      ['SET', KEY_REV, '1', 'NX'],
    ];
    if (parsed.errors.length) cmds.push(['SET', KEY_SEED_ERRORS, JSON.stringify(parsed.errors), 'NX']);
    await redisPipeline(cfg, cmds);
    [raw, rev] = await redisPipeline(cfg, [['GET', KEY_LIST], ['GET', KEY_REV]]);
  }
  if (rev === null || rev === undefined) {
    // The list exists but its revision key was lost (eviction, manual DEL).
    // Restore it so reads and the compare-and-set agree on the same number.
    await redis(cfg, 'SET', KEY_REV, '1', 'NX');
    rev = await redis(cfg, 'GET', KEY_REV);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new HttpError(500, 'Stored dashboard data is corrupted.');
  }
  let items = Array.isArray(doc && doc.items) ? doc.items : [];
  rev = Number(rev) || 1;

  // VAULT_KEY added after passwords were stored: encrypt the plaintext ones now,
  // once. A concurrent write simply wins; the next load retries.
  if (cfg.vaultKey && items.some((d) => d.password && !isEncrypted(d.password))) {
    const sealed = await sealAll(items, cfg.vaultKey);
    try {
      rev = await saveDashboards(cfg, sealed, rev);
      items = sealed;
    } catch (err) {
      if (!(err instanceof HttpError && err.status === 409)) throw err;
    }
  }
  return { items: sortDashboards(items), rev, mode: 'redis', seedErrors: [] };
}

/**
 * Optimistic-concurrency write: the caller passes the rev it read, and the
 * compare-and-set runs as one Lua script so two browser tabs cannot silently
 * clobber each other. Plain string ops only (no cjson), for portability. A
 * missing revision key reads as 1, matching loadDashboards.
 */
const CAS_SCRIPT = [
  "local rev = tonumber(redis.call('GET', KEYS[2]) or '1')",
  "if rev ~= tonumber(ARGV[1]) then return {0, rev} end",
  "redis.call('SET', KEYS[1], ARGV[2])",
  "redis.call('SET', KEYS[2], tostring(rev + 1))",
  "return {1, rev + 1}",
].join('\n');

export async function saveDashboards(cfg, items, expectedRev) {
  if (!cfg.redis) {
    throw new HttpError(409, 'No storage is connected, so the list is read-only here.', { readOnly: true });
  }
  const expected = Number(expectedRev);
  if (!Number.isInteger(expected) || expected < 0) {
    throw new HttpError(400, 'Missing list revision. Reload and try again.');
  }
  // Every write re-seals the whole list, so no plaintext survives any change.
  const doc = JSON.stringify({ items: await sealAll(items, cfg.vaultKey) });
  const result = await redis(cfg, 'EVAL', CAS_SCRIPT, '2', KEY_LIST, KEY_REV, String(expected), doc);
  if (!Array.isArray(result) || Number(result[0]) !== 1) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }
  return Number(result[1]);
}

/* ---------- seed import notices ------------------------------------------- */

/** Entries from DASHBOARDS that were skipped at import, until an admin dismisses them. */
export async function seedNotices(cfg) {
  if (!cfg.redis) return [];
  try {
    const raw = await redis(cfg, 'GET', KEY_SEED_ERRORS);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function dismissSeedNotices(cfg) {
  if (cfg.redis) await redis(cfg, 'DEL', KEY_SEED_ERRORS);
}

/* ---------- activity log ---------------------------------------------------- */

export async function audit(cfg, event) {
  const entry = { t: new Date().toISOString(), ...event };
  if (!cfg.redis) {
    console.log('[portal] audit', JSON.stringify(entry));
    return;
  }
  try {
    await redisPipeline(cfg, [
      ['LPUSH', KEY_AUDIT, JSON.stringify(entry)],
      ['LTRIM', KEY_AUDIT, '0', String(AUDIT_KEEP - 1)],
    ], TIMEOUT_FAST_MS);
  } catch (err) {
    // Auditing must never block the action itself.
    console.error('[portal] audit write failed', err && err.message);
  }
}

export async function recentAudit(cfg, limit = 50) {
  if (!cfg.redis) return [];
  const rows = await redis(cfg, 'LRANGE', KEY_AUDIT, '0', String(Math.min(AUDIT_KEEP, limit) - 1));
  return (rows || []).map((r) => {
    try {
      return JSON.parse(r);
    } catch {
      return null;
    }
  }).filter((e) => e && typeof e === 'object' && !Array.isArray(e));
}

/* ---------- session revocation ------------------------------------------------ */

/*
 * Sessions are stateless, so signing out only clears the browser cookie unless
 * storage is connected. With storage, a signed-out session id is remembered
 * until the token would have expired anyway, and "sign out everywhere" records
 * a per-user cut-off: tokens issued before it are refused.
 */

export async function revokeSession(cfg, sid, ttlSec) {
  if (!cfg.redis || !sid) return false;
  await redisPipeline(cfg, [['SET', 'portal:revoked:' + sid, '1', 'EX', String(Math.max(1, Math.ceil(ttlSec)))]],
    TIMEOUT_FAST_MS);
  return true;
}

export async function revokeAllSessions(cfg, username, nowMs) {
  if (!cfg.redis) return false;
  await redisPipeline(cfg, [['SET', 'portal:signout:' + username.toLowerCase(), String(nowMs),
    'EX', String(721 * 3600)]], TIMEOUT_FAST_MS);
  return true;
}

/**
 * True if this session was signed out. Storage errors fail CLOSED for
 * credential reveals and exports (the caller passes strict) and OPEN for
 * ordinary reads, so a storage blip cannot lock everyone out of the list.
 */
export async function isRevoked(cfg, session, { strict = false } = {}) {
  if (!cfg.redis || !session.sid) return false;
  try {
    const [revoked, cutoff] = await redisPipeline(cfg, [
      ['GET', 'portal:revoked:' + session.sid],
      ['GET', 'portal:signout:' + session.username.toLowerCase()],
    ], TIMEOUT_FAST_MS);
    if (revoked) return true;
    return Boolean(cutoff) && Number(session.issuedMs) <= Number(cutoff);
  } catch (err) {
    if (strict) throw err;
    return false;
  }
}

/* ---------- rate limiting ----------------------------------------------------- */

const memoryBuckets = new Map();

function memoryHit(key, limit, windowSec) {
  const now = Date.now();
  let b = memoryBuckets.get(key);
  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowSec * 1000 };
    memoryBuckets.set(key, b);
  }
  b.count++;
  if (memoryBuckets.size > 5000) {
    for (const [k, v] of memoryBuckets) if (v.reset <= now) memoryBuckets.delete(k);
  }
  return { allowed: b.count <= limit, count: b.count, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/**
 * Fixed-window counter. Returns { allowed, count, retryAfter }.
 * The window is created atomically with its expiry (SET ... EX ... NX, then
 * INCR keeps the TTL), so a counter can never be left without one.
 */
export async function hit(cfg, key, limit, windowSec) {
  if (cfg.redis) {
    const k = 'portal:rl:' + key;
    try {
      const [, count, ttl] = await redisPipeline(cfg, [
        ['SET', k, '0', 'EX', String(windowSec), 'NX'],
        ['INCR', k],
        ['TTL', k],
      ], TIMEOUT_FAST_MS);
      if (Number(ttl) === -1) await redisPipeline(cfg, [['EXPIRE', k, String(windowSec)]], TIMEOUT_FAST_MS);
      const retryAfter = Number(ttl) > 0 ? Number(ttl) : windowSec;
      return { allowed: Number(count) <= limit, count: Number(count), retryAfter };
    } catch {
      // Storage hiccup: count in memory instead of failing open.
    }
  }
  return memoryHit(key, limit, windowSec);
}

export async function peek(cfg, key, windowSec) {
  if (cfg.redis) {
    const k = 'portal:rl:' + key;
    try {
      const [v, ttl] = await redisPipeline(cfg, [['GET', k], ['TTL', k]], TIMEOUT_FAST_MS);
      // A counter that somehow lost its expiry would lock the key forever; repair it.
      if (Number(ttl) === -1) await redisPipeline(cfg, [['EXPIRE', k, String(windowSec)]], TIMEOUT_FAST_MS);
      return Number(v) || 0;
    } catch {
      /* fall through to memory */
    }
  }
  const b = memoryBuckets.get(key);
  return b && b.reset > Date.now() ? b.count : 0;
}

export async function clearHits(cfg, key) {
  memoryBuckets.delete(key);
  if (cfg.redis) {
    try {
      await redisPipeline(cfg, [['DEL', 'portal:rl:' + key]], TIMEOUT_FAST_MS);
    } catch {
      /* best effort */
    }
  }
}
