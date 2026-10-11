import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import middleware, { config as mwConfig } from '../middleware.js';
import { getConfig } from '../lib/config.js';
import { createSessionToken, findUser } from '../lib/session.js';
import { baseEnv, env } from './helpers/portal.mjs';

const BASE = 'https://portal.test';
const mw = (path, { method = 'GET', cookie, base = BASE } = {}) =>
  middleware(new Request(base + path, { method, headers: cookie ? { cookie } : {} }));

async function sessionCookieFor(username) {
  const cfg = getConfig();
  const { token } = await createSessionToken(findUser(cfg, username), cfg);
  return 'portal_session=' + token;
}

/**
 * Vercel's documented continue signal (next() in @vercel/edge and
 * @vercel/functions): an empty 200 Response carrying x-middleware-next: 1.
 * Returning undefined is NOT a continue on the Node.js middleware runtime.
 */
async function assertContinues(res, label) {
  assert.ok(res instanceof Response, `${label}: middleware must return a Response, got ${res}`);
  assert.equal(res.headers.get('x-middleware-next'), '1', `${label}: missing x-middleware-next`);
  assert.equal(res.status, 200, label);
  assert.equal(await res.text(), '', label);
}

/** Redirects must be same-site RELATIVE paths: under the Node.js runtime
 *  request.url is http://host, so an absolute Location would point at http://. */
function assertRelativeRedirect(res, label) {
  assert.ok(res instanceof Response, label);
  assert.equal(res.status, 302, label);
  const loc = res.headers.get('location');
  assert.ok(loc && loc.startsWith('/') && !loc.startsWith('//'), `${label}: Location must be a relative path, got ${loc}`);
  assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(loc), `${label}: Location must not be absolute, got ${loc}`);
  assert.equal(res.headers.get('x-middleware-next'), null, `${label}: a redirect must not also continue`);
  return new URL(loc, BASE);
}

describe('middleware.js', () => {
  it('pins the Node.js runtime', () => {
    assert.deepEqual(mwConfig, { runtime: 'nodejs' });
  });

  it('lets the public login assets through when signed out', async (t) => {
    env(t, baseEnv());
    for (const p of ['/login', '/login.html', '/api/login', '/assets/portal.css', '/assets/login.js', '/favicon.svg', '/robots.txt']) {
      await assertContinues(await mw(p), p);
    }
    await assertContinues(await mw('/api/login', { method: 'POST' }), 'POST /api/login');
  });

  it('public paths still pass with a garbage cookie', async (t) => {
    env(t, baseEnv());
    await assertContinues(await mw('/login', { cookie: 'portal_session=garbage' }), '/login garbage cookie');
  });

  it('redirects signed-out page requests to /login with next', async (t) => {
    env(t, baseEnv());
    const loc = assertRelativeRedirect(await mw('/reports/q3?tab=2&x=a%20b'), 'deep link');
    assert.equal(loc.pathname, '/login');
    assert.equal(loc.searchParams.get('next'), '/reports/q3?tab=2&x=a%20b');
  });

  it('redirects / and /index.html to /login without a next parameter', async (t) => {
    env(t, baseEnv());
    for (const p of ['/', '/index.html']) {
      const res = await mw(p);
      assertRelativeRedirect(res, p);
      assert.equal(res.headers.get('location'), '/login', p);
    }
  });

  it('never emits an http:// redirect when the runtime presents request.url as http://', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('viewer');
    for (const [res, label] of [
      [await mw('/reports', { base: 'http://portal.test' }), 'signed out'],
      [await mw('/login', { base: 'http://portal.test', cookie }), 'signed in on /login'],
    ]) {
      assertRelativeRedirect(res, label);
    }
  });

  it('protects everything that is not explicitly public', async (t) => {
    env(t, baseEnv());
    for (const p of ['/assets/app.js', '/index', '/login/extra', '/loginx', '/favicon.ico', '/assets/portal.css.map']) {
      const loc = assertRelativeRedirect(await mw(p), p);
      assert.equal(loc.pathname, '/login', p);
    }
  });

  it('answers signed-out API calls with 401 JSON', async (t) => {
    env(t, baseEnv());
    for (const [p, method] of [['/api/dashboards', 'GET'], ['/api/reveal', 'POST'], ['/api/me', 'GET'], ['/api/export?secrets=1', 'GET'], ['/api/nonexistent', 'DELETE']]) {
      const res = await mw(p, { method });
      assert.equal(res.status, 401, p);
      assert.equal(res.headers.get('x-middleware-next'), null, p);
      assert.match(res.headers.get('content-type'), /^application\/json/);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await res.json(), { error: 'Not signed in.' });
    }
  });

  it('rejects invalid, expired-secret and foreign cookies', async (t) => {
    env(t, baseEnv());
    const good = await sessionCookieFor('admin');
    process.env.SESSION_SECRET = 'rotated-secret';
    assert.equal((await mw('/', { cookie: good })).status, 302);
    assert.equal((await mw('/api/me', { cookie: good })).status, 401);
    assert.equal((await mw('/', { cookie: 'portal_session=v1.e30.AAAA' })).status, 302);
    assert.equal((await mw('/', { cookie: 'other_cookie=' + good.split('=')[1] })).status, 302);
  });

  it('lets signed-in users through to pages and APIs', async (t) => {
    env(t, baseEnv());
    for (const user of ['admin', 'viewer']) {
      const cookie = await sessionCookieFor(user);
      for (const p of ['/', '/index.html', '/assets/app.js', '/api/dashboards', '/anything?x=1']) {
        await assertContinues(await mw(p, { cookie }), `${user} ${p}`);
      }
    }
  });

  it('sends a signed-in user away from the login page to /', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('viewer');
    for (const p of ['/login', '/login.html', '/login?next=/x']) {
      const res = await mw(p, { cookie });
      assertRelativeRedirect(res, p);
      assert.equal(res.headers.get('location'), '/', p);
    }
    // Non-GET requests to the login path are not redirected.
    await assertContinues(await mw('/login', { method: 'POST', cookie }), 'POST /login');
    // The login API itself is never redirected.
    await assertContinues(await mw('/api/login', { cookie }), '/api/login signed in');
  });

  it('logs out sessions when the user is removed or the password changes', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('viewer');
    await assertContinues(await mw('/', { cookie }), 'before change');
    process.env.PORTAL_USERS = JSON.stringify([{ username: 'viewer', password: 'changed', role: 'viewer' }]);
    assert.equal((await mw('/', { cookie })).status, 302);
    process.env.PORTAL_USERS = '[]';
    assert.equal((await mw('/api/me', { cookie })).status, 401);
  });

  it('with no users configured nobody gets in', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('admin');
    process.env.PORTAL_USERNAME = '';
    process.env.PORTAL_USERS = '';
    assert.equal((await mw('/', { cookie })).status, 302);
    await assertContinues(await mw('/login'), '/login with no users');
  });

  it('always returns a Response (never undefined) for any request', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('admin');
    for (const c of [undefined, cookie, 'portal_session=junk']) {
      for (const p of ['/', '/login', '/api/me', '/assets/app.js', '/x/y/z', '/api/login']) {
        for (const method of ['GET', 'POST']) {
          const res = await mw(p, { method, cookie: c });
          assert.ok(res instanceof Response, `${method} ${p} cookie=${Boolean(c)}`);
        }
      }
    }
  });
});
