import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import middleware from '../middleware.js';
import { getConfig } from '../lib/config.js';
import { createSessionToken, findUser } from '../lib/session.js';
import { baseEnv, env } from './helpers/portal.mjs';

const BASE = 'https://portal.test';
const mw = (path, { method = 'GET', cookie } = {}) =>
  middleware(new Request(BASE + path, { method, headers: cookie ? { cookie } : {} }));

async function sessionCookieFor(username) {
  const cfg = getConfig();
  const { token } = await createSessionToken(findUser(cfg, username), cfg);
  return 'portal_session=' + token;
}

describe('middleware.js', () => {
  it('lets the public login assets through when signed out', async (t) => {
    env(t, baseEnv());
    for (const p of ['/login', '/login.html', '/api/login', '/assets/portal.css', '/assets/login.js', '/favicon.svg', '/robots.txt']) {
      assert.equal(await mw(p), undefined, p);
    }
    assert.equal(await mw('/api/login', { method: 'POST' }), undefined);
  });

  it('public paths still pass with a garbage cookie', async (t) => {
    env(t, baseEnv());
    assert.equal(await mw('/login', { cookie: 'portal_session=garbage' }), undefined);
  });

  it('redirects signed-out page requests to /login with next', async (t) => {
    env(t, baseEnv());
    const res = await mw('/reports/q3?tab=2&x=a%20b');
    assert.equal(res.status, 302);
    const loc = new URL(res.headers.get('location'));
    assert.equal(loc.origin, BASE);
    assert.equal(loc.pathname, '/login');
    assert.equal(loc.searchParams.get('next'), '/reports/q3?tab=2&x=a%20b');
  });

  it('redirects / and /index.html to /login without a next parameter', async (t) => {
    env(t, baseEnv());
    for (const p of ['/', '/index.html']) {
      const res = await mw(p);
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), BASE + '/login', p);
    }
  });

  it('protects everything that is not explicitly public', async (t) => {
    env(t, baseEnv());
    for (const p of ['/assets/app.js', '/index', '/login/extra', '/loginx', '/favicon.ico', '/assets/portal.css.map']) {
      const res = await mw(p);
      assert.equal(res.status, 302, p);
      assert.equal(new URL(res.headers.get('location')).pathname, '/login', p);
    }
  });

  it('answers signed-out API calls with 401 JSON', async (t) => {
    env(t, baseEnv());
    for (const [p, method] of [['/api/dashboards', 'GET'], ['/api/reveal', 'POST'], ['/api/me', 'GET'], ['/api/export?secrets=1', 'GET'], ['/api/nonexistent', 'DELETE']]) {
      const res = await mw(p, { method });
      assert.equal(res.status, 401, p);
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
        assert.equal(await mw(p, { cookie }), undefined, `${user} ${p}`);
      }
    }
  });

  it('sends a signed-in user away from the login page to /', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('viewer');
    for (const p of ['/login', '/login.html', '/login?next=/x']) {
      const res = await mw(p, { cookie });
      assert.equal(res.status, 302, p);
      assert.equal(res.headers.get('location'), BASE + '/', p);
    }
    // Non-GET requests to the login path are not redirected.
    assert.equal(await mw('/login', { method: 'POST', cookie }), undefined);
    // The login API itself is never redirected.
    assert.equal(await mw('/api/login', { cookie }), undefined);
  });

  it('logs out sessions when the user is removed or the password changes', async (t) => {
    env(t, baseEnv());
    const cookie = await sessionCookieFor('viewer');
    assert.equal(await mw('/', { cookie }), undefined);
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
    assert.equal(await mw('/login'), undefined);
  });
});
