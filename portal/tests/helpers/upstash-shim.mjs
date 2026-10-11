/*
 * Test helper: a real redis-server behind an Upstash-compatible REST API.
 *
 *   POST /           body ["CMD", ...args]          -> {"result": ...} | 400 {"error": ...}
 *   POST /pipeline   body [["CMD", ...], ...]       -> [{"result": ...} | {"error": ...}, ...]
 *   Authorization: Bearer <token>                    -> 401 otherwise
 *
 * Using real Redis means the Lua compare-and-set script is exercised for real.
 * Standalone: node tests/helpers/upstash-shim.mjs   (prints URL + token)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

/* ---------- minimal RESP client ------------------------------------------- */

function encode(args) {
  let out = '*' + args.length + '\r\n';
  for (const a of args) {
    const b = Buffer.from(String(a));
    out += '$' + b.length + '\r\n' + b.toString('binary') + '\r\n';
  }
  return Buffer.from(out, 'binary');
}

function parse(buf, i = 0) {
  const type = String.fromCharCode(buf[i]);
  const eol = buf.indexOf('\r\n', i);
  if (eol < 0) return null;
  const line = buf.toString('utf8', i + 1, eol);
  const next = eol + 2;
  if (type === '+') return { value: line, end: next };
  if (type === '-') return { value: { __error: line }, end: next };
  if (type === ':') return { value: Number(line), end: next };
  if (type === '$') {
    const len = Number(line);
    if (len < 0) return { value: null, end: next };
    if (buf.length < next + len + 2) return null;
    return { value: buf.toString('utf8', next, next + len), end: next + len + 2 };
  }
  if (type === '*') {
    const n = Number(line);
    if (n < 0) return { value: null, end: next };
    const arr = [];
    let pos = next;
    for (let k = 0; k < n; k++) {
      const r = parse(buf, pos);
      if (!r) return null;
      arr.push(r.value);
      pos = r.end;
    }
    return { value: arr, end: pos };
  }
  throw new Error('bad RESP type ' + type);
}

class Resp {
  constructor(port) {
    this.port = port;
    this.queue = [];
    this.buf = Buffer.alloc(0);
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.sock = net.connect(this.port, '127.0.0.1', resolve);
      this.sock.on('error', reject);
      this.sock.on('data', (d) => {
        this.buf = Buffer.concat([this.buf, d]);
        for (;;) {
          if (!this.buf.length || !this.queue.length) break;
          const r = parse(this.buf);
          if (!r) break;
          this.buf = this.buf.subarray(r.end);
          this.queue.shift()(r.value);
        }
      });
    });
  }
  send(args) {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.sock.write(encode(args));
    });
  }
  close() {
    if (this.sock) this.sock.destroy();
  }
}

function wrap(v) {
  return v && typeof v === 'object' && '__error' in v ? { error: v.__error } : { result: v };
}

/* ---------- server -------------------------------------------------------- */

export async function startUpstash({ token = 'test-token' } = {}) {
  const redisPort = await freePort();
  const proc = spawn('redis-server', ['--port', String(redisPort), '--bind', '127.0.0.1',
    '--save', '', '--appendonly', 'no', '--protected-mode', 'no'], { stdio: 'ignore' });

  const client = new Resp(redisPort);
  for (let i = 0; ; i++) {
    try {
      await client.connect();
      break;
    } catch (err) {
      if (i > 50) throw err;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  const stats = { requests: 0, commands: [] };
  const http = createServer(async (req, res) => {
    stats.requests++;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'Bearer ' + token) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'bad json' }));
      return;
    }
    if (req.url === '/pipeline') {
      const out = [];
      for (const cmd of body) {
        stats.commands.push(String(cmd[0]).toUpperCase());
        out.push(wrap(await client.send(cmd)));
      }
      res.end(JSON.stringify(out));
      return;
    }
    stats.commands.push(String(body[0]).toUpperCase());
    const r = wrap(await client.send(body));
    if (r.error) res.statusCode = 400;
    res.end(JSON.stringify(r));
  });
  const port = await freePort();
  await new Promise((r) => http.listen(port, '127.0.0.1', r));

  return {
    url: 'http://127.0.0.1:' + port,
    token,
    stats,
    flush: () => client.send(['FLUSHALL']),
    raw: (...args) => client.send(args),
    async stop() {
      await new Promise((r) => http.close(r));
      client.close();
      proc.kill('SIGKILL');
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const u = await startUpstash({ token: process.env.SHIM_TOKEN || 'test-token' });
  console.log(JSON.stringify({ url: u.url, token: u.token }));
  process.on('SIGINT', async () => { await u.stop(); process.exit(0); });
  process.on('SIGTERM', async () => { await u.stop(); process.exit(0); });
}
