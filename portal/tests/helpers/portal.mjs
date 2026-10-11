/*
 * Shared test helpers: per-test environment variables, Web Request builders and
 * a sign-in helper that goes through the real /api/login handler.
 *
 * Config is read from process.env on every call, so each test sets exactly the
 * variables it needs with env(t, {...}); everything is restored afterwards.
 */
import { POST as loginPOST } from '../../api/login.js';

/** Every variable the portal reads. env() clears all of them before applying a test's values. */
export const PORTAL_ENV_KEYS = [
  'PORTAL_USERNAME', 'PORTAL_PASSWORD', 'PORTAL_USERS', 'PORTAL_TITLE',
  'SESSION_SECRET', 'SESSION_TTL_HOURS', 'VAULT_KEY', 'DASHBOARDS',
  'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  'STATUS_ALLOW_PRIVATE',
];

/** Replaces the portal's environment with `vars`; returns a function that restores the previous values. */
export function setEnv(vars = {}) {
  const keys = new Set([...PORTAL_ENV_KEYS, ...Object.keys(vars)]);
  const saved = {};
  for (const k of keys) {
    saved[k] = Object.prototype.hasOwnProperty.call(process.env, k) ? process.env[k] : undefined;
    delete process.env[k];
  }
  for (const [k, v] of Object.entries(vars)) {
    if (v !== undefined && v !== null) process.env[k] = String(v);
  }
  return () => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  };
}

/** setEnv() scoped to one node:test test: restored automatically when the test ends. */
export function env(t, vars = {}) {
  const restore = setEnv(vars);
  t.after(restore);
  return vars;
}

export const ADMIN = { username: 'admin', password: 'Admin-Pass-123' };
export const VIEWER = { username: 'viewer', password: 'Viewer-Pass-456' };

/** A complete, healthy configuration (env storage mode). */
export function baseEnv(extra = {}) {
  return {
    PORTAL_USERNAME: ADMIN.username,
    PORTAL_PASSWORD: ADMIN.password,
    PORTAL_USERS: JSON.stringify([{ ...VIEWER, role: 'viewer' }]),
    SESSION_SECRET: 'test-session-secret-0123456789',
    VAULT_KEY: 'test-vault-key-0123456789',
    ...extra,
  };
}

/* Fake dashboards only: real credentials must never live in the test suite. */
export const SEED = [
  {
    name: 'SEO Tracker', url: 'https://seo.example.com', category: 'Marketing',
    username: 'seo-admin', password: 'seo-secret-pw-111',
    links: [{ label: 'Admin', url: 'https://seo.example.com/admin' }],
  },
  {
    name: 'Bridge Dashboard', url: 'https://bridge.example.com', category: 'Projects',
    username: 'bridge', password: 'bridge-secret-pw-222',
  },
  { name: 'PMO', url: 'https://pmo.example.com' },
];
export const SEED_PASSWORDS = SEED.map((d) => d.password).filter(Boolean);

export const BASE_URL = 'https://portal.test';
export const ORIGIN = BASE_URL;

let ipCounter = 0;
/** A unique client IP per call, so per-IP rate-limit buckets never leak between tests. */
export function uniqueIp() {
  ipCounter++;
  return `198.51.${Math.floor(ipCounter / 250) % 250}.${(ipCounter % 250) + 1}`;
}

/**
 * Builds a Web Request the way Vercel would hand it to a function.
 * Mutating methods carry a same-origin Origin header by default (as browsers send),
 * unless `origin: false` or an explicit Origin header is supplied.
 */
export function req(path, {
  method = 'GET', json, body, headers = {}, cookie, ip, origin, base = BASE_URL,
} = {}) {
  const h = new Headers(headers);
  if (cookie) h.set('cookie', cookie);
  h.set('x-real-ip', ip || '192.0.2.10');
  let payload;
  if (json !== undefined) {
    payload = JSON.stringify(json);
    if (!h.has('content-type')) h.set('content-type', 'application/json');
  } else if (body !== undefined) {
    payload = body;
  }
  if (method !== 'GET' && method !== 'HEAD' && origin !== false && !h.has('origin')) {
    h.set('origin', origin || new URL(base).origin);
  }
  return new Request(base + path, { method, headers: h, body: payload });
}

export async function readBody(res) {
  const text = await res.text();
  try {
    return { text, data: JSON.parse(text) };
  } catch {
    return { text, data: null };
  }
}

/** Calls a handler and returns { res, status, data, text }. */
export async function call(handler, request) {
  const res = await handler(request);
  const { text, data } = await readBody(res);
  return { res, status: res.status, data, text };
}

/** Signs in through the real login handler and returns a Cookie header value. */
export async function signIn(user = ADMIN, { ip } = {}) {
  const res = await loginPOST(req('/api/login', {
    method: 'POST', json: { username: user.username, password: user.password }, ip: ip || uniqueIp(),
  }));
  if (res.status !== 200) {
    throw new Error(`sign-in as ${user.username} failed: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie');
  return setCookie.split(';')[0];
}
