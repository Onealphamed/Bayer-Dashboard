/*
 * Runtime configuration, read from environment variables on every call so a
 * redeploy with new values takes effect immediately (and tests can vary them).
 *
 * Required
 *   PORTAL_USERNAME, PORTAL_PASSWORD   the portal's own login
 *
 * Strongly recommended
 *   SESSION_SECRET   signs session cookies (falls back to a value derived from
 *                    the user passwords, so changing a password logs everyone out)
 *   VAULT_KEY        encrypts stored dashboard passwords at rest (AES-256-GCM)
 *
 * Optional
 *   PORTAL_TITLE          heading shown in the UI (default "Master Dashboard")
 *   PORTAL_USERS          JSON array of extra users:
 *                         [{"username":"a","password":"b","role":"viewer"}]
 *                         role "admin" can add/edit/delete; "viewer" can only use
 *   SESSION_TTL_HOURS     session lifetime, 1-720 (default 12)
 *   DASHBOARDS            JSON array seeding the dashboard list (see README)
 *   KV_REST_API_URL / KV_REST_API_TOKEN               Upstash Redis via Vercel
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (either naming works)
 */

const ROLES = new Set(['admin', 'viewer']);

function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function parseUsers(env) {
  const users = [];
  const seen = new Set();
  const add = (u) => {
    const username = String(u.username || '').trim();
    const password = String(u.password || '');
    if (!username || !password) return;
    const key = username.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    users.push({ username, password, role: ROLES.has(u.role) ? u.role : 'admin' });
  };

  if (env.PORTAL_USERNAME && env.PORTAL_PASSWORD) {
    add({ username: env.PORTAL_USERNAME, password: env.PORTAL_PASSWORD, role: 'admin' });
  }
  if (env.PORTAL_USERS) {
    try {
      const extra = JSON.parse(env.PORTAL_USERS);
      if (Array.isArray(extra)) extra.forEach((u) => u && typeof u === 'object' && add(u));
    } catch {
      // A malformed PORTAL_USERS must never take the primary login down with it.
    }
  }
  return users;
}

function redisConfig(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '';
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

export function getConfig(env = process.env) {
  const users = parseUsers(env);
  return {
    title: String(env.PORTAL_TITLE || 'Master Dashboard').slice(0, 80),
    users,
    sessionSecret: env.SESSION_SECRET || null,
    sessionTtlHours: clampInt(env.SESSION_TTL_HOURS, 12, 1, 720),
    vaultKey: env.VAULT_KEY || null,
    redis: redisConfig(env),
    seed: env.DASHBOARDS || '',
    allowPrivateStatusTargets: env.STATUS_ALLOW_PRIVATE === '1',
  };
}

/** Problems an admin should see in the UI. Never includes secret values. */
export function configWarnings(cfg) {
  const w = [];
  if (!cfg.users.length) {
    w.push({ level: 'error', code: 'no_users',
      text: 'No login is configured. Set PORTAL_USERNAME and PORTAL_PASSWORD.' });
  }
  if (!cfg.sessionSecret) {
    w.push({ level: 'warn', code: 'no_session_secret',
      text: 'SESSION_SECRET is not set; sessions are signed with a key derived from the login passwords.' });
  }
  if (!cfg.vaultKey) {
    w.push({ level: 'warn', code: 'no_vault_key',
      text: 'VAULT_KEY is not set; dashboard passwords added here are stored without app-level encryption.' });
  }
  if (!cfg.redis) {
    w.push({ level: 'info', code: 'no_storage',
      text: 'No storage connected. The list is read from the DASHBOARDS environment variable and is read-only here.' });
  }
  if (cfg.seed) {
    try {
      const parsed = JSON.parse(cfg.seed);
      if (!Array.isArray(parsed)) throw new Error('not an array');
    } catch {
      w.push({ level: 'error', code: 'bad_seed',
        text: 'The DASHBOARDS environment variable is not a valid JSON array.' });
    }
  }
  return w;
}
