/*
 * POST /api/reveal  { id }  ->  { username, password }
 * Credentials are fetched one dashboard at a time, on demand, and every
 * reveal is written to the activity log. POST (not GET) keeps them out of
 * URLs, history and caches, and lets the same-origin check apply.
 */
import { getConfig } from '../lib/config.js';
import { openPassword } from '../lib/dashboards.js';
import {
  HttpError, assertSameOrigin, clientIp, handle, json, methodNotAllowed, readJson, requireSession,
} from '../lib/http.js';
import { audit, hit, loadDashboards } from '../lib/store.js';

export const POST = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireSession(request, cfg, { strict: true });
  const body = await readJson(request);

  const limit = await hit(cfg, 'reveal:' + session.username.toLowerCase(), 120, 10 * 60);
  if (!limit.allowed) {
    throw new HttpError(429, 'Too many credential requests. Wait a few minutes.', { retryAfter: limit.retryAfter });
  }

  const state = await loadDashboards(cfg);
  const rec = state.items.find((d) => d.id === String(body.id || ''));
  if (!rec) throw new HttpError(404, 'That dashboard no longer exists. Reload the page.');

  const password = await openPassword(rec, cfg.vaultKey);
  await audit(cfg, { type: 'reveal', target: rec.name, user: session.username, ip: clientIp(request) });
  return json({ username: rec.username || '', password });
});

export const GET = methodNotAllowed(['POST']);
