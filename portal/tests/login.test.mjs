import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET as loginGET, POST as loginPOST, safeNext } from '../api/login.js';
import { GET as meGET } from '../api/me.js';
import { getConfig } from '../lib/config.js';
import { hit, peek } from '../lib/store.js';
import { ADMIN, VIEWER, baseEnv, call, env, req, uniqueIp } from './helpers/portal.mjs';

const login = (json, opts = {}) => call(loginPOST, req('/api/login', { method: 'POST', json, ip: opts.ip || uniqueIp(), ...opts }));
const cookieOf = (res) => res.headers.get('set-cookie');

describe('api/login.js', () => {
  describe('safeNext (open-redirect guard)', () => {
    it('keeps same-site relative paths with query and hash', () => {
      assert.equal(safeNext('/'), '/');
      assert.equal(safeNext('/dash'), '/dash');
      assert.equal(safeNext('/dash?x=1&y=2#frag'), '/dash?x=1&y=2#frag');
      assert.equal(safeNext('  /dash  '), '/dash');
      assert.equal(safeNext('/a/b/../c'), '/a/c');
      assert.equal(safeNext('/%2F%2Fevil.com'), '/%2F%2Fevil.com', 'encoded slashes stay a path');
    });

    it('falls back to / for non-strings and empty values', () => {
      for (const v of [undefined, null, 42, {}, ['/x'], '', '   ']) assert.equal(safeNext(v), '/', String(v));
    });

    it('rejects absolute and protocol-relative URLs', () => {
      for (const v of [
        'https://evil.com', 'http://evil.com/', 'HTTPS://evil.com', '//evil.com', '///evil.com', '//evil.com/%2F..',
        ' //evil.com', 'javascript:alert(1)', 'data:text/html,x', 'evil.com', './/evil.com', '?next=//evil.com',
      ]) {
        assert.equal(safeNext(v), '/', v);
      }
    });

    it('rejects backslash tricks', () => {
      for (const v of ['/\\evil.com', '\\\\evil.com', '/\\/evil.com', '/foo\\bar', '\\/evil.com']) {
        assert.equal(safeNext(v), '/', JSON.stringify(v));
      }
    });

    it('rejects control characters (tabs and newlines are stripped by URL parsers)', () => {
      for (const v of ['/\t/evil.com', '/\n/evil.com', '/\r\n/evil.com', '/x\u0000', '/\u001f']) {
        assert.equal(safeNext(v), '/', JSON.stringify(v));
      }
    });

    it('never sends the user back to the login page or an API endpoint', () => {
      for (const v of ['/login', '/login?next=/x', '/login#x', '/./login', '/x/../login', '/api/dashboards', '/api/logout?x=1']) {
        assert.equal(safeNext(v), '/', v);
      }
    });

    it('never yields a protocol-relative URL after dot-segment normalisation', () => {
      // '/..//evil.com' passes the leading-character checks, then URL parsing
      // collapses it to the path '//evil.com'. Returned as-is, that is a
      // protocol-relative Location / location.replace() target: an open redirect.
      for (const v of ['/..//evil.com', '/.//evil.com', '/a/..//evil.com', '/%2e%2e//evil.com', '/%2e//evil.com']) {
        const out = safeNext(v);
        assert.ok(!out.startsWith('//'), `${v} -> ${out}`);
        assert.equal(new URL(out, 'https://portal.example').origin, 'https://portal.example', `${v} -> ${out}`);
      }
    });

    it('whatever it returns always resolves on the same origin', () => {
      const inputs = ['/', '/x', '//x', '/\\x', '/%5Cevil.com', '/@evil.com', '/:evil.com', '/;//evil.com', '/.%2e/x',
        '/%09/evil.com', '/foo?u=https://evil.com'];
      for (const v of inputs) {
        const out = safeNext(v);
        assert.ok(out.startsWith('/') && !out.startsWith('//') && !out.startsWith('/\\'), `${v} -> ${out}`);
        assert.equal(new URL(out, 'https://portal.example').origin, 'https://portal.example', `${v} -> ${out}`);
      }
    });
  });

  describe('GET /api/login', () => {
    it('returns the title and whether login is configured', async (t) => {
      env(t, baseEnv({ PORTAL_TITLE: 'Hub' }));
      const r = await call(loginGET, req('/api/login'));
      assert.equal(r.status, 200);
      assert.deepEqual(r.data, { title: 'Hub', configured: true });
      process.env.PORTAL_USERNAME = '';
      process.env.PORTAL_USERS = '';
      assert.deepEqual((await call(loginGET, req('/api/login'))).data, { title: 'Hub', configured: false });
    });
  });

  describe('POST /api/login (JSON)', () => {
    it('signs in the admin, sets the session cookie and returns a safe next', async (t) => {
      env(t, baseEnv());
      const r = await login({ ...ADMIN, next: '/reports?tab=2' });
      assert.equal(r.status, 200);
      assert.deepEqual(r.data, { ok: true, next: '/reports?tab=2', user: { username: 'admin', role: 'admin' } });
      const c = cookieOf(r.res);
      assert.match(c, /^portal_session=v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+;/);
      assert.match(c, /HttpOnly/);
      assert.match(c, /SameSite=Lax/);
      assert.match(c, /Max-Age=43200/);
      assert.match(c, /; Secure/, 'https request -> Secure');
      assert.equal(r.res.headers.get('cache-control'), 'no-store');
      assert.ok(!r.text.includes(ADMIN.password));

      const me = await call(meGET, req('/api/me', { cookie: c.split(';')[0] }));
      assert.equal(me.status, 200);
      assert.equal(me.data.user.username, 'admin');
    });

    it('signs in a viewer with the viewer role', async (t) => {
      env(t, baseEnv());
      const r = await login({ ...VIEWER });
      assert.equal(r.status, 200);
      assert.deepEqual(r.data.user, { username: 'viewer', role: 'viewer' });
    });

    it('username is case-insensitive and trimmed; password is exact', async (t) => {
      env(t, baseEnv());
      assert.equal((await login({ username: '  ADMIN ', password: ADMIN.password })).status, 200);
      assert.equal((await login({ username: 'admin', password: ADMIN.password.toUpperCase() })).status, 401);
    });

    it('omits Secure on plain http', async (t) => {
      env(t, baseEnv());
      const r = await call(loginPOST, req('/api/login', { method: 'POST', json: ADMIN, base: 'http://localhost:3000', ip: uniqueIp() }));
      assert.equal(r.status, 200);
      assert.doesNotMatch(cookieOf(r.res), /Secure/);
    });

    it('adds Secure behind an https proxy (x-forwarded-proto)', async (t) => {
      env(t, baseEnv());
      const r = await call(loginPOST, req('/api/login', {
        method: 'POST', json: ADMIN, base: 'http://portal.test', headers: { 'x-forwarded-proto': 'https' }, ip: uniqueIp(),
      }));
      assert.equal(r.status, 200);
      assert.match(cookieOf(r.res), /; Secure/);
    });

    it('sanitises next', async (t) => {
      env(t, baseEnv());
      assert.equal((await login({ ...ADMIN, next: 'https://evil.com' })).data.next, '/');
      assert.equal((await login({ ...ADMIN, next: '//evil.com' })).data.next, '/');
      assert.equal((await login({ ...ADMIN })).data.next, '/');
    });

    it('rejects a wrong password with 401 and no cookie', async (t) => {
      env(t, baseEnv());
      const started = Date.now();
      const r = await login({ username: 'admin', password: 'wrong' });
      assert.equal(r.status, 401);
      assert.equal(r.data.error, 'Incorrect login ID or password.');
      assert.equal(cookieOf(r.res), null);
      assert.ok(Date.now() - started >= 300, 'failed attempts are slowed down');
    });

    it('gives the same answer for an unknown user, blank fields and wrong types', async (t) => {
      env(t, baseEnv());
      const results = await Promise.all([
        login({ username: 'ghost', password: 'whatever' }),
        login({ username: '', password: '' }),
        login({ username: 'admin' }),
        login({ username: ['admin'], password: [ADMIN.password] }),
        login({ username: { toString: 1 }, password: 7 }),
        login({}),
      ]);
      for (const r of results) {
        assert.equal(r.status, 401);
        assert.equal(r.data.error, 'Incorrect login ID or password.');
        assert.equal(cookieOf(r.res), null);
      }
    });

    it('returns 503 when no login is configured', async (t) => {
      env(t, { SESSION_SECRET: 's' });
      const r = await login({ username: 'admin', password: 'x' });
      assert.equal(r.status, 503);
      assert.match(r.data.error, /not configured/);
    });

    it('rejects malformed JSON, unsupported types and oversized bodies', async (t) => {
      env(t, baseEnv());
      const bad = await call(loginPOST, req('/api/login', { method: 'POST', body: '{nope', headers: { 'content-type': 'application/json' } }));
      assert.equal(bad.status, 400);
      const txt = await call(loginPOST, req('/api/login', { method: 'POST', body: JSON.stringify(ADMIN), headers: { 'content-type': 'text/plain' } }));
      assert.equal(txt.status, 415);
      const none = await call(loginPOST, req('/api/login', { method: 'POST', body: JSON.stringify(ADMIN) }));
      assert.equal(none.status, 415);
      const big = await call(loginPOST, req('/api/login', {
        method: 'POST', body: JSON.stringify(ADMIN), headers: { 'content-type': 'application/json', 'content-length': '9000' },
      }));
      assert.equal(big.status, 413);
    });

    it('blocks cross-site sign-in attempts (login CSRF)', async (t) => {
      env(t, baseEnv());
      for (const headers of [{ origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }, { origin: 'null' }]) {
        const r = await call(loginPOST, req('/api/login', { method: 'POST', json: ADMIN, headers }));
        assert.equal(r.status, 403, JSON.stringify(headers));
        assert.equal(cookieOf(r.res), null);
      }
    });
  });

  describe('POST /api/login (HTML form, no JavaScript)', () => {
    const form = (fields, opts = {}) => call(loginPOST, req('/api/login', {
      method: 'POST', body: new URLSearchParams(fields).toString(),
      headers: { 'content-type': 'application/x-www-form-urlencoded' }, ip: opts.ip || uniqueIp(),
    }));

    it('success -> 303 to next with the cookie', async (t) => {
      env(t, baseEnv());
      const r = await form({ ...ADMIN, next: '/reports' });
      assert.equal(r.status, 303);
      assert.equal(r.res.headers.get('location'), '/reports');
      assert.match(cookieOf(r.res), /^portal_session=v1\./);
    });

    it('success with a hostile next -> 303 to /', async (t) => {
      env(t, baseEnv());
      const r = await form({ ...ADMIN, next: 'https://evil.com/phish' });
      assert.equal(r.res.headers.get('location'), '/');
    });

    it('success with a dot-segment next never redirects off-site', async (t) => {
      env(t, baseEnv());
      const r = await form({ ...ADMIN, next: '/..//evil.com' });
      assert.equal(r.status, 303);
      const loc = r.res.headers.get('location');
      assert.equal(new URL(loc, 'https://portal.test').origin, 'https://portal.test', `Location: ${loc}`);
    });

    it('failure -> 303 to /login?error=invalid without a cookie', async (t) => {
      env(t, baseEnv());
      const r = await form({ username: 'admin', password: 'nope' });
      assert.equal(r.status, 303);
      assert.equal(r.res.headers.get('location'), '/login?error=invalid');
      assert.equal(cookieOf(r.res), null);
    });

    it('not configured -> 303 to /login?error=error', async (t) => {
      env(t, {});
      const r = await form({ username: 'admin', password: 'x' });
      assert.equal(r.res.headers.get('location'), '/login?error=error');
    });

    it('multipart form posts work too', async (t) => {
      env(t, baseEnv());
      const fd = new FormData();
      fd.set('username', ADMIN.username);
      fd.set('password', ADMIN.password);
      fd.set('next', '/x');
      const r = await call(loginPOST, new Request('https://portal.test/api/login', {
        method: 'POST', body: fd, headers: { origin: 'https://portal.test', 'x-real-ip': uniqueIp() },
      }));
      assert.equal(r.status, 303);
      assert.equal(r.res.headers.get('location'), '/x');
    });
  });

  describe('rate limiting (in-memory, no storage connected)', () => {
    it('locks an IP after 10 failures in the window, even for the right password', async (t) => {
      env(t, baseEnv());
      const ip = uniqueIp();
      const fails = await Promise.all(Array.from({ length: 10 }, () => login({ username: 'admin', password: 'bad' }, { ip })));
      assert.ok(fails.every((r) => r.status === 401));
      assert.equal(await peek(getConfig(), 'login:ip:' + ip, 900), 10);

      const locked = await login({ ...ADMIN }, { ip });
      assert.equal(locked.status, 429);
      assert.equal(locked.res.headers.get('retry-after'), '900');
      assert.match(locked.data.error, /Too many sign-in attempts/);
      assert.equal(cookieOf(locked.res), null);

      // Other IPs are unaffected.
      assert.equal((await login({ ...ADMIN })).status, 200);
    });

    it('a locked IP gets the form redirect to /login?error=locked', async (t) => {
      env(t, baseEnv());
      const ip = uniqueIp();
      const cfg = getConfig();
      for (let i = 0; i < 10; i++) await hit(cfg, 'login:ip:' + ip, 10, 900);
      const r = await call(loginPOST, req('/api/login', {
        method: 'POST', body: new URLSearchParams(ADMIN).toString(),
        headers: { 'content-type': 'application/x-www-form-urlencoded' }, ip,
      }));
      assert.equal(r.status, 303);
      assert.equal(r.res.headers.get('location'), '/login?error=locked');
    });

    it('locks a username after 20 failures from any mix of IPs', async (t) => {
      env(t, baseEnv({ PORTAL_USERS: JSON.stringify([{ username: 'target', password: 'Target-Pass-1', role: 'viewer' }]) }));
      const fails = await Promise.all(Array.from({ length: 20 }, () => login({ username: 'TARGET', password: 'bad' })));
      assert.ok(fails.every((r) => r.status === 401));
      const locked = await login({ username: 'target', password: 'Target-Pass-1' });
      assert.equal(locked.status, 429);
      // A different account is unaffected.
      assert.equal((await login({ ...ADMIN })).status, 200);
    });

    it('a successful sign-in resets the IP counter', async (t) => {
      env(t, baseEnv());
      const ip = uniqueIp();
      await Promise.all(Array.from({ length: 3 }, () => login({ username: 'admin', password: 'bad' }, { ip })));
      assert.equal(await peek(getConfig(), 'login:ip:' + ip, 900), 3);
      assert.equal((await login({ ...ADMIN }, { ip })).status, 200);
      assert.equal(await peek(getConfig(), 'login:ip:' + ip, 900), 0);
    });
  });
});
