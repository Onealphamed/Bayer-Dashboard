/*
 * Stateless signed sessions.
 *
 * Token:  v1.<base64url(payload JSON)>.<base64url(HMAC-SHA256)>
 * Payload: { u: username, r: role, pv: password-version, sid, ms, iat, exp }
 *   sid  random session id, so one session can be signed out server-side
 *   ms   issue time in milliseconds, compared against "sign out everywhere"
 *
 * `pv` is a MAC over the user's current password, so changing a password (or
 * removing a user) in the environment invalidates every session for that user
 * on the next request — no server-side session store needed.
 */
import { getConfig } from './config.js';
import { b64urlDecode, b64urlEncode, fromUtf8, hmacSign, hmacVerify, randomId, utf8 } from './crypto.js';

export const COOKIE_NAME = 'portal_session';

function signingSecret(cfg) {
  if (cfg.sessionSecret) return cfg.sessionSecret;
  // Fallback keeps the portal usable when SESSION_SECRET is missing. Anyone able
  // to derive it already knows a password, so it grants nothing extra.
  return 'derived-session-secret:' + cfg.users
    .map((u) => u.username.toLowerCase() + '\u0000' + u.password)
    .sort()
    .join('\u0001');
}

async function passwordVersion(secret, user) {
  const mac = await hmacSign(secret, 'pv:' + user.username.toLowerCase() + '\u0000' + user.password);
  return b64urlEncode(mac).slice(0, 16);
}

export function findUser(cfg, username) {
  const key = String(username || '').trim().toLowerCase();
  return cfg.users.find((u) => u.username.toLowerCase() === key) || null;
}

export async function createSessionToken(user, cfg = getConfig()) {
  const secret = signingSecret(cfg);
  const nowMs = Date.now();
  const now = Math.floor(nowMs / 1000);
  const payload = {
    u: user.username,
    r: user.role,
    pv: await passwordVersion(secret, user),
    sid: randomId(),
    ms: nowMs,
    iat: now,
    exp: now + cfg.sessionTtlHours * 3600,
  };
  const body = 'v1.' + b64urlEncode(utf8(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmacSign(secret, body));
  return { token: body + '.' + sig, maxAge: payload.exp - now };
}

/** Returns { username, role, exp, iat, issuedMs, sid } for a valid token, otherwise null. */
export async function verifySessionToken(token, cfg = getConfig()) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  if (!cfg.users.length) return null;

  const secret = signingSecret(cfg);
  let sig;
  try {
    sig = b64urlDecode(parts[2]);
  } catch {
    return null;
  }
  const body = parts[0] + '.' + parts[1];
  if (!(await hmacVerify(secret, body, sig))) return null;

  let payload;
  try {
    payload = JSON.parse(fromUtf8(b64urlDecode(parts[1])));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  if (typeof payload.iat !== 'number' || payload.iat > now + 60) return null;

  const user = findUser(cfg, payload.u);
  if (!user) return null;
  if (payload.pv !== (await passwordVersion(secret, user))) return null;

  // Role always comes from current config, never from the token, so a
  // demotion takes effect immediately.
  return {
    username: user.username,
    role: user.role,
    exp: payload.exp,
    iat: payload.iat,
    issuedMs: typeof payload.ms === 'number' ? payload.ms : payload.iat * 1000,
    sid: typeof payload.sid === 'string' ? payload.sid : null,
  };
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    if (!name || name in out) continue;
    let value = part.slice(i + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

export function isHttps(request) {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return new URL(request.url).protocol === 'https:';
}

export function sessionCookie(request, token, maxAge) {
  return [
    COOKIE_NAME + '=' + token,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.max(0, Math.floor(maxAge)),
    isHttps(request) ? 'Secure' : null,
  ].filter(Boolean).join('; ');
}

export function clearSessionCookie(request) {
  return [
    COOKIE_NAME + '=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    isHttps(request) ? 'Secure' : null,
  ].filter(Boolean).join('; ');
}

export async function getSession(request, cfg = getConfig()) {
  const token = parseCookies(request.headers.get('cookie'))[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token, cfg);
}
