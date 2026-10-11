/*
 * API handlers in env mode (no storage connected): the list comes from the
 * DASHBOARDS variable and mutations answer with the value to paste into Vercel.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as audit from '../api/audit.js';
import * as dashboards from '../api/dashboards.js';
import * as exportApi from '../api/export.js';
import * as logout from '../api/logout.js';
import * as me from '../api/me.js';
import * as reveal from '../api/reveal.js';
import {
  ADMIN, SEED, SEED_PASSWORDS, VIEWER, baseEnv, call, env, req, resetLoginLimits, signIn, silenceAuditLogs,
} from './helpers/portal.mjs';

const seedEnv = (extra = {}) => baseEnv({ DASHBOARDS: JSON.stringify(SEED), ...extra });

async function list(cookie) {
  const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
  assert.equal(r.status, 200, r.text);
  return r.data;
}

function assertNoSeedPasswords(text, label = '') {
  for (const pw of SEED_PASSWORDS) assert.ok(!text.includes(pw), `${label} leaked ${pw}`);
  assert.ok(!/"password"\s*:/.test(text), `${label} has a password field`);
}

describe('API (env mode)', () => {
  silenceAuditLogs();
  afterEach(() => resetLoginLimits());
  describe('GET /api/me', () => {
    it('401 when signed out', async (t) => {
      env(t, seedEnv());
      const r = await call(me.GET, req('/api/me'));
      assert.equal(r.status, 401);
      assert.deepEqual(r.data, { error: 'Not signed in.' });
    });

    it('admin: role, storage mode, edit rights and config warnings', async (t) => {
      env(t, seedEnv({ SESSION_SECRET: undefined, VAULT_KEY: undefined, PORTAL_TITLE: 'Hub' }));
      const cookie = await signIn(ADMIN);
      const r = await call(me.GET, req('/api/me', { cookie }));
      assert.equal(r.status, 200);
      assert.deepEqual(r.data.user, { username: 'admin', role: 'admin' });
      assert.deepEqual(r.data.portal, { title: 'Hub' });
      assert.deepEqual(r.data.storage, { mode: 'env', writable: false });
      assert.equal(r.data.canEdit, true);
      assert.deepEqual(r.data.warnings.map((w) => w.code).sort(), ['no_session_secret', 'no_storage', 'no_vault_key']);
      const exp = Date.parse(r.data.sessionExpiresAt);
      assert.ok(Math.abs(exp - (Date.now() + 12 * 3600 * 1000)) < 5000);
      assert.ok(!r.text.includes(ADMIN.password));
      assert.equal(r.res.headers.get('cache-control'), 'no-store');
    });

    it('viewer: no edit rights and no warnings', async (t) => {
      env(t, seedEnv({ SESSION_SECRET: undefined, VAULT_KEY: undefined }));
      const cookie = await signIn(VIEWER);
      const r = await call(me.GET, req('/api/me', { cookie }));
      assert.equal(r.status, 200);
      assert.deepEqual(r.data.user, { username: 'viewer', role: 'viewer' });
      assert.equal(r.data.canEdit, false);
      assert.deepEqual(r.data.warnings, []);
    });

    it('admin sees bad_seed when DASHBOARDS is broken', async (t) => {
      env(t, baseEnv({ DASHBOARDS: '{oops' }));
      const cookie = await signIn(ADMIN);
      const r = await call(me.GET, req('/api/me', { cookie }));
      assert.ok(r.data.warnings.some((w) => w.code === 'bad_seed'));
    });

    it('POST is 405', async (t) => {
      env(t, seedEnv());
      const r = await call(me.POST, req('/api/me', { method: 'POST' }));
      assert.equal(r.status, 405);
      assert.equal(r.res.headers.get('allow'), 'GET');
    });
  });

  describe('POST /api/logout', () => {
    it('clears the cookie', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(logout.POST, req('/api/logout', { method: 'POST', cookie }));
      assert.equal(r.status, 200);
      assert.deepEqual(r.data, { ok: true });
      const sc = r.res.headers.get('set-cookie');
      assert.match(sc, /^portal_session=;/);
      assert.match(sc, /Max-Age=0/);
      assert.match(sc, /Expires=Thu, 01 Jan 1970/);
      assert.match(sc, /HttpOnly/);
      assert.match(sc, /Secure/);
    });

    it('works when already signed out', async (t) => {
      env(t, seedEnv());
      const r = await call(logout.POST, req('/api/logout', { method: 'POST' }));
      assert.equal(r.status, 200);
      assert.match(r.res.headers.get('set-cookie'), /Max-Age=0/);
    });

    it('refuses cross-site requests and GET', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const x = await call(logout.POST, req('/api/logout', { method: 'POST', cookie, origin: 'https://evil.example' }));
      assert.equal(x.status, 403);
      assert.equal(x.res.headers.get('set-cookie'), null);
      const g = await call(logout.GET, req('/api/logout', { cookie }));
      assert.equal(g.status, 405);
      assert.equal(g.res.headers.get('allow'), 'POST');
    });
  });

  describe('GET /api/dashboards', () => {
    it('401 when signed out', async (t) => {
      env(t, seedEnv());
      assert.equal((await call(dashboards.GET, req('/api/dashboards'))).status, 401);
    });

    it('lists the seed in order with passwords redacted (admin)', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      assert.equal(r.status, 200);
      assertNoSeedPasswords(r.text, 'admin list');
      const d = r.data;
      assert.equal(d.mode, 'env');
      assert.equal(d.rev, 0);
      assert.equal(d.canEdit, true);
      assert.deepEqual(d.seedErrors, []);
      assert.deepEqual(d.items.map((x) => x.name), SEED.map((x) => x.name));
      assert.deepEqual(d.items.map((x) => x.hasPassword), [true, true, false]);
      assert.equal(d.items[0].username, 'seo-admin');
      assert.deepEqual(d.items[0].links, [{ label: 'Admin', url: 'https://seo.example.com/admin' }]);
    });

    it('ids are stable across requests', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const a = await list(cookie);
      const b = await list(cookie);
      assert.deepEqual(a.items.map((x) => x.id), b.items.map((x) => x.id));
    });

    it('viewer gets the same redacted list, no edit rights and no seed errors', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify([...SEED, { name: 'Broken' }]) }));
      const admin = await list(await signIn(ADMIN));
      assert.equal(admin.seedErrors.length, 1);
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie: await signIn(VIEWER) }));
      assertNoSeedPasswords(r.text, 'viewer list');
      assert.equal(r.data.canEdit, false);
      assert.deepEqual(r.data.seedErrors, []);
      assert.equal(r.data.items.length, SEED.length);
    });

    it('an empty or missing DASHBOARDS gives an empty list', async (t) => {
      env(t, baseEnv());
      const d = await list(await signIn(ADMIN));
      assert.deepEqual(d.items, []);
    });
  });

  describe('mutations return the DASHBOARDS value to paste', () => {
    const parseEnvJson = (data) => JSON.parse(data.envJson);

    it('POST: validates, appends and includes every password', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie,
        json: { name: 'New One', url: 'https://new.example.com', username: 'nu', password: 'new-pw-333', rev: 0 },
      }));
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.readOnly, true);
      assert.equal(r.data.mode, 'env');
      assert.equal(r.data.count, 4);
      assert.match(r.data.message, /DASHBOARDS/);
      const entries = parseEnvJson(r.data);
      assert.deepEqual(entries.map((e) => e.name), ['SEO Tracker', 'Bridge Dashboard', 'PMO', 'New One']);
      assert.equal(entries[3].password, 'new-pw-333');
      assert.equal(entries[0].password, 'seo-secret-pw-111');
      assert.equal(entries[1].password, 'bridge-secret-pw-222');
      assert.ok(entries.every((e) => !String(e.password || '').startsWith('enc:')), 'plaintext in env JSON');
      // Nothing was saved.
      assert.equal((await list(cookie)).items.length, 3);
    });

    it('POST: rejects invalid input with 400 and the field', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      for (const [body, field] of [
        [{ name: '', url: 'https://x.example' }, 'Name'],
        [{ name: 'X', url: 'javascript:alert(1)' }, 'URL'],
        [{ name: 'X', url: 'https://u:p@x.example' }, 'URL'],
        [{ name: 'X', url: 'https://x.example', links: [{ label: 'a', url: 'data:text/html,x' }] }, 'Link 1 URL'],
      ]) {
        const r = await call(dashboards.POST, req('/api/dashboards', { method: 'POST', cookie, json: body }));
        assert.equal(r.status, 400, JSON.stringify(body));
        assert.equal(r.data.field, field);
      }
    });

    it('PUT ?id: edits; omitted password is kept, empty string clears it', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      const seo = items[0];
      const keep = await call(dashboards.PUT, req(`/api/dashboards?id=${seo.id}`, {
        method: 'PUT', cookie, json: { name: 'SEO Tracker v2', url: seo.url, username: 'seo-admin', rev: 0 },
      }));
      assert.equal(keep.status, 200, keep.text);
      const kept = parseEnvJson(keep.data);
      assert.equal(kept[0].name, 'SEO Tracker v2');
      assert.equal(kept[0].password, 'seo-secret-pw-111');
      assert.deepEqual(kept[0].links, [{ label: 'Admin', url: 'https://seo.example.com/admin' }], 'links kept when omitted');

      const cleared = parseEnvJson((await call(dashboards.PUT, req(`/api/dashboards?id=${seo.id}`, {
        method: 'PUT', cookie, json: { name: 'SEO Tracker', url: seo.url, password: '' },
      }))).data);
      assert.equal('password' in cleared[0], false);

      const changed = parseEnvJson((await call(dashboards.PUT, req(`/api/dashboards?id=${seo.id}`, {
        method: 'PUT', cookie, json: { name: 'SEO Tracker', url: seo.url, password: 'brand-new' },
      }))).data);
      assert.equal(changed[0].password, 'brand-new');
    });

    it('PUT: unknown id is 404', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(dashboards.PUT, req('/api/dashboards?id=nope', { method: 'PUT', cookie, json: { name: 'x', url: 'https://x.example' } }));
      assert.equal(r.status, 404);
      const noId = await call(dashboards.PUT, req('/api/dashboards', { method: 'PUT', cookie, json: { name: 'x', url: 'https://x.example' } }));
      assert.equal(noId.status, 404);
    });

    it('PUT ?action=reorder: reorders and validates the id list', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const ids = (await list(cookie)).items.map((x) => x.id);
      const r = await call(dashboards.PUT, req('/api/dashboards?action=reorder', {
        method: 'PUT', cookie, json: { ids: [ids[2], ids[0], ids[1]] },
      }));
      assert.equal(r.status, 200, r.text);
      assert.deepEqual(parseEnvJson(r.data).map((e) => e.name), ['PMO', 'SEO Tracker', 'Bridge Dashboard']);
      for (const bad of [
        undefined, 'x', [ids[0], ids[1]], [ids[0], ids[1], ids[1]], [ids[0], ids[1], 'other'], [...ids, 'extra'],
      ]) {
        const b = await call(dashboards.PUT, req('/api/dashboards?action=reorder', { method: 'PUT', cookie, json: { ids: bad } }));
        assert.equal(b.status, 400, JSON.stringify(bad));
      }
    });

    it('DELETE ?id: removes from the pasted value', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      const r = await call(dashboards.DELETE, req(`/api/dashboards?id=${items[1].id}`, { method: 'DELETE', cookie }));
      assert.equal(r.status, 200, r.text);
      assert.deepEqual(parseEnvJson(r.data).map((e) => e.name), ['SEO Tracker', 'PMO']);
      const missing = await call(dashboards.DELETE, req('/api/dashboards?id=nope', { method: 'DELETE', cookie }));
      assert.equal(missing.status, 404);
    });

    it('viewers cannot mutate (403) and never receive the env JSON', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(VIEWER);
      const { items } = await list(cookie);
      const attempts = [
        [dashboards.POST, req('/api/dashboards', { method: 'POST', cookie, json: { name: 'x', url: 'https://x.example' } })],
        [dashboards.PUT, req(`/api/dashboards?id=${items[0].id}`, { method: 'PUT', cookie, json: { name: 'x', url: 'https://x.example' } })],
        [dashboards.PUT, req('/api/dashboards?action=reorder', { method: 'PUT', cookie, json: { ids: items.map((x) => x.id).reverse() } })],
        [dashboards.DELETE, req(`/api/dashboards?id=${items[0].id}`, { method: 'DELETE', cookie })],
      ];
      for (const [fn, r] of attempts) {
        const out = await call(fn, r);
        assert.equal(out.status, 403, r.method + ' ' + r.url);
        assertNoSeedPasswords(out.text, 'viewer mutation');
      }
    });

    it('signed-out mutations are 401', async (t) => {
      env(t, seedEnv());
      const out = await call(dashboards.POST, req('/api/dashboards', { method: 'POST', json: { name: 'x', url: 'https://x.example' } }));
      assert.equal(out.status, 401);
    });
  });

  describe('POST /api/reveal', () => {
    it('returns one dashboard\'s credentials to any signed-in user', async (t) => {
      env(t, seedEnv());
      for (const user of [ADMIN, VIEWER]) {
        const cookie = await signIn(user);
        const { items } = await list(cookie);
        const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[0].id } }));
        assert.equal(r.status, 200, r.text);
        assert.deepEqual(r.data, { username: 'seo-admin', password: 'seo-secret-pw-111' });
        assert.equal(r.res.headers.get('cache-control'), 'no-store');
        const none = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[2].id } }));
        assert.deepEqual(none.data, { username: '', password: '' });
      }
    });

    it('404 for an unknown id, 401 signed out, 405 for GET', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      assert.equal((await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: 'nope' } }))).status, 404);
      assert.equal((await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: {} }))).status, 404);
      assert.equal((await call(reveal.POST, req('/api/reveal', { method: 'POST', json: { id: 'x' } }))).status, 401);
      assert.equal((await call(reveal.GET, req('/api/reveal?id=x', { cookie }))).status, 405);
    });
  });

  describe('GET /api/export', () => {
    it('admin: without secrets by default', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(exportApi.GET, req('/api/export', { cookie }));
      assert.equal(r.status, 200);
      assert.equal(r.data.includesPasswords, false);
      assert.equal(r.data.count, 3);
      assertNoSeedPasswords(r.text, 'export');
      assert.equal(r.data.dashboards[0].username, 'seo-admin');
    });

    it('admin: ?secrets=1 includes passwords and is a valid DASHBOARDS value', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(ADMIN);
      const r = await call(exportApi.GET, req('/api/export?secrets=1', { cookie }));
      assert.equal(r.data.includesPasswords, true);
      assert.deepEqual(r.data.dashboards.map((d) => d.password), ['seo-secret-pw-111', 'bridge-secret-pw-222', undefined]);
      // Only exactly "1" turns secrets on.
      const other = await call(exportApi.GET, req('/api/export?secrets=true', { cookie }));
      assert.equal(other.data.includesPasswords, false);
    });

    it('viewer gets 403, signed-out 401, POST 405', async (t) => {
      env(t, seedEnv());
      const cookie = await signIn(VIEWER);
      const v = await call(exportApi.GET, req('/api/export?secrets=1', { cookie }));
      assert.equal(v.status, 403);
      assertNoSeedPasswords(v.text, 'viewer export');
      assert.equal((await call(exportApi.GET, req('/api/export?secrets=1'))).status, 401);
      assert.equal((await call(exportApi.POST, req('/api/export', { method: 'POST', cookie }))).status, 405);
    });
  });

  describe('logging', () => {
    it('no password ever reaches console output', async (t) => {
      env(t, seedEnv());
      const lines = [];
      const capture = (...args) => lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
      t.mock.method(console, 'log', capture);
      t.mock.method(console, 'error', capture);
      t.mock.method(console, 'warn', capture);
      t.mock.method(console, 'info', capture);

      const { POST: loginPOST } = await import('../api/login.js');
      await call(loginPOST, req('/api/login', { method: 'POST', json: { username: 'admin', password: 'typo-' + ADMIN.password } }));
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[0].id } }));
      await call(exportApi.GET, req('/api/export?secrets=1', { cookie }));
      await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie, json: { name: 'L', url: 'https://l.example', password: 'logged-pw-999' },
      }));
      await call(logout.POST, req('/api/logout', { method: 'POST', cookie }));

      const all = lines.join('\n');
      assert.ok(lines.some((l) => l.includes('audit')), 'audit events are logged in env mode');
      for (const secret of [...SEED_PASSWORDS, ADMIN.password, 'logged-pw-999', 'test-session-secret', 'test-vault-key']) {
        assert.ok(!all.includes(secret), `log output contains ${secret}`);
      }
      assert.ok(!all.includes(cookie.split('=')[1]), 'session token logged');
    });
  });

  describe('GET /api/audit', () => {
    it('admin gets an empty log in env mode; viewer 403', async (t) => {
      env(t, seedEnv());
      const r = await call(audit.GET, req('/api/audit', { cookie: await signIn(ADMIN) }));
      assert.deepEqual(r.data, { mode: 'env', events: [] });
      assert.equal((await call(audit.GET, req('/api/audit', { cookie: await signIn(VIEWER) }))).status, 403);
      assert.equal((await call(audit.GET, req('/api/audit'))).status, 401);
    });
  });
});
