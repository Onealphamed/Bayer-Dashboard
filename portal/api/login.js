/*
 * POST /api/login
 * Accepts JSON {username, password, next} from the login page, or a classic
 * form post (so the page still works with JavaScript disabled).
 */
import { getConfig } from '../lib/config.js';
import { safeEqual } from '../lib/crypto.js';
import { HttpError, assertSameOrigin, clientIp, errorResponse, json } from '../lib/http.js';
import { createSessionToken, sessionCookie } from '../lib/session.js';
import { audit, clearHits, hit, peek } from '../lib/store.js';

const WINDOW_SEC = 15 * 60;
const MAX_FAILS_PER_IP = 10;
const MAX_FAILS_PER_USER = 20;

/** Only same-site relative paths, so `next` can never become an open redirect. */
export function safeNext(value) {
  if (typeof value !== 'string') return '/';
  const v = value.trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\') || v.includes('\\')) return '/';
  if (/[\u0000-\u001f]/.test(v)) return '/';
  try {
    const u = new URL(v, 'https://portal.invalid');
    if (u.origin !== 'https://portal.invalid') return '/';
    if (u.pathname === '/login' || u.pathname.startsWith('/api/')) return '/';
    return u.pathname + u.search + u.hash;
  } catch {
    return '/';
  }
}

async function readCredentials(request) {
  const type = (request.headers.get('content-type') || '').toLowerCase();
  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len > 8192) throw new HttpError(413, 'Request body too large.');
  if (type.startsWith('application/json')) {
    let body;
    try {
      body = JSON.parse((await request.text()) || '{}');
    } catch {
      throw new HttpError(400, 'Malformed JSON.');
    }
    return { username: body.username, password: body.password, next: body.next, form: false };
  }
  if (type.startsWith('application/x-www-form-urlencoded') || type.startsWith('multipart/form-data')) {
    const fd = await request.formData();
    return { username: fd.get('username'), password: fd.get('password'), next: fd.get('next'), form: true };
  }
  throw new HttpError(415, 'Unsupported login request.');
}

/** Checks every configured user without short-circuiting, so timing does not reveal which IDs exist. */
async function authenticate(cfg, username, password) {
  let match = null;
  const uname = String(username).trim().toLowerCase();
  for (const user of cfg.users) {
    const [uOk, pOk] = await Promise.all([
      safeEqual(user.username.toLowerCase(), uname),
      safeEqual(user.password, String(password)),
    ]);
    if (uOk && pOk && !match) match = user;
  }
  return match;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request) {
  let creds = { form: false };
  try {
    assertSameOrigin(request);
    const cfg = getConfig();
    creds = await readCredentials(request);

    if (!cfg.users.length) {
      throw new HttpError(503, 'Login is not configured yet. Set PORTAL_USERNAME and PORTAL_PASSWORD in Vercel.');
    }

    const username = typeof creds.username === 'string' ? creds.username.slice(0, 200) : '';
    const password = typeof creds.password === 'string' ? creds.password.slice(0, 500) : '';
    const ip = clientIp(request);
    const ipKey = 'login:ip:' + ip;
    const userKey = 'login:user:' + username.trim().toLowerCase();

    const [ipFails, userFails] = await Promise.all([peek(cfg, ipKey, WINDOW_SEC), peek(cfg, userKey, WINDOW_SEC)]);
    if (ipFails >= MAX_FAILS_PER_IP || userFails >= MAX_FAILS_PER_USER) {
      throw new HttpError(429, 'Too many sign-in attempts. Wait 15 minutes and try again.', { retryAfter: WINDOW_SEC });
    }

    const user = username && password ? await authenticate(cfg, username, password) : null;
    if (!user) {
      await Promise.all([hit(cfg, ipKey, MAX_FAILS_PER_IP, WINDOW_SEC), hit(cfg, userKey, MAX_FAILS_PER_USER, WINDOW_SEC)]);
      await audit(cfg, { type: 'login_failed', user: username.trim().slice(0, 80) || '(blank)', ip });
      await sleep(350 + Math.floor(Math.random() * 250));
      throw new HttpError(401, 'Incorrect login ID or password.');
    }

    await clearHits(cfg, ipKey);
    const { token, maxAge } = await createSessionToken(user, cfg);
    await audit(cfg, { type: 'login', user: user.username, ip });

    const next = safeNext(creds.next);
    const cookie = sessionCookie(request, token, maxAge);
    if (creds.form) {
      return new Response(null, {
        status: 303,
        headers: { Location: next, 'Set-Cookie': cookie, 'Cache-Control': 'no-store' },
      });
    }
    return json({ ok: true, next, user: { username: user.username, role: user.role } }, 200, { 'Set-Cookie': cookie });
  } catch (err) {
    if (creds.form && err instanceof HttpError) {
      const code = err.status === 429 ? 'locked' : (err.status === 401 ? 'invalid' : 'error');
      return new Response(null, {
        status: 303,
        headers: { Location: '/login?error=' + code, 'Cache-Control': 'no-store' },
      });
    }
    return errorResponse(err);
  }
}

/* GET /api/login — the portal title for the sign-in screen. Public and harmless. */
export async function GET() {
  return json({ title: getConfig().title, configured: getConfig().users.length > 0 });
}
