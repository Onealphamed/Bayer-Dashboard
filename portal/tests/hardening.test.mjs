/*
 * Regression tests for the issues found by the adversarial review:
 * session revocation (AUTH-3), cross-site reads (INJ-2), seed safety (STOR-1/2/3),
 * error scrubbing (STOR-4), vault migration (STOR-5), atomic rate-limit expiry
 * (STOR-8) and the role/redirect fixes (AUTH-1/2).
 */
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as auditApi from '../api/audit.js';
import * as dashboards from '../api/dashboards.js';
import * as exportApi from '../api/export.js';
import * as login from '../api/login.js';
import * as logout from '../api/logout.js';
import * as me from '../api/me.js';
import * as reveal from '../api/reveal.js';
import * as status from '../api/status.js';
import { getConfig } from '../lib/config.js';
import { hit } from '../lib/store.js';
import { startUpstash } from './helpers/upstash-shim.mjs';
import {
  ADMIN, SEED, VIEWER, baseEnv, call, env, haveRedisServer, req, resetLoginLimits, signIn, silenceAuditLogs, uniqueIp,
} from './helpers/portal.mjs';

const REDIS_SKIP = haveRedisServer() ? false : 'redis-server is not installed';

describe('hardening (redis mode)', { skip: REDIS_SKIP }, () => {
  silenceAuditLogs();
  let shim;
  before(async () => { shim = await startUpstash({ token: 'hard-token-' + process.pid }); });
  after(async () => { if (shim) await shim.stop(); });
  beforeEach(async () => { await shim.flush(); });

  const redisEnv = (extra = {}) => baseEnv({
    KV_REST_API_URL: shim.url, KV_REST_API_TOKEN: shim.token, DASHBOARDS: JSON.stringify(SEED), ...extra,
  });
  const getList = (cookie) => call(dashboards.GET, req('/api/dashboards', { cookie }));

  describe('AUTH-3: sign-out revokes the session server-side', () => {
    it('a signed-out cookie stops working, and the 401 clears it', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      assert.equal((await getList(cookie)).status, 200);
      const out = await call(logout.POST, req('/api/logout', { method: 'POST', cookie, json: {} }));
      assert.equal(out.status, 200);
      assert.deepEqual(out.data, { ok: true, revoked: true, everywhere: false });
      const reuse = await getList(cookie);
      assert.equal(reuse.status, 401);
      assert.equal(reuse.data.signedOut, true);
      assert.match(reuse.res.headers.get('set-cookie'), /^portal_session=;.*Max-Age=0/);
    });

    it('signing out one browser leaves other sessions alone', async (t) => {
      env(t, redisEnv());
      const a = await signIn(ADMIN);
      const b = await signIn(ADMIN);
      await call(logout.POST, req('/api/logout', { method: 'POST', cookie: a, json: {} }));
      assert.equal((await getList(a)).status, 401);
      assert.equal((await getList(b)).status, 200);
    });

    it('"sign out everywhere" ends every session for that user only; a new sign-in works', async (t) => {
      env(t, redisEnv());
      const a = await signIn(ADMIN);
      const b = await signIn(ADMIN);
      const v = await signIn(VIEWER);
      const out = await call(logout.POST, req('/api/logout', { method: 'POST', cookie: a, json: { everywhere: true } }));
      assert.deepEqual(out.data, { ok: true, revoked: true, everywhere: true });
      assert.equal((await getList(a)).status, 401);
      assert.equal((await getList(b)).status, 401);
      assert.equal((await getList(v)).status, 200, 'other users are unaffected');
      const fresh = await signIn(ADMIN);
      assert.equal((await getList(fresh)).status, 200, 'signing in again immediately works');
    });

    it('a revoked session cannot reveal or export passwords', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const id = (await getList(cookie)).data.items[0].id;
      await call(logout.POST, req('/api/logout', { method: 'POST', cookie, json: {} }));
      assert.equal((await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id } }))).status, 401);
      assert.equal((await call(exportApi.GET, req('/api/export?secrets=1', { cookie }))).status, 401);
    });

    it('reveal fails CLOSED when storage cannot confirm the session is still valid', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const id = (await getList(cookie)).data.items[0].id;
      process.env.KV_REST_API_TOKEN = 'wrong-token'; // storage now rejects every call
      const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id } }));
      assert.equal(r.status, 503);
      assert.ok(!JSON.stringify(r.data).includes('seo-secret'), 'no password on failure');
    });
  });

  describe('STOR-1: an unreadable DASHBOARDS never seeds an empty list', () => {
    it('stays uninitialised, refuses edits, and imports once DASHBOARDS is fixed', async (t) => {
      env(t, redisEnv({ DASHBOARDS: '[{"name":"A","url":"https://a.example"},]' })); // trailing comma
      const cookie = await signIn(ADMIN);
      const first = await getList(cookie);
      assert.equal(first.status, 200);
      assert.equal(first.data.uninitialized, true);
      assert.deepEqual(first.data.items, []);
      assert.equal(await shim.raw('GET', 'portal:dashboards'), null, 'nothing written to storage');
      const add = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie, json: { name: 'X', url: 'https://x.example', rev: first.data.rev },
      }));
      assert.equal(add.status, 409);
      assert.ok(Array.isArray(add.data.seedErrors));
      process.env.DASHBOARDS = JSON.stringify(SEED); // admin fixes the variable
      const fixed = await getList(cookie);
      assert.equal(fixed.data.uninitialized, false);
      assert.equal(fixed.data.items.length, SEED.length);
    });
  });

  describe('STOR-2: skipped seed entries stay visible until dismissed', () => {
    it('keeps the notice across requests, shows it only to admins, and dismiss clears it', async (t) => {
      env(t, redisEnv({ DASHBOARDS: JSON.stringify([...SEED, { name: 'Bad', url: 'ftp://nope' }]) }));
      const admin = await signIn(ADMIN);
      const viewer = await signIn(VIEWER);
      assert.equal((await getList(viewer)).data.seedErrors.length, 0, 'viewers never see it');
      for (let i = 0; i < 2; i++) {
        const d = (await getList(admin)).data;
        assert.equal(d.items.length, SEED.length);
        assert.equal(d.seedErrors.length, 1, 'still shown on request ' + (i + 1));
        assert.match(d.seedErrors[0], /entry 4/);
      }
      const dismiss = await call(dashboards.PUT, req('/api/dashboards?action=dismiss-notices', { method: 'PUT', cookie: admin, json: {} }));
      assert.equal(dismiss.status, 200);
      assert.deepEqual((await getList(admin)).data.seedErrors, []);
      const viewerDismiss = await call(dashboards.PUT, req('/api/dashboards?action=dismiss-notices', { method: 'PUT', cookie: viewer, json: {} }));
      assert.equal(viewerDismiss.status, 403);
    });

    it('a scheme-less URL in DASHBOARDS is imported as https:// instead of being dropped', async (t) => {
      env(t, redisEnv({ DASHBOARDS: JSON.stringify([{ name: 'PMO', url: 'howrah-bridge-pmo-alpha.vercel.app' }]) }));
      const d = (await getList(await signIn(ADMIN))).data;
      assert.deepEqual(d.seedErrors, []);
      assert.equal(d.items[0].url, 'https://howrah-bridge-pmo-alpha.vercel.app/');
    });
  });

  describe('STOR-4: storage errors never echo connection details', () => {
    it('a 503 for an unreachable store carries no URL, host or credential', async (t) => {
      env(t, redisEnv({ KV_REST_API_URL: 'http://default:SuperSecretRedisPw@127.0.0.1:1' }));
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie: await signIn(ADMIN) }));
      assert.equal(r.status, 503);
      assert.ok(!/SuperSecretRedisPw|127\.0\.0\.1|default:/.test(r.text), r.text);
      assert.deepEqual(Object.keys(r.data), ['error']);
    });
  });

  describe('STOR-5: setting VAULT_KEY later encrypts passwords already stored', () => {
    it('migrates plaintext passwords on the next load and they still reveal correctly', async (t) => {
      env(t, redisEnv({ VAULT_KEY: undefined }));
      const cookie = await signIn(ADMIN);
      await getList(cookie); // seeds without encryption
      assert.ok((await shim.raw('GET', 'portal:dashboards')).includes('seo-secret-pw-111'), 'plaintext before');
      process.env.VAULT_KEY = 'added-later-key';
      const d = (await getList(cookie)).data;
      const raw = await shim.raw('GET', 'portal:dashboards');
      assert.ok(!raw.includes('seo-secret-pw-111') && raw.includes('enc:v1:'), 'encrypted after');
      const id = d.items.find((x) => x.name === 'SEO Tracker').id;
      const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id } }));
      assert.equal(r.data.password, 'seo-secret-pw-111');
    });
  });

  describe('STOR-8: rate-limit counters always expire', () => {
    it('every counter created by hit() has a TTL within the window', async (t) => {
      env(t, redisEnv());
      const cfg = getConfig();
      for (let i = 0; i < 3; i++) await hit(cfg, 'probe:key', 10, 900);
      const ttl = await shim.raw('TTL', 'portal:rl:probe:key');
      assert.ok(ttl > 0 && ttl <= 900, 'ttl=' + ttl);
      assert.equal(await shim.raw('GET', 'portal:rl:probe:key'), '3');
    });

    it('a counter that lost its TTL is repaired rather than locking the account forever', async (t) => {
      env(t, redisEnv());
      await shim.raw('SET', 'portal:rl:login:user:admin', '999'); // no TTL
      const r = await call(login.POST, req('/api/login', { method: 'POST', json: { ...ADMIN }, ip: uniqueIp() }));
      assert.equal(r.status, 429, 'still locked right now');
      const ttl = await shim.raw('TTL', 'portal:rl:login:user:admin');
      assert.ok(ttl > 0, 'but the lock now expires: ttl=' + ttl);
    });
  });
});

describe('hardening (no storage)', () => {
  silenceAuditLogs();
  afterEach(() => resetLoginLimits());

  describe('INJ-2: authenticated APIs refuse cross-site requests, including GET', () => {
    it('blocks a cross-site top-level navigation to every authenticated endpoint', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify(SEED) }));
      const cookie = await signIn(ADMIN);
      for (const [handler, path] of [
        [exportApi.GET, '/api/export?secrets=1'], [auditApi.GET, '/api/audit'], [dashboards.GET, '/api/dashboards'],
        [me.GET, '/api/me'], [status.GET, '/api/status'],
      ]) {
        const r = await call(handler, req(path, { cookie, headers: { 'sec-fetch-site': 'cross-site' } }));
        assert.equal(r.status, 403, path);
        assert.ok(!r.text.includes('seo-secret'), path + ' leaked a password');
      }
      // Same-origin fetches (what the hub does) and non-browser clients still work.
      assert.equal((await call(exportApi.GET, req('/api/export?secrets=1', { cookie, headers: { 'sec-fetch-site': 'same-origin' } }))).status, 200);
      assert.equal((await call(me.GET, req('/api/me', { cookie }))).status, 200);
    });
  });

  describe('STOR-3: env mode never generates a value that would drop entries', () => {
    it('refuses add/edit/delete while DASHBOARDS has entries that failed to load', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify([...SEED, { name: 'Broken', url: 'ftp://x', password: 'keep-me' }]) }));
      const cookie = await signIn(ADMIN);
      const d = (await call(dashboards.GET, req('/api/dashboards', { cookie }))).data;
      assert.equal(d.items.length, SEED.length);
      assert.equal(d.seedErrors.length, 1);
      const add = await call(dashboards.POST, req('/api/dashboards', { method: 'POST', cookie, json: { name: 'N', url: 'https://n.example' } }));
      assert.equal(add.status, 409);
      assert.equal(add.data.envJson, undefined, 'no lossy value handed out');
      const del = await call(dashboards.DELETE, req('/api/dashboards?id=' + d.items[0].id, { method: 'DELETE', cookie }));
      assert.equal(del.status, 409);
    });

    it('with a clean DASHBOARDS the generated value round-trips ids and passwords', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify(SEED) }));
      const cookie = await signIn(ADMIN);
      const before = (await call(dashboards.GET, req('/api/dashboards', { cookie }))).data.items;
      const add = await call(dashboards.POST, req('/api/dashboards', { method: 'POST', cookie, json: { name: 'N', url: 'https://n.example', password: 'n-pw' } }));
      assert.equal(add.status, 200);
      process.env.DASHBOARDS = add.data.envJson; // the admin pastes it and redeploys
      const after = (await call(dashboards.GET, req('/api/dashboards', { cookie }))).data.items;
      assert.equal(after.length, SEED.length + 1);
      for (const b of before) assert.ok(after.some((a) => a.id === b.id), 'id kept for ' + b.name);
      const n = after.find((a) => a.name === 'N');
      const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: n.id } }));
      assert.equal(r.data.password, 'n-pw');
    });
  });

  describe('AUTH-2: PORTAL_USERS can never grant admin by accident', () => {
    it('a mistyped role signs in as a viewer and cannot reveal-all via export', async (t) => {
      env(t, baseEnv({
        DASHBOARDS: JSON.stringify(SEED),
        PORTAL_USERS: JSON.stringify([{ username: 'typo', password: 'Typo-Pass-1', role: 'Admn' }]),
      }));
      const cookie = await signIn({ username: 'typo', password: 'Typo-Pass-1' });
      const m = (await call(me.GET, req('/api/me', { cookie }))).data;
      assert.equal(m.user.role, 'viewer');
      assert.equal((await call(exportApi.GET, req('/api/export?secrets=1', { cookie }))).status, 403);
      const adminMe = (await call(me.GET, req('/api/me', { cookie: await signIn(ADMIN) }))).data;
      assert.ok(adminMe.warnings.some((w) => w.code === 'users' && /typo/.test(w.text)), 'admin is told about it');
    });
  });

  describe('AUTH-1: no open redirect through dot segments, end to end', () => {
    it('a form sign-in with next=/..//evil.example stays on the portal', async (t) => {
      env(t, baseEnv());
      for (const next of ['/..//evil.example', '/.//evil.example', '/%2e%2e//evil.example', '/a/..//evil.example']) {
        const body = new URLSearchParams({ username: ADMIN.username, password: ADMIN.password, next }).toString();
        const res = await login.POST(req('/api/login', {
          method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' }, ip: uniqueIp(),
        }));
        assert.equal(res.status, 303, next);
        const loc = res.headers.get('location');
        assert.ok(loc.startsWith('/') && !loc.startsWith('//'), `${next} -> ${loc}`);
      }
    });
  });
});
