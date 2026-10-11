/*
 * GET /api/status — is each dashboard reachable?
 *
 * A dashboard counts as "up" when its main URL answers with any status below
 * 500: a login redirect or a 401 still means the site is alive. Results are
 * cached for a minute per URL so opening the hub repeatedly stays cheap.
 */
import { getConfig } from '../lib/config.js';
import { handle, json, methodNotAllowed, requireSession } from '../lib/http.js';
import { checkResolvedHost, isPrivateHost } from '../lib/netguard.js';
import { loadDashboards } from '../lib/store.js';

const TTL_MS = 60 * 1000;
const TIMEOUT_MS = 6000;
const cache = new Map();

async function probe(url, cfg) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.result;

  let result;
  let target;
  try {
    target = new URL(url);
  } catch {
    target = null;
  }
  if (!target || (target.protocol !== 'https:' && target.protocol !== 'http:')) {
    result = { state: 'unknown', reason: 'invalid URL' };
  } else if (!cfg.allowPrivateStatusTargets && isPrivateHost(target.hostname)) {
    result = { state: 'unknown', reason: 'private address not checked' };
  } else {
    const resolved = cfg.allowPrivateStatusTargets ? { ok: true } : await checkResolvedHost(target.hostname);
    if (!resolved.ok) {
      result = resolved.reason === 'private address not checked'
        ? { state: 'unknown', reason: resolved.reason }
        : { state: 'down', reason: resolved.reason };
    }
  }
  if (!result) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const started = Date.now();
    try {
      const res = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: ctl.signal,
        headers: { 'User-Agent': 'MasterDashboard-HealthCheck/1.0', Accept: 'text/html,*/*' },
      });
      try {
        await res.body?.cancel();
      } catch {
        /* body already closed */
      }
      result = {
        state: res.status < 500 ? 'up' : 'down',
        code: res.status,
        ms: Date.now() - started,
      };
    } catch (err) {
      result = {
        state: 'down',
        reason: err && err.name === 'AbortError' ? 'timed out' : 'unreachable',
        ms: Date.now() - started,
      };
    } finally {
      clearTimeout(timer);
    }
  }
  result.checkedAt = new Date().toISOString();
  cache.set(url, { at: Date.now(), result });
  if (cache.size > 500) cache.clear();
  return result;
}

export const GET = handle(async (request) => {
  const cfg = getConfig();
  await requireSession(request, cfg);
  const { items } = await loadDashboards(cfg);
  const entries = await Promise.all(items.map(async (d) => [d.id, await probe(d.url, cfg)]));
  return json({ results: Object.fromEntries(entries) });
});

export const POST = methodNotAllowed(['GET']);
