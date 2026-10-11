/*
 * Local stand-in for Vercel, with no dependencies:
 *   node scripts/dev-server.mjs            (or: npm run dev)
 *
 * Emulates the parts of the platform this project uses:
 *   - Routing Middleware (middleware.js) runs first on every request. Like
 *     Vercel's Node.js middleware runtime, only a Response carrying
 *     `x-middleware-next: 1` continues; any other Response is final, and
 *     returning nothing is an error (Vercel would serve an empty 200)
 *   - /api/<name> -> api/<name>.js, calling the export named after the method
 *   - static files from public/ with cleanUrls (/login -> login.html,
 *     /login.html -> 308 /login) and the headers declared in vercel.json
 *   - Vercel's forwarding headers (x-forwarded-proto/-host/-for, x-real-ip)
 *
 * Environment variables come from the shell and from .env.local if present.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnvFile(join(ROOT, '.env.local'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon',
};

const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const headerRules = (vercel.headers || []).map((r) => ({ re: new RegExp('^' + r.source + '$'), headers: r.headers }));

function applyConfiguredHeaders(path, res) {
  for (const rule of headerRules) {
    if (rule.re.test(path)) for (const h of rule.headers) res.setHeader(h.key, h.value);
  }
}

const middleware = (await import(pathToFileURL(join(ROOT, 'middleware.js')).href)).default;
const apiCache = new Map();

async function loadApi(name) {
  if (!/^[a-z0-9-]+$/i.test(name)) return null;
  const file = join(ROOT, 'api', name + '.js');
  if (!existsSync(file)) return null;
  if (!apiCache.has(name)) apiCache.set(name, await import(pathToFileURL(file).href));
  return apiCache.get(name);
}

async function toWebRequest(req, body) {
  const proto = process.env.DEV_FORWARDED_PROTO || 'http';
  const host = req.headers.host || 'localhost';
  const url = proto + '://' + host + req.url;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
    else if (v !== undefined) headers.set(k, v);
  }
  // Vercel always sets these; clients cannot spoof them through the platform.
  const ip = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  headers.set('x-real-ip', ip);
  headers.set('x-forwarded-for', ip);
  headers.set('x-forwarded-proto', proto);
  headers.set('x-forwarded-host', host);
  const init = { method: req.method, headers };
  if (body && body.length && req.method !== 'GET' && req.method !== 'HEAD') init.body = body;
  return new Request(url, init);
}

async function sendWeb(res, webRes, path, { configuredHeaders = true } = {}) {
  if (configuredHeaders) applyConfiguredHeaders(path, res);
  res.statusCode = webRes.status;
  const cookies = typeof webRes.headers.getSetCookie === 'function' ? webRes.headers.getSetCookie() : [];
  webRes.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') return;
    res.setHeader(k, v);
  });
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
}

async function serveStatic(res, path) {
  let rel = decodeURIComponent(path);
  if (rel === '/' || rel === '') rel = '/index.html';
  else if (!extname(rel)) rel = rel + '.html';
  const file = normalize(join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + sep)) return false;
  try {
    const st = await stat(file);
    if (!st.isFile()) return false;
  } catch {
    return false;
  }
  applyConfiguredHeaders(path, res);
  res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
  return true;
}

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const url = new URL(req.url, 'http://local');
  const path = url.pathname;

  try {
    // cleanUrls + trailingSlash:false, as Vercel applies them before middleware.
    if (path.endsWith('.html') && !path.startsWith('/api/')) {
      const target = path === '/index.html' ? '/' : path.slice(0, -5);
      res.writeHead(308, { Location: target + url.search });
      res.end();
      return;
    }
    if (path === '/index') {
      res.writeHead(308, { Location: '/' + url.search });
      res.end();
      return;
    }
    if (path.length > 1 && path.endsWith('/')) {
      res.writeHead(308, { Location: path.replace(/\/+$/, '') + url.search });
      res.end();
      return;
    }

    // Vercel semantics: a Response with x-middleware-next: 1 means "continue"
    // (its other headers are merged into the final response). Any other
    // Response is sent as-is. Returning nothing is NOT treated as continue,
    // because the platform does not document that, so the emulator must not
    // be more permissive than production.
    const mwResult = await middleware(await toWebRequest(req, body));
    if (!(mwResult instanceof Response)) {
      throw new Error('middleware returned no Response; use next() to continue');
    }
    if (mwResult.headers.get('x-middleware-next') !== '1') {
      // vercel dev does not add vercel.json headers to a middleware short-circuit.
      await sendWeb(res, mwResult, path, { configuredHeaders: false });
      return;
    }
    mwResult.headers.forEach((v, k) => {
      if (!k.startsWith('x-middleware-')) res.setHeader(k, v);
    });

    if (path.startsWith('/api/')) {
      const mod = await loadApi(path.slice(5));
      if (!mod) {
        await sendWeb(res, new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }), path);
        return;
      }
      const fn = mod[req.method];
      if (typeof fn !== 'function') {
        await sendWeb(res, new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405 }), path);
        return;
      }
      await sendWeb(res, await fn(await toWebRequest(req, body)), path);
      return;
    }

    if (!(await serveStatic(res, path))) {
      applyConfiguredHeaders(path, res);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
    }
  } catch (err) {
    console.error('[dev-server]', err);
    res.statusCode = 500;
    res.end('Internal error');
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`[dev-server] http://127.0.0.1:${port}  (storage: ${process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'env'})`);
});
