/*
 * Entry point for `node --test tests/` (the package.json "test" script).
 *
 * Node 22+ treats a directory argument to `node --test` as a module path and
 * resolves it to tests/index.js, so this file loads every *.test.mjs file in
 * this directory into one test process. (`node --test` with no arguments, or
 * Node 20's directory search, runs the same *.test.mjs files one per process
 * and never picks this file up, so nothing runs twice.)
 *
 * Every suite therefore isolates itself: process.env is restored after each
 * test, servers and redis processes are stopped in after() hooks, and
 * module-level state (rate-limit buckets, the status cache) is never shared
 * between tests by using distinct IPs, usernames and URLs.
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
for (const file of readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort()) {
  await import(pathToFileURL(join(dir, file)).href);
}
