/*
 * Static guarantees: the shipped front-end builds the DOM without HTML strings,
 * pages run no inline script (the CSP forbids it), vercel.json applies the
 * security headers everywhere, and the secrets generator prints usable values.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const publicFiles = walk(PUBLIC);
const read = (p) => readFileSync(p, 'utf8');

describe('static files and platform config', () => {
  it('public/ holds only the expected kinds of files', () => {
    for (const f of publicFiles) {
      assert.match(f, /\.(html|js|css|svg|txt)$/, relative(ROOT, f));
      assert.doesNotMatch(f, /(^|\/)\.env|\.json$/, relative(ROOT, f));
    }
  });

  it('no static file carries a credential value', () => {
    for (const f of publicFiles) {
      const text = read(f);
      assert.doesNotMatch(text, /"password"\s*:\s*"[^"]+"/, relative(ROOT, f));
      assert.doesNotMatch(text, /(SESSION_SECRET|VAULT_KEY|PORTAL_PASSWORD|KV_REST_API_TOKEN)\s*[=:]\s*['"]?[A-Za-z0-9_-]{6,}/, relative(ROOT, f));
      assert.doesNotMatch(text, /enc:v1:[A-Za-z0-9_-]+:/, relative(ROOT, f));
    }
  });

  it('front-end JavaScript uses no HTML-string or code-string sinks', () => {
    for (const f of publicFiles.filter((p) => p.endsWith('.js'))) {
      const code = read(f);
      for (const sink of [/\.innerHTML\s*[+]?=/, /\.outerHTML\s*=/, /insertAdjacentHTML\s*\(/, /document\.write(ln)?\s*\(/,
        /\beval\s*\(/, /new\s+Function\s*\(/, /setTimeout\s*\(\s*['"`]/, /setInterval\s*\(\s*['"`]/]) {
        assert.doesNotMatch(code, sink, `${relative(ROOT, f)} uses ${sink}`);
      }
    }
  });

  it('HTML pages load only same-origin external scripts: no inline script or handlers', () => {
    for (const f of publicFiles.filter((p) => p.endsWith('.html'))) {
      const html = read(f);
      const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      assert.ok(scripts.length > 0, relative(ROOT, f));
      for (const [, attrs, body] of scripts) {
        const src = /\bsrc\s*=\s*"([^"]+)"/.exec(attrs);
        assert.ok(src, `${relative(ROOT, f)} has an inline <script>`);
        assert.match(src[1], /^\/assets\//, `${relative(ROOT, f)} loads ${src[1]}`);
        assert.equal(body.trim(), '');
      }
      assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${relative(ROOT, f)} has an inline event handler`);
      assert.doesNotMatch(html, /javascript:/i, relative(ROOT, f));
      assert.match(html, /<meta name="robots" content="noindex/, relative(ROOT, f));
    }
  });

  it('the login form works without JavaScript and carries next', () => {
    const html = read(join(PUBLIC, 'login.html'));
    assert.match(html, /<form[^>]*method="post"[^>]*action="\/api\/login"/);
    assert.match(html, /<input type="hidden" name="next"/);
    assert.match(html, /name="username"/);
    assert.match(html, /name="password" type="password"|type="password"[^>]*name="password"|name="password"[^>]*type="password"/);
  });

  it('robots.txt disallows everything', () => {
    assert.match(read(join(PUBLIC, 'robots.txt')), /User-agent: \*\s+Disallow: \//);
  });

  describe('vercel.json', () => {
    const vercel = JSON.parse(read(join(ROOT, 'vercel.json')));
    const rules = vercel.headers.map((r) => ({ re: new RegExp('^' + r.source + '$'), headers: r.headers }));
    const headersFor = (path) => {
      const out = {};
      for (const r of rules) if (r.re.test(path)) for (const h of r.headers) out[h.key.toLowerCase()] = h.value;
      return out;
    };

    it('serves public/ with clean URLs and no framework', () => {
      assert.equal(vercel.outputDirectory, 'public');
      assert.equal(vercel.cleanUrls, true);
      assert.equal(vercel.framework, null);
    });

    it('applies the security headers to pages, APIs and assets', () => {
      for (const path of ['/', '/login', '/api/dashboards', '/api/reveal', '/assets/app.js', '/favicon.svg']) {
        const h = headersFor(path);
        assert.equal(h['x-frame-options'], 'DENY', path);
        assert.equal(h['x-content-type-options'], 'nosniff', path);
        assert.equal(h['referrer-policy'], 'no-referrer', path);
        assert.match(h['strict-transport-security'] || '', /max-age=\d{7,}/, path);
        assert.match(h['x-robots-tag'] || '', /noindex/, path);
        const csp = h['content-security-policy'] || '';
        for (const directive of ["default-src 'self'", "script-src 'self'", "frame-ancestors 'none'", "object-src 'none'",
          "base-uri 'none'", "form-action 'self'", "connect-src 'self'"]) {
          assert.ok(csp.includes(directive), `${path} CSP lacks ${directive}`);
        }
        assert.doesNotMatch(csp, /script-src[^;]*'unsafe-(inline|eval)'/, path);
      }
    });

    it('pages and APIs are never cached; static assets may be', () => {
      for (const path of ['/', '/login', '/index.html', '/api/dashboards', '/api/me']) {
        assert.equal(headersFor(path)['cache-control'], 'private, no-store', path);
      }
      assert.equal(headersFor('/assets/app.js')['cache-control'], undefined);
    });
  });

  describe('scripts/generate-secrets.mjs', () => {
    const run = (...args) => new Promise((resolve, reject) => {
      execFile(process.execPath, [join(ROOT, 'scripts', 'generate-secrets.mjs'), ...args], { timeout: 10_000 },
        (err, stdout, stderr) => (err ? reject(err) : resolve({ stdout, stderr })));
    });

    it('prints strong, distinct values in env-file format', async () => {
      const a = await run('ops-lead');
      const b = await run();
      const parse = (s) => Object.fromEntries(s.trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
      const va = parse(a.stdout);
      const vb = parse(b.stdout);
      assert.deepEqual(Object.keys(va), ['PORTAL_USERNAME', 'PORTAL_PASSWORD', 'SESSION_SECRET', 'VAULT_KEY']);
      assert.equal(va.PORTAL_USERNAME, 'ops-lead');
      assert.equal(vb.PORTAL_USERNAME, 'admin');
      assert.match(va.PORTAL_PASSWORD, /^[A-HJ-NP-Za-km-z2-9]{20}$/);
      assert.match(va.SESSION_SECRET, /^[A-Za-z0-9_-]{64}$/);
      assert.match(va.VAULT_KEY, /^[A-Za-z0-9_-]{43}$/);
      for (const k of ['PORTAL_PASSWORD', 'SESSION_SECRET', 'VAULT_KEY']) assert.notEqual(va[k], vb[k], k);
      assert.match(a.stderr, /VAULT_KEY/);
    });
  });
});
