/*
 * Shared request/response plumbing for the API functions.
 * Every API function re-checks the session itself; the middleware gate is a
 * convenience for page loads, never the only line of defence.
 */
import { getConfig } from './config.js';
import { HttpError } from './errors.js';
import { clearSessionCookie, getSession } from './session.js';
import { isRevoked } from './store.js';

export { HttpError };

const MAX_BODY_BYTES = 64 * 1024;

const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    const headers = { ...(err.headers || {}) };
    if (err.status === 429 && err.extra && err.extra.retryAfter) headers['Retry-After'] = String(err.extra.retryAfter);
    return json({ error: err.message, ...(err.extra || {}) }, err.status, headers);
  }
  // Never leak internals; the detail goes to the platform log.
  console.error('[portal] unhandled error:', err && err.stack ? err.stack : err);
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}

/** Wraps a handler so thrown HttpErrors become JSON responses. */
export function handle(fn) {
  return async (request) => {
    try {
      return await fn(request);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function clientIp(request) {
  const h = request.headers;
  const real = h.get('x-real-ip');
  if (real) return real.trim();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return 'unknown';
}

/**
 * Cross-site request forgery guard for state-changing requests. Browsers always
 * send Origin on cross-origin POST/PUT/DELETE; when present it must match this
 * host. Sec-Fetch-Site is checked as a second signal.
 */
export function assertSameOrigin(request) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') {
    throw new HttpError(403, 'Cross-site request blocked.');
  }
  if (!origin) return;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, 'Cross-site request blocked.');
  }
  const hosts = new Set([new URL(request.url).host]);
  const host = request.headers.get('host');
  if (host) hosts.add(host);
  const fwdHost = request.headers.get('x-forwarded-host');
  if (fwdHost) hosts.add(fwdHost.split(',')[0].trim());
  if (!hosts.has(originHost)) throw new HttpError(403, 'Cross-site request blocked.');
}

export async function readJson(request, { maxBytes = MAX_BODY_BYTES } = {}) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (!type.startsWith('application/json')) {
    throw new HttpError(415, 'Expected a JSON request body.');
  }
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > maxBytes) throw new HttpError(413, 'Request body too large.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Request body too large.');
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, 'Malformed JSON.');
  }
  // Every endpoint takes an object; `null`, arrays and bare values are refused
  // here so handlers can read fields without a type check of their own.
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  return body;
}

/**
 * Rejects authenticated API calls a browser made on another site's behalf,
 * including plain top-level navigations (which carry the SameSite=Lax cookie).
 * The hub only ever calls its API with same-origin fetch, so nothing
 * legitimate is lost; non-browser clients send no fetch metadata and pass.
 */
export function assertNotCrossSite(request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') {
    throw new HttpError(403, 'Cross-site request blocked.');
  }
}

/**
 * The signed-in user, or a 401. A session that was signed out (or ended by
 * "sign out everywhere") is refused and its cookie cleared, so the browser
 * lands cleanly on the sign-in page instead of looping. `strict` makes a
 * storage outage fail closed: used for revealing and exporting passwords.
 */
export async function requireSession(request, cfg = getConfig(), { strict = false } = {}) {
  assertNotCrossSite(request);
  const session = await getSession(request, cfg);
  if (!session) throw new HttpError(401, 'Not signed in.');
  if (await isRevoked(cfg, session, { strict })) {
    throw new HttpError(401, 'Your session has ended. Please sign in again.', { signedOut: true },
      { 'Set-Cookie': clearSessionCookie(request) });
  }
  return session;
}

export async function requireAdmin(request, cfg = getConfig(), opts) {
  const session = await requireSession(request, cfg, opts);
  if (session.role !== 'admin') throw new HttpError(403, 'Only an admin can do that.');
  return session;
}

export function methodNotAllowed(allowed) {
  return () => json({ error: 'Method not allowed.' }, 405, { Allow: allowed.join(', ') });
}
