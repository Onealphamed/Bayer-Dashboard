/*
 * Cross-cutting request hardening: same-origin checks on every state-changing
 * endpoint, JSON content-type enforcement, body size limits and error shapes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as dashboards from '../api/dashboards.js';
import * as login from '../api/login.js';
import * as logout from '../api/logout.js';
import * as reveal from '../api/reveal.js';
import {
  HttpError, assertSameOrigin, clientIp, errorResponse, handle, json, readJson,
} from '../lib/http.js';
import {
  ADMIN, SEED, VIEWER, baseEnv, call, env, req, signIn, silenceAuditLogs,
} from './helpers/portal.mjs';

const r = (headers = {}, url = 'https://portal.test/api/x') => new Request(url, { method: 'POST', headers });

describe('lib/http.js and request hardening', () => {
  silenceAuditLogs();

  describe('assertSameOrigin', () => {
    it('allows same-origin and header-less (non-browser) requests', () => {
      assert.doesNotThrow(() => assertSameOrigin(r()));
      assert.doesNotThrow(() => assertSameOrigin(r({ origin: 'https://portal.test' })));
      assert.doesNotThrow(() => assertSameOrigin(r({ 'sec-fetch-site': 'same-origin', origin: 'https://portal.test' })));
      assert.doesNotThrow(() => assertSameOrigin(r({ 'sec-fetch-site': 'none' })));
    });

    it('accepts the forwarded host or Host header (custom domains behind a proxy)', () => {
      const internal = 'http://internal.local:3000/api/x';
      assert.doesNotThrow(() => assertSameOrigin(r({ origin: 'https://hub.example.com', 'x-forwarded-host': 'hub.example.com' }, internal)));
      assert.doesNotThrow(() => assertSameOrigin(r({ origin: 'https://hub.example.com', 'x-forwarded-host': 'hub.example.com, other' }, internal)));
      assert.doesNotThrow(() => assertSameOrigin(r({ origin: 'http://localhost:3000', host: 'localhost:3000' }, internal)));
    });

    it('blocks other origins, look-alikes and opaque origins', () => {
      for (const origin of [
        'https://evil.example', 'https://portal.test.evil.example', 'https://evilportal.test', 'https://portal.test:444',
        'null', 'not a url', 'https://sub.portal.test',
      ]) {
        assert.throws(() => assertSameOrigin(r({ origin })), (e) => e instanceof HttpError && e.status === 403, origin);
      }
    });

    it('blocks cross-site and same-site Sec-Fetch-Site even without Origin', () => {
      for (const site of ['cross-site', 'same-site']) {
        assert.throws(() => assertSameOrigin(r({ 'sec-fetch-site': site })), (e) => e.status === 403, site);
        assert.throws(() => assertSameOrigin(r({ 'sec-fetch-site': site, origin: 'https://portal.test' })), (e) => e.status === 403, site);
      }
    });
  });

  describe('readJson', () => {
    const jr = (body, headers = { 'content-type': 'application/json' }) =>
      new Request('https://portal.test/api/x', { method: 'POST', body, headers });

    it('parses JSON (with charset) and treats an empty body as {}', async () => {
      assert.deepEqual(await readJson(jr('{"a":1}')), { a: 1 });
      assert.deepEqual(await readJson(jr('{"a":1}', { 'content-type': 'Application/JSON; charset=utf-8' })), { a: 1 });
      assert.deepEqual(await readJson(jr('')), {});
    });

    it('415 for anything that is not JSON (blocks simple-request CSRF)', async () => {
      for (const type of [undefined, 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data; boundary=x', 'text/json']) {
        const headers = type ? { 'content-type': type } : {};
        await assert.rejects(readJson(jr('{"a":1}', headers)), (e) => e.status === 415, String(type));
      }
    });

    it('400 for malformed JSON', async () => {
      await assert.rejects(readJson(jr('{"a":')), (e) => e.status === 400 && /Malformed JSON/.test(e.message));
    });

    it('413 above 64 KiB, by header or by actual size', async () => {
      await assert.rejects(readJson(jr('{}', { 'content-type': 'application/json', 'content-length': String(64 * 1024 + 1) })), (e) => e.status === 413);
      await assert.rejects(readJson(jr(JSON.stringify({ x: 'a'.repeat(70 * 1024) }))), (e) => e.status === 413);
      assert.ok(await readJson(jr(JSON.stringify({ x: 'a'.repeat(60 * 1024) }))));
    });

    it('maxBytes raises or lowers the cap for one endpoint', async () => {
      const body = JSON.stringify({ x: 'a'.repeat(100 * 1024) });
      assert.ok(await readJson(jr(body), { maxBytes: 256 * 1024 }));
      await assert.rejects(readJson(jr('{"a":1}'), { maxBytes: 4 }), (e) => e.status === 413);
    });

    it('400 for JSON that is not an object', async () => {
      for (const text of ['null', '[]', '[1]', '"s"', '0', 'false']) {
        await assert.rejects(readJson(jr(text)), (e) => e.status === 400 && e.message === 'Expected a JSON object.', text);
      }
    });
  });

  describe('helpers', () => {
    it('json() sets no-store, nosniff and a JSON content type', async () => {
      const res = json({ a: 1 }, 201, { 'X-Test': '1' });
      assert.equal(res.status, 201);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.equal(res.headers.get('x-test'), '1');
      assert.deepEqual(await res.json(), { a: 1 });
    });

    it('errorResponse hides internals of unexpected errors', async (t) => {
      const logged = [];
      t.mock.method(console, 'error', (...a) => logged.push(a.join(' ')));
      const res = errorResponse(new Error('db password is hunter2'));
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.deepEqual(body, { error: 'Something went wrong. Please try again.' });
      assert.equal(logged.length, 1);
    });

    it('errorResponse passes HttpError status, message, extras and Retry-After', async () => {
      const res = errorResponse(new HttpError(429, 'slow down', { retryAfter: 30 }));
      assert.equal(res.status, 429);
      assert.equal(res.headers.get('retry-after'), '30');
      assert.deepEqual(await res.json(), { error: 'slow down', retryAfter: 30 });
    });

    it('handle() converts thrown errors into responses', async (t) => {
      t.mock.method(console, 'error', () => {});
      assert.equal((await handle(async () => { throw new HttpError(418, 'teapot'); })(r())).status, 418);
      assert.equal((await handle(async () => { throw new TypeError('x'); })(r())).status, 500);
    });

    it('clientIp prefers x-real-ip, then the first x-forwarded-for entry', () => {
      assert.equal(clientIp(r({ 'x-real-ip': ' 1.2.3.4 ', 'x-forwarded-for': '5.6.7.8' })), '1.2.3.4');
      assert.equal(clientIp(r({ 'x-forwarded-for': '5.6.7.8, 9.9.9.9' })), '5.6.7.8');
      assert.equal(clientIp(r()), 'unknown');
    });
  });

  describe('every state-changing endpoint enforces same-origin', () => {
    const hostile = [
      { origin: 'https://evil.example' },
      { origin: 'null' },
      { 'sec-fetch-site': 'cross-site' },
    ];

    it('login, logout, reveal and all dashboard mutations answer 403 to cross-site requests', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify(SEED) }));
      const cookie = await signIn(ADMIN);
      const listed = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      const id = listed.data.items[0].id;
      const endpoints = [
        ['login', login.POST, '/api/login', 'POST', ADMIN],
        ['logout', logout.POST, '/api/logout', 'POST', undefined],
        ['reveal', reveal.POST, '/api/reveal', 'POST', { id }],
        ['create', dashboards.POST, '/api/dashboards', 'POST', { name: 'x', url: 'https://x.example' }],
        ['edit', dashboards.PUT, `/api/dashboards?id=${id}`, 'PUT', { name: 'x', url: 'https://x.example' }],
        ['reorder', dashboards.PUT, '/api/dashboards?action=reorder', 'PUT', { ids: listed.data.items.map((d) => d.id) }],
        ['delete', dashboards.DELETE, `/api/dashboards?id=${id}`, 'DELETE', undefined],
      ];
      for (const [name, fn, path, method, body] of endpoints) {
        for (const headers of hostile) {
          const out = await call(fn, req(path, { method, cookie, json: body, headers }));
          assert.equal(out.status, 403, `${name} ${JSON.stringify(headers)}`);
          assert.ok(!out.text.includes('seo-secret-pw-111'), name);
          assert.equal(out.res.headers.get('set-cookie'), null, name);
        }
        // The same request from the portal's own origin is accepted.
        const ok = await call(fn, req(path, { method, cookie, json: body }));
        assert.ok(ok.status < 400, `${name} same-origin -> ${ok.status} ${ok.text}`);
      }
    });

    it('the CSRF check runs before authentication', async (t) => {
      env(t, baseEnv());
      const out = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', json: { name: 'x', url: 'https://x.example' }, headers: { origin: 'https://evil.example' },
      }));
      assert.equal(out.status, 403);
    });
  });

  describe('JSON endpoints refuse other content types (415)', () => {
    it('reveal, create, edit and reorder', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify(SEED) }));
      const cookie = await signIn(VIEWER);
      const admin = await signIn(ADMIN);
      const listed = await call(dashboards.GET, req('/api/dashboards', { cookie }));
      const id = listed.data.items[0].id;
      const cases = [
        [reveal.POST, '/api/reveal', 'POST', cookie, JSON.stringify({ id })],
        [dashboards.POST, '/api/dashboards', 'POST', admin, JSON.stringify({ name: 'x', url: 'https://x.example' })],
        [dashboards.PUT, `/api/dashboards?id=${id}`, 'PUT', admin, JSON.stringify({ name: 'x', url: 'https://x.example' })],
        [dashboards.PUT, '/api/dashboards?action=reorder', 'PUT', admin, JSON.stringify({ ids: [id] })],
      ];
      for (const [fn, path, method, c, body] of cases) {
        for (const type of ['text/plain', 'application/x-www-form-urlencoded', null]) {
          const headers = type ? { 'content-type': type } : {};
          const out = await call(fn, req(path, { method, cookie: c, body, headers }));
          assert.equal(out.status, 415, `${method} ${path} ${type}`);
          assert.equal(out.data.error, 'Expected a JSON request body.');
        }
      }
    });

    it('oversized and malformed bodies', async (t) => {
      env(t, baseEnv({ DASHBOARDS: JSON.stringify(SEED) }));
      const admin = await signIn(ADMIN);
      // Mutations may carry an env-mode draft, so their cap is 256 KiB, not 64.
      const big = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie: admin, json: { name: 'x', url: 'https://x.example', notes: 'n'.repeat(260 * 1024) },
      }));
      assert.equal(big.status, 413);
      const longNotes = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie: admin, json: { name: 'x', url: 'https://x.example', notes: 'n'.repeat(70 * 1024) },
      }));
      assert.equal(longNotes.status, 400);
      assert.equal(longNotes.data.field, 'Notes');
      const bad = await call(dashboards.POST, req('/api/dashboards', {
        method: 'POST', cookie: admin, body: '{"name":', headers: { 'content-type': 'application/json' },
      }));
      assert.equal(bad.status, 400);
      assert.equal(bad.data.error, 'Malformed JSON.');
    });
  });
});
