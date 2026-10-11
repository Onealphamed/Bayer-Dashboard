/*
 * End-to-end smoke test through scripts/dev-server.mjs (the local Vercel
 * emulator): middleware -> functions -> static files with vercel.json headers.
 * Port 4205 (inside this suite's 4200-4219 range). The server is always killed.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN, SEED, VIEWER, baseEnv } from './helpers/portal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4205;
const BASE = `http://127.0.0.1:${PORT}`;

describe('dev server (local Vercel emulator)', () => {
  let proc;
  let output = '';

  before(async () => {
    const childEnv = { ...process.env, ...baseEnv({ DASHBOARDS: JSON.stringify(SEED) }), PORT: String(PORT) };
    for (const k of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
      'DEV_FORWARDED_PROTO', 'STATUS_ALLOW_PRIVATE', 'NODE_TEST_CONTEXT', 'NODE_OPTIONS']) delete childEnv[k];
    proc = spawn(process.execPath, [join(ROOT, 'scripts', 'dev-server.mjs')], { cwd: ROOT, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    proc.stdout.on('data', (d) => { output += d; });
    proc.stderr.on('data', (d) => { output += d; });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('dev server did not start:\n' + output)), 10_000);
      const check = () => {
        if (output.includes('[dev-server] http://')) { clearTimeout(timer); resolve(); }
      };
      proc.stdout.on('data', check);
      proc.once('exit', (code) => { clearTimeout(timer); reject(new Error(`dev server exited (${code}):\n${output}`)); });
    });
  });

  after(async () => {
    if (!proc || proc.exitCode !== null) return;
    const exited = new Promise((r) => proc.once('exit', r));
    proc.kill('SIGTERM');
    const timer = setTimeout(() => proc.kill('SIGKILL'), 3000);
    await exited;
    clearTimeout(timer);
  });

  const get = (path, opts = {}) => fetch(BASE + path, { redirect: 'manual', ...opts });
  async function signIn(user) {
    const res = await fetch(BASE + '/api/login', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: BASE }, body: JSON.stringify(user),
    });
    assert.equal(res.status, 200, await res.clone().text());
    return res.headers.get('set-cookie').split(';')[0];
  }

  it('starts in env storage mode', () => {
    assert.match(output, /storage: env/);
  });

  it('signed out: pages redirect to /login, APIs 401, login page is served with security headers', async () => {
    const root = await get('/');
    assert.equal(root.status, 302);
    assert.equal(root.headers.get('location'), '/login', 'middleware redirects are relative');
    assert.equal(new URL(root.headers.get('location'), 'http://x').pathname, '/login');
    const deep = await get('/some/page?x=1');
    assert.ok(deep.headers.get('location').startsWith('/login?'), 'relative deep-link redirect');
    assert.equal(new URL(deep.headers.get('location'), 'http://x').searchParams.get('next'), '/some/page?x=1');
    assert.equal((await get('/api/dashboards')).status, 401);
    assert.equal((await get('/assets/app.js')).status, 302);

    const login = await get('/login');
    assert.equal(login.status, 200);
    assert.match(login.headers.get('content-type'), /text\/html/);
    assert.match(login.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(login.headers.get('x-frame-options'), 'DENY');
    assert.equal(login.headers.get('cache-control'), 'private, no-store');
    assert.match(await login.text(), /action="\/api\/login"/);

    const html = await get('/login.html');
    assert.equal(html.status, 308);
    assert.equal(html.headers.get('location'), '/login');
    assert.equal((await get('/assets/portal.css')).status, 200);
  });

  it('cross-site sign-in is refused', async () => {
    const res = await fetch(BASE + '/api/login', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: JSON.stringify(ADMIN),
    });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('set-cookie'), null);
  });

  it('signed in: hub, assets and redacted list; /login bounces to /', async () => {
    const cookie = await signIn(ADMIN);
    const hub = await get('/', { headers: { cookie } });
    assert.equal(hub.status, 200);
    assert.match(await hub.text(), /\/assets\/app\.js/);
    assert.equal((await get('/assets/app.js', { headers: { cookie } })).status, 200);
    const bounce = await get('/login', { headers: { cookie } });
    assert.equal(bounce.status, 302);
    assert.equal(bounce.headers.get('location'), '/', 'signed-in /login bounces with a relative redirect');

    const list = await get('/api/dashboards', { headers: { cookie } });
    assert.equal(list.status, 200);
    assert.match(list.headers.get('cache-control'), /no-store/);
    const text = await list.text();
    assert.ok(!text.includes('seo-secret-pw-111'));
    const items = JSON.parse(text).items;
    assert.equal(items.length, 3);

    const rev = await fetch(BASE + '/api/reveal', {
      method: 'POST', headers: { cookie, origin: BASE, 'content-type': 'application/json' }, body: JSON.stringify({ id: items[0].id }),
    });
    assert.deepEqual(await rev.json(), { username: 'seo-admin', password: 'seo-secret-pw-111' });
  });

  it('a viewer cannot export', async () => {
    const cookie = await signIn(VIEWER);
    assert.equal((await get('/api/export?secrets=1', { headers: { cookie } })).status, 403);
  });

  it('does not serve files outside public/ and 404s unknown APIs', async () => {
    const cookie = await signIn(ADMIN);
    for (const p of ['/..%2fpackage.json', '/..%2f..%2fpackage.json', '/assets/..%2f..%2fvercel.json', '/%2e%2e/api/login.js']) {
      const res = await get(p, { headers: { cookie } });
      assert.equal(res.status, 404, p);
      const body = await res.text();
      assert.ok(!body.includes('"scripts"') && !body.includes('export async function'), p);
    }
    assert.equal((await get('/api/nope', { headers: { cookie } })).status, 404);
    assert.equal((await get('/api/logout', { headers: { cookie } })).status, 405);
  });
});
