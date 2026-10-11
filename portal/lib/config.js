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
 *                         role "admin" can add/edit/delete; "viewer" can only use.
 *                         A missing or unrecognised role means "viewer".
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

/**
 * PORTAL_USERNAME is always an admin. PORTAL_USERS entries get the least
 * privilege unless they explicitly say "admin": a missing or mistyped role
 * becomes "viewer", never admin, and is reported to the admin as a warning.
 */
function parseUsers(env) {
  const users = [];
  const problems = [];
  const seen = new Set();
  const add = (u, explicitAdmin) => {
    const username = String(u.username || '').trim();
    const password = String(u.password || '');
    if (!username || !password) {
      if (!explicitAdmin) problems.push('A PORTAL_USERS entry is missing a username or password and was ignored.');
      return;
    }
    const key = username.toLowerCase();
    if (seen.has(key)) {
      problems.push(`PORTAL_USERS lists "${username}" more than once; only the first entry is used.`);
      return;
    }
    seen.add(key);
    let role = 'admin';
    if (!explicitAdmin) {
      const wanted = typeof u.role === 'string' ? u.role.trim().toLowerCase() : '';
      role = ROLES.has(wanted) ? wanted : 'viewer';
      if (!ROLES.has(wanted)) {
        problems.push(`PORTAL_USERS user "${username}" has ${u.role === undefined ? 'no role' : 'an unknown role'}; `
          + 'they were given viewer access. Use "admin" or "viewer".');
      }
    }
    users.push({ username, password, role });
  };

  if (env.PORTAL_USERNAME && env.PORTAL_PASSWORD) {
    add({ username: env.PORTAL_USERNAME, password: env.PORTAL_PASSWORD }, true);
  }
  if (env.PORTAL_USERS) {
    try {
      const extra = JSON.parse(env.PORTAL_USERS);
      if (!Array.isArray(extra)) throw new Error('not an array');
      extra.forEach((u) => {
        if (u && typeof u === 'object' && !Array.isArray(u)) add(u, false);
        else problems.push('A PORTAL_USERS entry is not an object and was ignored.');
      });
    } catch {
      // A malformed PORTAL_USERS must never take the primary login down with it.
      problems.push('PORTAL_USERS is not a valid JSON array; extra users are disabled.');
    }
  }
  return { users, problems };
}

function redisConfig(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '';
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

/*
 * Every variable is read with a literal `process.env.NAME` member access.
 * Bundlers and edge runtimes that expose only statically referenced variables
 * can then still see them; a dynamic `env[name]` read could come back empty.
 */
function readEnv() {
  if (typeof process === 'undefined' || !process.env) return {};
  return {
    PORTAL_USERNAME: process.env.PORTAL_USERNAME,
    PORTAL_PASSWORD: process.env.PORTAL_PASSWORD,
    PORTAL_USERS: process.env.PORTAL_USERS,
    PORTAL_TITLE: process.env.PORTAL_TITLE,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_TTL_HOURS: process.env.SESSION_TTL_HOURS,
    VAULT_KEY: process.env.VAULT_KEY,
    DASHBOARDS: process.env.DASHBOARDS,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    STATUS_ALLOW_PRIVATE: process.env.STATUS_ALLOW_PRIVATE,
  };
}

export function getConfig(env = readEnv()) {
  const { users, problems: userProblems } = parseUsers(env);
  return {
    userProblems,
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
  for (const text of cfg.userProblems || []) w.push({ level: 'warn', code: 'users', text });
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
