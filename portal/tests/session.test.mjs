import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getConfig } from '../lib/config.js';
import { b64urlEncode, hmacSign, utf8 } from '../lib/crypto.js';
import {
  COOKIE_NAME, clearSessionCookie, createSessionToken, findUser, getSession, isHttps,
  parseCookies, sessionCookie, verifySessionToken,
} from '../lib/session.js';
import { ADMIN, VIEWER, baseEnv, env } from './helpers/portal.mjs';

const SECRET = 'unit-session-secret';

function cfgWith(extra = {}) {
  return getConfig({ ...baseEnv({ SESSION_SECRET: SECRET }), ...extra });
}

/* Builds a token exactly as the product does, so payload fields can be chosen freely. */
async function forge(payload, secret = SECRET) {
  const body = 'v1.' + b64urlEncode(utf8(typeof payload === 'string' ? payload : JSON.stringify(payload)));
  return body + '.' + b64urlEncode(await hmacSign(secret, body));
}
async function pv(user, secret = SECRET) {
  return b64urlEncode(await hmacSign(secret, 'pv:' + user.username.toLowerCase() + '\u0000' + user.password)).slice(0, 16);
}
const now = () => Math.floor(Date.now() / 1000);

function decodePayload(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

describe('lib/session.js', () => {
  describe('create / verify', () => {
    it('round-trips a session and reports username, role and expiry', async () => {
      const cfg = cfgWith();
      const user = findUser(cfg, 'admin');
      const { token, maxAge } = await createSessionToken(user, cfg);
      assert.match(token, /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
      assert.equal(maxAge, 12 * 3600);
      const s = await verifySessionToken(token, cfg);
      assert.deepEqual(Object.keys(s).sort(), ['exp', 'iat', 'issuedMs', 'role', 'sid', 'username']);
      assert.equal(s.username, 'admin');
      assert.equal(s.role, 'admin');
      assert.ok(Math.abs(s.exp - (now() + 12 * 3600)) <= 2);
      assert.ok(Math.abs(s.iat - now()) <= 2);
      assert.ok(Math.abs(s.issuedMs - Date.now()) < 5000, 'millisecond issue time');
      assert.match(s.sid, /^[A-Za-z0-9_-]{16}$/, 'random session id');
    });

    it('never puts the password itself in the token', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      const payload = decodePayload(token);
      assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'ms', 'pv', 'r', 'sid', 'u']);
      assert.ok(!JSON.stringify(payload).includes(ADMIN.password));
      assert.ok(!token.includes(Buffer.from(ADMIN.password).toString('base64url')));
    });

    it('gives every session a distinct id', async () => {
      const cfg = cfgWith();
      const user = findUser(cfg, 'admin');
      const ids = new Set();
      for (let i = 0; i < 20; i++) ids.add(decodePayload((await createSessionToken(user, cfg)).token).sid);
      assert.equal(ids.size, 20);
    });

    it('honours SESSION_TTL_HOURS', async () => {
      const cfg = cfgWith({ SESSION_TTL_HOURS: '2' });
      const { token, maxAge } = await createSessionToken(findUser(cfg, 'viewer'), cfg);
      assert.equal(maxAge, 7200);
      const p = decodePayload(token);
      assert.equal(p.exp - p.iat, 7200);
    });

    it('uses getConfig() from process.env by default', async (t) => {
      env(t, baseEnv());
      const cfg = getConfig();
      const { token } = await createSessionToken(findUser(cfg, 'viewer'));
      const s = await verifySessionToken(token);
      assert.equal(s.username, 'viewer');
      assert.equal(s.role, 'viewer');
    });

    it('findUser is case-insensitive and trims', () => {
      const cfg = cfgWith();
      assert.equal(findUser(cfg, '  ADMIN ').username, 'admin');
      assert.equal(findUser(cfg, 'Viewer').role, 'viewer');
      assert.equal(findUser(cfg, 'nobody'), null);
      assert.equal(findUser(cfg, ''), null);
      assert.equal(findUser(cfg, null), null);
    });
  });

  describe('rejection', () => {
    it('rejects a tampered payload (re-encoded with a different user or role)', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'viewer'), cfg);
      const [v, , sig] = token.split('.');
      const p = decodePayload(token);
      for (const change of [{ u: 'admin' }, { r: 'admin' }, { exp: p.exp + 10_000 }]) {
        const evil = v + '.' + b64urlEncode(utf8(JSON.stringify({ ...p, ...change }))) + '.' + sig;
        assert.equal(await verifySessionToken(evil, cfg), null, JSON.stringify(change));
      }
    });

    it('rejects a tampered or truncated signature', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      const [v, p, sig] = token.split('.');
      const flipped = (sig[0] === 'A' ? 'B' : 'A') + sig.slice(1);
      assert.equal(await verifySessionToken(`${v}.${p}.${flipped}`, cfg), null);
      assert.equal(await verifySessionToken(`${v}.${p}.${sig.slice(0, -4)}`, cfg), null);
      assert.equal(await verifySessionToken(`${v}.${p}.`, cfg), null);
      assert.equal(await verifySessionToken(`${v}.${p}.not+base64/`, cfg), null);
      assert.equal(await verifySessionToken(`${v}.${p}`, cfg), null);
    });

    it('rejects a token signed with another SESSION_SECRET', async () => {
      const cfgA = cfgWith({ SESSION_SECRET: 'secret-A' });
      const cfgB = cfgWith({ SESSION_SECRET: 'secret-B' });
      const { token } = await createSessionToken(findUser(cfgA, 'admin'), cfgA);
      assert.ok(await verifySessionToken(token, cfgA));
      assert.equal(await verifySessionToken(token, cfgB), null);
    });

    it('rejects malformed tokens', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      const bad = [
        undefined, null, 42, {}, '', 'v1', 'v1..', 'a.b.c', token.replace(/^v1/, 'v2'),
        token + '.extra', 'v1.' + 'A'.repeat(3000) + '.sig',
      ];
      for (const b of bad) assert.equal(await verifySessionToken(b, cfg), null, String(b).slice(0, 40));
    });

    it('rejects validly-signed payloads that are not session objects', async () => {
      const cfg = cfgWith();
      for (const payload of ['not json', 'null', '"string"', '[]', '42', '{}']) {
        assert.equal(await verifySessionToken(await forge(payload), cfg), null, payload);
      }
    });

    it('rejects an expired token', async () => {
      const cfg = cfgWith();
      const admin = findUser(cfg, 'admin');
      const expired = await forge({ u: 'admin', r: 'admin', pv: await pv(admin), iat: now() - 7200, exp: now() - 1 });
      assert.equal(await verifySessionToken(expired, cfg), null);
      const atNow = await forge({ u: 'admin', r: 'admin', pv: await pv(admin), iat: now() - 7200, exp: now() });
      assert.equal(await verifySessionToken(atNow, cfg), null, 'exp == now is already expired');
      const ok = await forge({ u: 'admin', r: 'admin', pv: await pv(admin), iat: now(), exp: now() + 60 });
      assert.ok(await verifySessionToken(ok, cfg));
    });

    it('rejects a real token once its lifetime has passed (mocked clock)', async (t) => {
      const cfg = cfgWith({ SESSION_TTL_HOURS: '1' });
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      assert.ok(await verifySessionToken(token, cfg));
      const later = Date.now() + 3600 * 1000 + 5000;
      t.mock.method(Date, 'now', () => later);
      assert.equal(await verifySessionToken(token, cfg), null);
    });

    it('rejects missing or non-numeric exp / iat', async () => {
      const cfg = cfgWith();
      const base = { u: 'admin', r: 'admin', pv: await pv(findUser(cfg, 'admin')), iat: now(), exp: now() + 600 };
      for (const change of [{ exp: undefined }, { exp: String(now() + 600) }, { iat: undefined }, { iat: '0' }]) {
        assert.equal(await verifySessionToken(await forge({ ...base, ...change }), cfg), null, JSON.stringify(change));
      }
    });

    it('rejects iat more than 60 s in the future but tolerates small clock skew', async () => {
      const cfg = cfgWith();
      const p = await pv(findUser(cfg, 'admin'));
      const future = await forge({ u: 'admin', r: 'admin', pv: p, iat: now() + 120, exp: now() + 3600 });
      assert.equal(await verifySessionToken(future, cfg), null);
      const skew = await forge({ u: 'admin', r: 'admin', pv: p, iat: now() + 30, exp: now() + 3600 });
      assert.ok(await verifySessionToken(skew, cfg));
    });

    it('a password change invalidates existing sessions for that user only', async () => {
      const cfg = cfgWith();
      const adminTok = (await createSessionToken(findUser(cfg, 'admin'), cfg)).token;
      const viewerTok = (await createSessionToken(findUser(cfg, 'viewer'), cfg)).token;
      const changed = cfgWith({ PORTAL_PASSWORD: 'A-New-Password-1' });
      assert.equal(await verifySessionToken(adminTok, changed), null);
      assert.equal((await verifySessionToken(viewerTok, changed)).username, 'viewer');
    });

    it('rejects the session of a user who has been removed', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'viewer'), cfg);
      const removed = cfgWith({ PORTAL_USERS: '[]' });
      assert.equal(await verifySessionToken(token, removed), null);
    });

    it('rejects everything when no users are configured', async () => {
      const cfg = cfgWith();
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      const none = getConfig({ SESSION_SECRET: SECRET });
      assert.equal(none.users.length, 0);
      assert.equal(await verifySessionToken(token, none), null);
    });

    it('a token for a username nobody has cannot be forged without the password', async () => {
      const cfg = cfgWith();
      const tok = await forge({ u: 'admin', r: 'admin', pv: 'AAAAAAAAAAAAAAAA', iat: now(), exp: now() + 600 });
      assert.equal(await verifySessionToken(tok, cfg), null);
    });
  });

  describe('role comes from config, not the token', () => {
    it('a token claiming admin for a viewer yields role viewer', async () => {
      const cfg = cfgWith();
      const viewer = findUser(cfg, 'viewer');
      const tok = await forge({ u: 'viewer', r: 'admin', pv: await pv(viewer), iat: now(), exp: now() + 600 });
      const s = await verifySessionToken(tok, cfg);
      assert.equal(s.role, 'viewer');
    });

    it('a demotion takes effect on the next request', async () => {
      const promoted = cfgWith({ PORTAL_USERS: JSON.stringify([{ ...VIEWER, role: 'admin' }]) });
      const { token } = await createSessionToken(findUser(promoted, 'viewer'), promoted);
      assert.equal((await verifySessionToken(token, promoted)).role, 'admin');
      const demoted = cfgWith({ PORTAL_USERS: JSON.stringify([{ ...VIEWER, role: 'viewer' }]) });
      assert.equal((await verifySessionToken(token, demoted)).role, 'viewer');
    });

    it('a username differing only in case maps to the configured spelling', async () => {
      const cfg = cfgWith();
      const admin = findUser(cfg, 'admin');
      const tok = await forge({ u: 'ADMIN', r: 'viewer', pv: await pv(admin), iat: now(), exp: now() + 600 });
      const s = await verifySessionToken(tok, cfg);
      assert.deepEqual([s.username, s.role], ['admin', 'admin']);
    });
  });

  describe('without SESSION_SECRET', () => {
    it('signs with a key derived from the passwords; changing any password logs everyone out', async () => {
      const cfg = cfgWith({ SESSION_SECRET: undefined });
      assert.equal(cfg.sessionSecret, null);
      const { token } = await createSessionToken(findUser(cfg, 'admin'), cfg);
      assert.ok(await verifySessionToken(token, cfg));
      const viewerChanged = cfgWith({
        SESSION_SECRET: undefined,
        PORTAL_USERS: JSON.stringify([{ username: 'viewer', password: 'changed', role: 'viewer' }]),
      });
      assert.equal(await verifySessionToken(token, viewerChanged), null);
      assert.equal(await verifySessionToken(token, cfgWith({ SESSION_SECRET: 'now-set' })), null);
    });
  });

  describe('parseCookies', () => {
    it('handles empty input', () => {
      assert.deepEqual(parseCookies(null), {});
      assert.deepEqual(parseCookies(undefined), {});
      assert.deepEqual(parseCookies(''), {});
    });

    it('parses several cookies with odd spacing', () => {
      assert.deepEqual(parseCookies('a=1; b=2;c=3 ;  d = 4 '), { a: '1', b: '2', c: '3', d: '4' });
    });

    it('keeps the first of duplicate names', () => {
      assert.deepEqual(parseCookies('portal_session=first; portal_session=second'), { portal_session: 'first' });
    });

    it('keeps "=" inside values, strips quotes and URL-decodes', () => {
      assert.deepEqual(parseCookies('x=a=b=c; y="quoted"; z=hello%20world'), { x: 'a=b=c', y: 'quoted', z: 'hello world' });
    });

    it('keeps malformed percent-encoding raw instead of throwing', () => {
      assert.deepEqual(parseCookies('bad=%E0%A4%A; good=1'), { bad: '%E0%A4%A', good: '1' });
    });

    it('skips parts without "=" and empty names', () => {
      assert.deepEqual(parseCookies('flag; =orphan; a=1;;'), { a: '1' });
    });

    it('allows empty values', () => {
      assert.deepEqual(parseCookies('a=; b=2'), { a: '', b: '2' });
    });

    it('does not let prototype names pollute or shadow anything', () => {
      const out = parseCookies('__proto__=x; constructor=y; portal_session=tok');
      assert.equal(out.portal_session, 'tok');
      assert.equal(Object.getPrototypeOf(out), Object.prototype);
      assert.equal(({}).x, undefined);
    });
  });

  describe('getSession', () => {
    it('reads the portal_session cookie among others', async (t) => {
      env(t, baseEnv());
      const cfg = getConfig();
      const { token } = await createSessionToken(findUser(cfg, 'viewer'), cfg);
      const request = new Request('https://portal.test/', { headers: { cookie: `other=1; ${COOKIE_NAME}=${token}; z=2` } });
      assert.equal((await getSession(request)).username, 'viewer');
      assert.equal(await getSession(new Request('https://portal.test/')), null);
      assert.equal(await getSession(new Request('https://portal.test/', { headers: { cookie: `${COOKIE_NAME}=garbage` } })), null);
      assert.equal(await getSession(new Request('https://portal.test/', { headers: { cookie: `${COOKIE_NAME}=` } })), null);
    });
  });

  describe('cookie attributes', () => {
    const httpReq = (headers = {}) => new Request('http://portal.test/api/login', { headers });
    const httpsReq = (headers = {}) => new Request('https://portal.test/api/login', { headers });
    const attrs = (c) => c.split(';').map((s) => s.trim());

    it('isHttps prefers x-forwarded-proto (first value) over the URL', () => {
      assert.equal(isHttps(httpReq()), false);
      assert.equal(isHttps(httpsReq()), true);
      assert.equal(isHttps(httpReq({ 'x-forwarded-proto': 'https' })), true);
      assert.equal(isHttps(httpsReq({ 'x-forwarded-proto': 'http' })), false);
      assert.equal(isHttps(httpReq({ 'x-forwarded-proto': 'https, http' })), true);
      assert.equal(isHttps(httpReq({ 'x-forwarded-proto': ' http ,https' })), false);
    });

    it('session cookie over http: HttpOnly, SameSite=Lax, Path=/, Max-Age, no Secure', () => {
      const c = sessionCookie(httpReq(), 'tok', 3600);
      const a = attrs(c);
      assert.equal(a[0], 'portal_session=tok');
      assert.ok(a.includes('HttpOnly'));
      assert.ok(a.includes('SameSite=Lax'));
      assert.ok(a.includes('Path=/'));
      assert.ok(a.includes('Max-Age=3600'));
      assert.ok(!a.includes('Secure'));
    });

    it('session cookie over https (or forwarded https) adds Secure', () => {
      assert.ok(attrs(sessionCookie(httpsReq(), 'tok', 10)).includes('Secure'));
      assert.ok(attrs(sessionCookie(httpReq({ 'x-forwarded-proto': 'https' }), 'tok', 10)).includes('Secure'));
    });

    it('Max-Age is a non-negative integer', () => {
      assert.ok(attrs(sessionCookie(httpReq(), 't', -5)).includes('Max-Age=0'));
      assert.ok(attrs(sessionCookie(httpReq(), 't', 12.9)).includes('Max-Age=12'));
    });

    it('clear cookie expires immediately and keeps the same scope', () => {
      const a = attrs(clearSessionCookie(httpsReq()));
      assert.equal(a[0], 'portal_session=');
      assert.ok(a.includes('Max-Age=0'));
      assert.ok(a.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'));
      assert.ok(a.includes('Path=/'));
      assert.ok(a.includes('HttpOnly'));
      assert.ok(a.includes('SameSite=Lax'));
      assert.ok(a.includes('Secure'));
      assert.ok(!attrs(clearSessionCookie(httpReq())).includes('Secure'));
    });
  });
});
