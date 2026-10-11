/*
 * Persistence.
 *
 *   redis mode  Upstash Redis over its REST API (Vercel's one-click storage).
 *               Full add / edit / delete / reorder, login rate limiting and an
 *               activity log. Seeded once from DASHBOARDS when first used.
 *   env mode    No storage connected. The list comes from the DASHBOARDS
 *               environment variable and is read-only in the UI; rate limiting
 *               falls back to per-instance memory.
 *
 * The REST API is called with fetch, so there are no npm dependencies.
 */
import { getConfig } from './config.js';
import { HttpError } from './http.js';
import { parseSeed, sealPassword, sortDashboards } from './dashboards.js';

const KEY_LIST = 'portal:dashboards';
const KEY_REV = 'portal:dashboards:rev';
const KEY_AUDIT = 'portal:audit';
const AUDIT_KEEP = 200;

/* ---------- Upstash REST client ------------------------------------------- */

async function redisCall(cfg, path, body) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  let res;
  try {
    res = await fetch(cfg.redis.url + path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + cfg.redis.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (err) {
    throw new HttpError(503, 'Storage is unreachable right now. Please try again.', { cause: String(err && err.message) });
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
    console.error('[portal] storage error', res.status, data);
    throw new HttpError(503, 'Storage rejected the request. Check the storage connection in Vercel.');
  }
  return data;
}

export async function redis(cfg, ...command) {
  const data = await redisCall(cfg, '', command);
  if (data && data.error) {
    console.error('[portal] storage command error', data.error);
    throw new HttpError(503, 'Storage command failed.');
  }
  return data ? data.result : null;
}

export async function redisPipeline(cfg, commands) {
  const data = await redisCall(cfg, '/pipeline', commands);
  if (!Array.isArray(data)) throw new HttpError(503, 'Unexpected storage response.');
  for (const r of data) {
    if (!r || r.error) {
      console.error('[portal] storage pipeline error', r && r.error);
      throw new HttpError(503, 'Storage command failed.');
    }
  }
  return data.map((r) => r.result);
}

/* ---------- dashboard list -------------------------------------------------- */

export function storageMode(cfg = getConfig()) {
  return cfg.redis ? 'redis' : 'env';
}

/**
 * Returns { items, rev, mode, seedErrors }. In redis mode an empty store is
 * seeded from DASHBOARDS exactly once (SET NX), so redeploying with a changed
 * DASHBOARDS value never overwrites edits made in the UI.
 */
export async function loadDashboards(cfg = getConfig()) {
  if (!cfg.redis) {
    const { items, errors } = await parseSeed(cfg.seed);
    return { items: sortDashboards(items), rev: 0, mode: 'env', seedErrors: errors };
  }

  let [raw, rev] = await redisPipeline(cfg, [['GET', KEY_LIST], ['GET', KEY_REV]]);
  let seedErrors = [];
  if (raw === null || raw === undefined) {
    const parsed = await parseSeed(cfg.seed);
    seedErrors = parsed.errors;
    const sealed = [];
    for (const rec of parsed.items) sealed.push(await sealPassword(rec, cfg.vaultKey));
    // NX on both keys: a concurrent first request cannot double-seed, and a
    // redeploy with a changed DASHBOARDS value never overwrites UI edits.
    await redisPipeline(cfg, [
      ['SET', KEY_LIST, JSON.stringify({ items: sealed }), 'NX'],
      ['SET', KEY_REV, '1', 'NX'],
    ]);
    [raw, rev] = await redisPipeline(cfg, [['GET', KEY_LIST], ['GET', KEY_REV]]);
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    throw new HttpError(500, 'Stored dashboard data is corrupted.');
  }
  const items = Array.isArray(doc && doc.items) ? doc.items : [];
  return { items: sortDashboards(items), rev: Number(rev) || 1, mode: 'redis', seedErrors };
}

/**
 * Optimistic-concurrency write: the caller passes the rev it read, and the
 * compare-and-set runs as one Lua script so two browser tabs cannot silently
 * clobber each other. Plain string ops only (no cjson), for portability.
 */
const CAS_SCRIPT = [
  "local rev = tonumber(redis.call('GET', KEYS[2]) or '0')",
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
  const doc = JSON.stringify({ items });
  const result = await redis(cfg, 'EVAL', CAS_SCRIPT, '2', KEY_LIST, KEY_REV, String(expected), doc);
  if (!Array.isArray(result) || Number(result[0]) !== 1) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }
  return Number(result[1]);
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
    ]);
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
  }).filter(Boolean);
}

/* ---------- rate limiting ----------------------------------------------------- */

const memoryBuckets = new Map();

/**
 * Fixed-window counter. Returns { allowed, count, retryAfter }.
 * Redis-backed when storage is connected, otherwise per-instance memory.
 */
export async function hit(cfg, key, limit, windowSec) {
  if (cfg.redis) {
    try {
      const [count, ttl] = await redisPipeline(cfg, [
        ['INCR', 'portal:rl:' + key],
        ['TTL', 'portal:rl:' + key],
      ]);
      if (Number(ttl) < 0) await redis(cfg, 'EXPIRE', 'portal:rl:' + key, String(windowSec));
      const retryAfter = Number(ttl) > 0 ? Number(ttl) : windowSec;
      return { allowed: Number(count) <= limit, count: Number(count), retryAfter };
    } catch {
      // Fall through to memory if storage hiccups; never fail open silently
      // to an unlimited state.
    }
  }
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

export async function peek(cfg, key, windowSec) {
  if (cfg.redis) {
    try {
      const v = await redis(cfg, 'GET', 'portal:rl:' + key);
      return Number(v) || 0;
    } catch {
      /* fall through */
    }
  }
  const b = memoryBuckets.get(key);
  return b && b.reset > Date.now() ? b.count : 0;
}

export async function clearHits(cfg, key) {
  memoryBuckets.delete(key);
  if (cfg.redis) {
    try {
      await redis(cfg, 'DEL', 'portal:rl:' + key);
    } catch {
      /* best effort */
    }
  }
}
