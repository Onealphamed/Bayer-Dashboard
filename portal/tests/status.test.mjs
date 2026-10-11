/*
 * GET /api/status against a local HTTP server (ports 4200-4219 only).
 * The status module caches results per URL for a minute, so every test uses
 * its own URL paths.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import * as status from '../api/status.js';
import { ADMIN, VIEWER, baseEnv, call, env, req, signIn, silenceAuditLogs } from './helpers/portal.mjs';

const PORT = 4200;
const CLOSED_PORT = 4201; // nothing listens here
const HOST = `http://127.0.0.1:${PORT}`;

describe('GET /api/status', () => {
  silenceAuditLogs();
  let server;
  const hits = [];
  before(async () => {
    server = createServer((rq, rs) => {
      hits.push({ path: rq.url, ua: rq.headers['user-agent'], method: rq.method });
      const p = rq.url.split('?')[0];
      if (p.startsWith('/ok')) { rs.writeHead(200, { 'content-type': 'text/html' }); rs.end('<h1>ok</h1>'); return; }
      if (p.startsWith('/redir')) { rs.writeHead(302, { location: '/followed' + p }); rs.end(); return; }
      if (p.startsWith('/auth')) { rs.writeHead(401); rs.end('login'); return; }
      if (p.startsWith('/notfound')) { rs.writeHead(404); rs.end(); return; }
      if (p.startsWith('/fail')) { rs.writeHead(500); rs.end('boom'); return; }
      if (p.startsWith('/unavailable')) { rs.writeHead(503); rs.end(); return; }
      if (p.startsWith('/big')) { rs.writeHead(200); rs.end(Buffer.alloc(2 * 1024 * 1024, 120)); return; }
      rs.writeHead(200); rs.end();
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, '127.0.0.1', resolve);
    });
  });
  after(async () => {
    if (!server) return;
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  });

  const hitsFor = (prefix) => hits.filter((h) => h.path.startsWith(prefix));

  /* Explicit ids so results (keyed by id) can be matched to names. */
  const withIds = (list) => list.map((d, i) => ({ id: d.id || 'd' + i, ...d }));

  async function statusFor(t, dashboardsList, extra = {}) {
    env(t, baseEnv({ DASHBOARDS: JSON.stringify(withIds(dashboardsList)), ...extra }));
    const cookie = await signIn(ADMIN);
    const r = await call(status.GET, req('/api/status', { cookie }));
    assert.equal(r.status, 200, r.text);
    return r.data.results;
  }
  const byName = (list, results, name) => results[withIds(list).find((d) => d.name === name).id];

  it('401 when signed out; POST is 405', async (t) => {
    env(t, baseEnv());
    assert.equal((await call(status.GET, req('/api/status'))).status, 401);
    assert.equal((await call(status.POST, req('/api/status', { method: 'POST' }))).status, 405);
  });

  it('classifies 200 / 3xx / 4xx as up and 5xx / unreachable as down (STATUS_ALLOW_PRIVATE=1)', async (t) => {
    const list = [
      { id: 'ok', name: 'OK', url: `${HOST}/ok-a` },
      { id: 'redir', name: 'Redirect', url: `${HOST}/redir-a` },
      { id: 'auth', name: 'Auth', url: `${HOST}/auth-a` },
      { id: 'nf', name: 'NotFound', url: `${HOST}/notfound-a` },
      { id: 'fail', name: 'Fail', url: `${HOST}/fail-a` },
      { id: 'unav', name: 'Unavailable', url: `${HOST}/unavailable-a` },
      { id: 'closed', name: 'Closed', url: `http://127.0.0.1:${CLOSED_PORT}/x-a` },
    ];
    const results = await statusFor(t, list, { STATUS_ALLOW_PRIVATE: '1' });
    assert.deepEqual(Object.keys(results).sort(), list.map((d) => d.id).sort());
    assert.deepEqual([results.ok.state, results.ok.code], ['up', 200]);
    assert.deepEqual([results.redir.state, results.redir.code], ['up', 302]);
    assert.deepEqual([results.auth.state, results.auth.code], ['up', 401]);
    assert.deepEqual([results.nf.state, results.nf.code], ['up', 404]);
    assert.deepEqual([results.fail.state, results.fail.code], ['down', 500]);
    assert.deepEqual([results.unav.state, results.unav.code], ['down', 503]);
    assert.equal(results.closed.state, 'down');
    assert.equal(results.closed.reason, 'unreachable');
    for (const r of Object.values(results)) {
      assert.ok(!Number.isNaN(Date.parse(r.checkedAt)));
      if (r.code) assert.ok(Number.isInteger(r.ms) && r.ms >= 0);
    }
  });

  it('does not follow redirects and identifies itself', async (t) => {
    const list = [{ name: 'R', url: `${HOST}/redir-b` }];
    await statusFor(t, list, { STATUS_ALLOW_PRIVATE: '1' });
    assert.equal(hitsFor('/redir-b').length, 1);
    assert.equal(hitsFor('/followed/redir-b').length, 0, 'redirect target must not be fetched');
    const h = hitsFor('/redir-b')[0];
    assert.equal(h.method, 'GET');
    assert.equal(h.ua, 'MasterDashboard-HealthCheck/1.0');
  });

  it('answers for a large page without reading it all', async (t) => {
    const list = [{ name: 'Big', url: `${HOST}/big-a` }];
    const results = await statusFor(t, list, { STATUS_ALLOW_PRIVATE: '1' });
    assert.equal(byName(list, results, 'Big').state, 'up');
  });

  it('caches each URL for a minute', async (t) => {
    const list = [{ name: 'Cached', url: `${HOST}/ok-cache` }];
    const first = await statusFor(t, list, { STATUS_ALLOW_PRIVATE: '1' });
    const cookie = await signIn(ADMIN);
    const second = (await call(status.GET, req('/api/status', { cookie }))).data.results;
    assert.equal(hitsFor('/ok-cache').length, 1);
    assert.deepEqual(second, first);
  });

  it('viewers can check status too', async (t) => {
    env(t, baseEnv({ DASHBOARDS: JSON.stringify([{ name: 'V', url: `${HOST}/ok-viewer` }]), STATUS_ALLOW_PRIVATE: '1' }));
    const r = await call(status.GET, req('/api/status', { cookie: await signIn(VIEWER) }));
    assert.equal(r.status, 200);
    assert.equal(Object.values(r.data.results)[0].state, 'up');
  });

  it('without STATUS_ALLOW_PRIVATE, private targets are never contacted', async (t) => {
    const list = [
      { name: 'Loopback', url: `${HOST}/ok-private` },
      { name: 'Localhost', url: `http://localhost:${PORT}/ok-private-name` },
      { name: 'Integer', url: `http://2130706433:${PORT}/ok-private-int` },
      { name: 'Hex', url: `http://0x7f.1:${PORT}/ok-private-hex` },
      { name: 'IPv6', url: `http://[::1]:${PORT}/ok-private-v6` },
      { name: 'Metadata', url: 'http://169.254.169.254/latest/meta-data/' },
    ];
    const results = await statusFor(t, list);
    for (const d of list) {
      const r = byName(list, results, d.name);
      assert.deepEqual([r.state, r.reason], ['unknown', 'private address not checked'], d.name);
    }
    assert.equal(hits.filter((h) => h.path.startsWith('/ok-private')).length, 0);
  });

  it('without STATUS_ALLOW_PRIVATE, an IPv4-mapped IPv6 loopback URL is not contacted either', async (t) => {
    // Stored URLs are normalised by the URL parser, so http://[::ffff:127.0.0.1]/
    // reaches the guard as [::ffff:7f00:1]. It must still be treated as private.
    const list = [
      { name: 'Mapped', url: `http://[::ffff:127.0.0.1]:${PORT}/ok-mapped` },
      { name: 'MappedMeta', url: 'http://[::ffff:169.254.169.254]/latest/meta-data/' },
    ];
    const results = await statusFor(t, list);
    for (const d of list) {
      const r = byName(list, results, d.name);
      assert.deepEqual([r.state, r.reason], ['unknown', 'private address not checked'], `${d.name}: ${JSON.stringify(r)}`);
    }
    assert.equal(hitsFor('/ok-mapped').length, 0);
  });

  it('an empty list gives empty results', async (t) => {
    const results = await statusFor(t, []);
    assert.deepEqual(results, {});
  });
});
