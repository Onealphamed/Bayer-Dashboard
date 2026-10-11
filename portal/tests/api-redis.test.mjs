/*
 * API handlers in redis mode, against a real redis-server behind the
 * Upstash-compatible REST shim (so the Lua compare-and-set really runs).
 */
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as auditApi from '../api/audit.js';
import * as dashboards from '../api/dashboards.js';
import * as exportApi from '../api/export.js';
import * as login from '../api/login.js';
import * as logout from '../api/logout.js';
import * as me from '../api/me.js';
import * as reveal from '../api/reveal.js';
import { getConfig } from '../lib/config.js';
import { normalizeDashboard } from '../lib/dashboards.js';
import { loadDashboards, saveDashboards } from '../lib/store.js';
import { startUpstash } from './helpers/upstash-shim.mjs';
import {
  ADMIN, SEED, SEED_PASSWORDS, VIEWER, baseEnv, call, env, haveRedisServer, req, signIn, silenceAuditLogs, uniqueIp,
} from './helpers/portal.mjs';

const KEY_LIST = 'portal:dashboards';
const KEY_REV = 'portal:dashboards:rev';

const REDIS_SKIP = haveRedisServer() ? false : 'redis-server is not installed (needed by tests/helpers/upstash-shim.mjs)';

describe('API (redis mode)', { skip: REDIS_SKIP }, () => {
  silenceAuditLogs();
  let shim;
  before(async () => {
    shim = await startUpstash({ token: 'shim-token-' + process.pid });
  });
  after(async () => {
    if (shim) await shim.stop();
  });
  beforeEach(async () => {
    await shim.flush();
  });

  const redisEnv = (extra = {}) => baseEnv({
    KV_REST_API_URL: shim.url, KV_REST_API_TOKEN: shim.token, DASHBOARDS: JSON.stringify(SEED), ...extra,
  });

  async function list(cookie) {
    const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
    assert.equal(r.status, 200, r.text);
    return r.data;
  }
  async function rawDoc() {
    const raw = await shim.raw('GET', KEY_LIST);
    return raw === null ? null : { raw, doc: JSON.parse(raw) };
  }
  async function revealPw(cookie, id) {
    const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id } }));
    assert.equal(r.status, 200, r.text);
    return r.data;
  }
  async function events(cookie, limit) {
    const r = await call(auditApi.GET, req('/api/audit' + (limit ? `?limit=${limit}` : ''), { cookie }));
    assert.equal(r.status, 200, r.text);
    return r.data.events;
  }
  const post = (cookie, json) => call(dashboards.POST, req('/api/dashboards', { method: 'POST', cookie, json }));
  const put = (cookie, query, json) => call(dashboards.PUT, req('/api/dashboards?' + query, { method: 'PUT', cookie, json }));
  const del = (cookie, query) => call(dashboards.DELETE, req('/api/dashboards?' + query, { method: 'DELETE', cookie }));

  describe('seeding and storage', () => {
    it('me reports writable redis storage and no warnings for a full config', async (t) => {
      env(t, redisEnv());
      const r = await call(me.GET, req('/api/me', { cookie: await signIn(ADMIN) }));
      assert.deepEqual(r.data.storage, { mode: 'redis', writable: true });
      assert.deepEqual(r.data.warnings, []);
    });

    it('also works with the UPSTASH_REDIS_REST_* names', async (t) => {
      env(t, baseEnv({ UPSTASH_REDIS_REST_URL: shim.url + '/', UPSTASH_REDIS_REST_TOKEN: shim.token, DASHBOARDS: JSON.stringify(SEED) }));
      const d = await list(await signIn(ADMIN));
      assert.equal(d.mode, 'redis');
      assert.equal(d.items.length, 3);
    });

    it('seeds once from DASHBOARDS with passwords encrypted at rest', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      assert.equal(d.mode, 'redis');
      assert.equal(d.rev, 1);
      assert.equal(d.canEdit, true);
      assert.deepEqual(d.items.map((x) => x.name), SEED.map((x) => x.name));
      assert.deepEqual(d.items.map((x) => x.hasPassword), [true, true, false]);

      const { raw, doc } = await rawDoc();
      for (const pw of SEED_PASSWORDS) assert.ok(!raw.includes(pw), 'plaintext password at rest: ' + pw);
      assert.ok(doc.items[0].password.startsWith('enc:v1:'));
      assert.ok(doc.items[1].password.startsWith('enc:v1:'));
      assert.equal(doc.items[2].password, '');
      assert.equal(await shim.raw('GET', KEY_REV), '1');

      // A redeploy with a different DASHBOARDS value never overwrites the stored list.
      process.env.DASHBOARDS = JSON.stringify([{ name: 'Replacement', url: 'https://r.example' }]);
      const again = await list(cookie);
      assert.deepEqual(again.items.map((x) => x.name), SEED.map((x) => x.name));
      assert.equal(again.rev, 1);
    });

    it('without VAULT_KEY passwords are stored as given and still revealable', async (t) => {
      env(t, redisEnv({ VAULT_KEY: undefined }));
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const { doc } = await rawDoc();
      assert.equal(doc.items[0].password, 'seo-secret-pw-111');
      assert.equal((await revealPw(cookie, d.items[0].id)).password, 'seo-secret-pw-111');
      const w = (await call(me.GET, req('/api/me', { cookie }))).data.warnings.map((x) => x.code);
      assert.deepEqual(w, ['no_vault_key']);
    });

    it('seed errors are shown to admins on the seeding request only', async (t) => {
      env(t, redisEnv({ DASHBOARDS: JSON.stringify([...SEED, { name: 'No URL' }]) }));
      const first = await list(await signIn(ADMIN));
      assert.equal(first.items.length, 3);
      assert.equal(first.seedErrors.length, 1);
      assert.match(first.seedErrors[0], /entry 4/);
    });

    it('an empty DASHBOARDS seeds an empty list that can be added to', async (t) => {
      env(t, redisEnv({ DASHBOARDS: undefined }));
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      assert.deepEqual(d.items, []);
      const r = await post(cookie, { name: 'First', url: 'https://first.example', rev: d.rev });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.items.length, 1);
    });

    it('corrupted stored data is a 500, not a crash or silent reset', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      await shim.raw('SET', KEY_LIST, '{not json');
      await shim.raw('SET', KEY_REV, '3');
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      assert.equal(r.status, 500);
      assert.match(r.data.error, /corrupted/);
      assert.equal(await shim.raw('GET', KEY_LIST), '{not json', 'data left for recovery');
    });

    it('a list whose revision key went missing can still be edited', async (t) => {
      // The read path reports rev 1 for a missing rev key; the compare-and-set
      // must agree, otherwise every save is a permanent 409 "changed in another window".
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      await list(cookie);
      await shim.raw('DEL', KEY_REV);
      const d = await list(cookie);
      const r = await post(cookie, { name: 'After rev loss', url: 'https://after.example', rev: d.rev });
      assert.equal(r.status, 200, `rev=${d.rev}: ${r.text}`);
    });

    it('storage unreachable -> 503 with a friendly message', async (t) => {
      env(t, redisEnv({ KV_REST_API_URL: 'http://127.0.0.1:4203' }));
      t.mock.method(console, 'error', () => {});
      const cookie = await signIn(ADMIN); // sign-in degrades gracefully without storage
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      assert.equal(r.status, 503);
      assert.match(r.data.error, /unreachable/);
    });

    it('storage rejecting the token -> 503 without leaking the token', async (t) => {
      env(t, redisEnv({ KV_REST_API_TOKEN: 'wrong-token-zzz' }));
      t.mock.method(console, 'error', () => {});
      const cookie = await signIn(ADMIN);
      const r = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      assert.equal(r.status, 503);
      assert.match(r.data.error, /Storage rejected/);
      assert.ok(!r.text.includes('wrong-token-zzz'));
    });
  });

  describe('create / update / delete with optimistic concurrency', () => {
    it('POST adds, bumps the revision, encrypts the password and audits', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN, { ip: '203.0.113.77' });
      const d = await list(cookie);
      const r = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie, ip: '203.0.113.77',
        json: { name: 'Analytics', url: 'https://analytics.example', username: 'an', password: 'an-pw-444', rev: d.rev },
      }));
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.saved, true);
      assert.equal(r.data.rev, d.rev + 1);
      assert.equal(r.data.items.length, 4);
      assert.ok(!r.text.includes('an-pw-444'));
      assert.ok(!/"password"\s*:/.test(r.text));
      const added = r.data.items.find((x) => x.name === 'Analytics');
      assert.equal(added.hasPassword, true);
      assert.equal(added.order, 3);

      const { raw } = await rawDoc();
      assert.ok(!raw.includes('an-pw-444'));
      assert.equal(await shim.raw('GET', KEY_REV), String(d.rev + 1));
      assert.equal((await revealPw(cookie, added.id)).password, 'an-pw-444');

      const ev = (await events(cookie)).find((e) => e.type === 'create');
      assert.equal(ev.target, 'Analytics');
      assert.equal(ev.user, 'admin');
      assert.equal(ev.ip, '203.0.113.77');
    });

    it('POST with a stale or missing revision is a 409 conflict and changes nothing', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      assert.equal((await post(cookie, { name: 'A', url: 'https://a.example', rev: d.rev })).status, 200);
      for (const rev of [d.rev, undefined, 'abc', d.rev + 5]) {
        const r = await post(cookie, { name: 'B', url: 'https://b.example', rev });
        assert.equal(r.status, 409, `rev ${rev}`);
        assert.equal(r.data.conflict, true);
      }
      assert.equal((await list(cookie)).items.length, 4);
    });

    it('two simultaneous saves from the same revision: exactly one wins', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const results = await Promise.all(['Tab 1', 'Tab 2', 'Tab 3'].map((name) =>
        post(cookie, { name, url: 'https://tabs.example', rev: d.rev })));
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409, 409]);
      const after = await list(cookie);
      assert.equal(after.items.length, 4);
      assert.equal(after.rev, d.rev + 1);
    });

    it('the Lua compare-and-set itself refuses a stale revision', async (t) => {
      env(t, redisEnv());
      const cfg = getConfig();
      const state = await loadDashboards(cfg);
      const rev2 = await saveDashboards(cfg, state.items, state.rev);
      assert.equal(rev2, state.rev + 1);
      await assert.rejects(saveDashboards(cfg, [], state.rev), (e) => e.status === 409 && e.extra.conflict === true);
      await assert.rejects(saveDashboards(cfg, [], -1), (e) => e.status === 400);
      await assert.rejects(saveDashboards(cfg, [], 'x'), (e) => e.status === 400);
      assert.equal((await loadDashboards(cfg)).items.length, 3, 'stale write did not clobber the list');
    });

    it('PUT keeps the password when omitted, clears it with "", replaces it with a new value', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      let d = await list(cookie);
      const seo = d.items[0];

      let r = await put(cookie, `id=${seo.id}`, { name: 'SEO v2', url: seo.url, username: 'seo-admin', rev: d.rev });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.items.find((x) => x.id === seo.id).name, 'SEO v2');
      assert.deepEqual(await revealPw(cookie, seo.id), { username: 'seo-admin', password: 'seo-secret-pw-111' });
      assert.deepEqual(r.data.items.find((x) => x.id === seo.id).links, seo.links, 'links kept');

      d = await list(cookie);
      r = await put(cookie, `id=${seo.id}`, { name: 'SEO v2', url: seo.url, password: 'rotated-pw-555', rev: d.rev });
      assert.equal(r.status, 200, r.text);
      assert.equal((await revealPw(cookie, seo.id)).password, 'rotated-pw-555');
      assert.ok(!(await rawDoc()).raw.includes('rotated-pw-555'));

      d = await list(cookie);
      r = await put(cookie, `id=${seo.id}`, { name: 'SEO v2', url: seo.url, password: '', rev: d.rev });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.items.find((x) => x.id === seo.id).hasPassword, false);
      assert.equal((await revealPw(cookie, seo.id)).password, '');

      const ev = (await events(cookie)).filter((e) => e.type === 'update');
      assert.equal(ev.length, 3);
      assert.ok(!JSON.stringify(ev).includes('rotated-pw-555'));
    });

    it('PUT with a stale revision is a 409; unknown id is a 404', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const id = d.items[1].id;
      assert.equal((await put(cookie, `id=${id}`, { name: 'x', url: 'https://x.example', rev: d.rev })).status, 200);
      const stale = await put(cookie, `id=${id}`, { name: 'y', url: 'https://y.example', rev: d.rev });
      assert.equal(stale.status, 409);
      assert.equal((await list(cookie)).items.find((x) => x.id === id).name, 'x');
      assert.equal((await put(cookie, 'id=missing', { name: 'x', url: 'https://x.example', rev: d.rev + 1 })).status, 404);
    });

    it('PUT ?action=reorder persists the new order', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const ids = d.items.map((x) => x.id);
      const r = await put(cookie, 'action=reorder', { ids: [ids[2], ids[1], ids[0]], rev: d.rev });
      assert.equal(r.status, 200, r.text);
      assert.deepEqual(r.data.items.map((x) => x.name), ['PMO', 'Bridge Dashboard', 'SEO Tracker']);
      assert.deepEqual((await list(cookie)).items.map((x) => x.name), ['PMO', 'Bridge Dashboard', 'SEO Tracker']);
      assert.ok((await events(cookie)).some((e) => e.type === 'reorder'));

      const stale = await put(cookie, 'action=reorder', { ids, rev: d.rev });
      assert.equal(stale.status, 409);
      const bad = await put(cookie, 'action=reorder', { ids: ids.slice(1), rev: d.rev + 1 });
      assert.equal(bad.status, 400);
    });

    it('DELETE needs the current revision', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const id = d.items[1].id;
      assert.equal((await del(cookie, `id=${id}`)).status, 409, 'missing rev');
      assert.equal((await del(cookie, `id=${id}&rev=${d.rev + 1}`)).status, 409, 'wrong rev');
      const r = await del(cookie, `id=${id}&rev=${d.rev}`);
      assert.equal(r.status, 200, r.text);
      assert.deepEqual(r.data.items.map((x) => x.name), ['SEO Tracker', 'PMO']);
      assert.equal(r.data.rev, d.rev + 1);
      assert.equal((await del(cookie, `id=${id}&rev=${r.data.rev}`)).status, 404);
      const ev = (await events(cookie)).find((e) => e.type === 'delete');
      assert.equal(ev.target, 'Bridge Dashboard');
    });

    it('validation errors are 400 and do not bump the revision', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const d = await list(cookie);
      const r = await post(cookie, { name: 'X', url: 'javascript:alert(document.cookie)', rev: d.rev });
      assert.equal(r.status, 400);
      assert.equal(r.data.field, 'URL');
      assert.equal((await list(cookie)).rev, d.rev);
    });

    it('the hub refuses a 201st dashboard', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const items = Array.from({ length: 200 }, (_, i) => ({ ...normalizeDashboard({ name: 'D' + i, url: `https://d${i}.example` }), order: i }));
      await shim.raw('SET', KEY_LIST, JSON.stringify({ items }));
      await shim.raw('SET', KEY_REV, '9');
      const r = await post(cookie, { name: 'One too many', url: 'https://x.example', rev: 9 });
      assert.equal(r.status, 400);
      assert.match(r.data.error, /at most 200/);
    });

    it('viewers cannot mutate and the store is untouched', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(VIEWER);
      const d = await list(cookie);
      assert.equal(d.canEdit, false);
      const ids = d.items.map((x) => x.id);
      const results = [
        await post(cookie, { name: 'x', url: 'https://x.example', rev: d.rev }),
        await put(cookie, `id=${ids[0]}`, { name: 'x', url: 'https://x.example', rev: d.rev }),
        await put(cookie, 'action=reorder', { ids: ids.slice().reverse(), rev: d.rev }),
        await del(cookie, `id=${ids[0]}&rev=${d.rev}`),
      ];
      assert.deepEqual(results.map((r) => r.status), [403, 403, 403, 403]);
      const after = await list(cookie);
      assert.equal(after.rev, d.rev);
      assert.deepEqual(after.items.map((x) => x.name), d.items.map((x) => x.name));
    });
  });

  describe('reveal, export and the activity log', () => {
    it('reveal decrypts and writes an audit entry without the secret', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(VIEWER, { ip: '203.0.113.9' });
      const d = await list(cookie);
      const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, ip: '203.0.113.9', json: { id: d.items[1].id } }));
      assert.deepEqual(r.data, { username: 'bridge', password: 'bridge-secret-pw-222' });
      const admin = await signIn(ADMIN);
      const ev = (await events(admin)).find((e) => e.type === 'reveal');
      assert.deepEqual({ target: ev.target, user: ev.user, ip: ev.ip }, { target: 'Bridge Dashboard', user: 'viewer', ip: '203.0.113.9' });
      assert.ok(!Number.isNaN(Date.parse(ev.t)));
      const raw = await shim.raw('LRANGE', 'portal:audit', '0', '-1');
      for (const pw of SEED_PASSWORDS) assert.ok(!raw.join('\n').includes(pw), 'audit log contains a password');
    });

    it('reveal fails clearly if VAULT_KEY is removed or changed', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      process.env.VAULT_KEY = 'a-different-key';
      let r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[0].id } }));
      assert.equal(r.status, 500);
      assert.match(r.data.error, /VAULT_KEY may have changed/);
      delete process.env.VAULT_KEY;
      r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[0].id } }));
      assert.equal(r.status, 500);
      assert.match(r.data.error, /VAULT_KEY is not set/);
      assert.ok(!r.text.includes('enc:v1:'));
    });

    it('reveal is rate limited per user', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      await shim.raw('SET', 'portal:rl:reveal:admin', '120');
      const r = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie, json: { id: items[0].id } }));
      assert.equal(r.status, 429);
      assert.ok(Number(r.res.headers.get('retry-after')) > 0);
      assert.ok(!r.text.includes('seo-secret-pw-111'));
      // Other users are unaffected.
      const v = await call(reveal.POST, req('/api/reveal', { method: 'POST', cookie: await signIn(VIEWER), json: { id: items[0].id } }));
      assert.equal(v.status, 200);
    });

    it('export: admin only; secrets decrypted only with ?secrets=1; both audited', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      await list(cookie);
      const plain = await call(exportApi.GET, req('/api/export', { cookie }));
      assert.equal(plain.status, 200);
      for (const pw of SEED_PASSWORDS) assert.ok(!plain.text.includes(pw));
      assert.ok(!plain.text.includes('enc:v1:'));

      const full = await call(exportApi.GET, req('/api/export?secrets=1', { cookie }));
      assert.equal(full.data.includesPasswords, true);
      assert.deepEqual(full.data.dashboards.map((x) => x.password), ['seo-secret-pw-111', 'bridge-secret-pw-222', undefined]);

      const types = (await events(cookie)).map((e) => e.type);
      assert.ok(types.includes('export'));
      assert.ok(types.includes('export_secrets'));

      const viewer = await call(exportApi.GET, req('/api/export?secrets=1', { cookie: await signIn(VIEWER) }));
      assert.equal(viewer.status, 403);
    });

    it('audit: newest first, honours limit, admin only', async (t) => {
      env(t, redisEnv());
      const cookie = await signIn(ADMIN);
      const { items } = await list(cookie);
      for (let i = 0; i < 3; i++) await revealPw(cookie, items[0].id);
      const all = await events(cookie);
      assert.equal(all[0].type, 'reveal');
      assert.equal(all[all.length - 1].type, 'login');
      assert.equal((await events(cookie, 2)).length, 2);
      assert.equal((await events(cookie, 'abc')).length, all.length);
      const r = await call(auditApi.GET, req('/api/audit', { cookie: await signIn(VIEWER) }));
      assert.equal(r.status, 403);
      const mode = await call(auditApi.GET, req('/api/audit', { cookie }));
      assert.equal(mode.data.mode, 'redis');
    });
  });

  describe('sign-in with storage connected', () => {
    it('audits sign-in, failed sign-in and sign-out', async (t) => {
      env(t, redisEnv());
      const ip = uniqueIp();
      const bad = await call(login.POST, req('/api/login', { method: 'POST', ip, json: { username: 'admin', password: 'nope' } }));
      assert.equal(bad.status, 401);
      const cookie = await signIn(ADMIN, { ip });
      await call(logout.POST, req('/api/logout', { method: 'POST', cookie, ip }));
      const ev = await events(await signIn(ADMIN));
      const types = ev.map((e) => e.type);
      assert.ok(types.includes('login_failed'));
      assert.ok(types.includes('logout'));
      assert.ok(types.filter((x) => x === 'login').length >= 2);
      const failed = ev.find((e) => e.type === 'login_failed');
      assert.deepEqual([failed.user, failed.ip], ['admin', ip]);
      assert.ok(!JSON.stringify(ev).includes('nope'), 'attempted password not logged');
    });

    it('rate limiting is shared through Redis and expires', async (t) => {
      env(t, redisEnv());
      const ip = uniqueIp();
      const fails = await Promise.all(Array.from({ length: 10 }, () =>
        call(login.POST, req('/api/login', { method: 'POST', ip, json: { username: 'admin', password: 'bad' } }))));
      assert.ok(fails.every((r) => r.status === 401));
      assert.equal(await shim.raw('GET', 'portal:rl:login:ip:' + ip), '10');
      const ttl = await shim.raw('TTL', 'portal:rl:login:ip:' + ip);
      assert.ok(ttl > 0 && ttl <= 900, 'ttl ' + ttl);
      const locked = await call(login.POST, req('/api/login', { method: 'POST', ip, json: ADMIN }));
      assert.equal(locked.status, 429);
      // The lockout lives in Redis, so clearing it there lifts it.
      await shim.raw('DEL', 'portal:rl:login:ip:' + ip);
      const ok = await call(login.POST, req('/api/login', { method: 'POST', ip, json: ADMIN }));
      assert.equal(ok.status, 200);
    });

    it('a successful sign-in clears the IP counter in Redis', async (t) => {
      env(t, redisEnv());
      const ip = uniqueIp();
      await call(login.POST, req('/api/login', { method: 'POST', ip, json: { username: 'admin', password: 'bad' } }));
      assert.equal(await shim.raw('GET', 'portal:rl:login:ip:' + ip), '1');
      await signIn(ADMIN, { ip });
      assert.equal(await shim.raw('GET', 'portal:rl:login:ip:' + ip), null);
    });
  });
});
