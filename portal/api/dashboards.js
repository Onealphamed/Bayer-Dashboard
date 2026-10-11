/*
 * /api/dashboards
 *   GET                         list (passwords redacted)            any signed-in user
 *   POST                        add a dashboard                       admin
 *   PUT    ?id=<id>             edit a dashboard                      admin
 *   PUT    ?action=reorder      reorder: { ids: [...], rev }          admin
 *   DELETE ?id=<id>&rev=<rev>   remove a dashboard                    admin
 *
 * With no storage connected the list is read-only: mutations are validated and
 * answered with the updated DASHBOARDS value for the admin to paste into Vercel.
 */
import { getConfig } from '../lib/config.js';
import { normalizeDashboard, publicView, sealPassword, sortDashboards } from '../lib/dashboards.js';
import {
  HttpError, assertSameOrigin, clientIp, handle, json, readJson, requireAdmin, requireSession,
} from '../lib/http.js';
import { toSeedJson } from '../lib/seedjson.js';
import { audit, loadDashboards, saveDashboards } from '../lib/store.js';

function listResponse(state, session) {
  return {
    items: state.items.map(publicView),
    rev: state.rev,
    mode: state.mode,
    canEdit: session.role === 'admin',
    seedErrors: session.role === 'admin' ? state.seedErrors : [],
  };
}

/** Persists in redis mode; in env mode returns the value to paste instead. */
async function commit(cfg, state, nextItems, session, request, event) {
  const ordered = sortDashboards(nextItems);
  if (state.mode !== 'redis') {
    return json({
      readOnly: true,
      mode: 'env',
      envJson: await toSeedJson(ordered, cfg.vaultKey),
      count: ordered.length,
      message: 'No storage is connected, so this change was not saved. Paste the value below into the '
        + 'DASHBOARDS environment variable in Vercel and redeploy — or connect storage to save directly.',
    });
  }
  const rev = await saveDashboards(cfg, ordered, state.rev);
  await audit(cfg, { ...event, user: session.username, ip: clientIp(request) });
  return json({ ...listResponse({ ...state, items: ordered, rev, seedErrors: [] }, session), saved: true });
}

export const GET = handle(async (request) => {
  const cfg = getConfig();
  const session = await requireSession(request, cfg);
  return json(listResponse(await loadDashboards(cfg), session));
});

export const POST = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const body = await readJson(request);
  const state = await loadDashboards(cfg);
  if (state.mode === 'redis' && Number(body.rev) !== state.rev) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }
  if (state.items.length >= 200) throw new HttpError(400, 'The hub holds at most 200 dashboards.');

  let rec = normalizeDashboard(body);
  rec.order = state.items.reduce((m, d) => Math.max(m, Number(d.order) || 0), -1) + 1;
  if (state.mode === 'redis') rec = await sealPassword(rec, cfg.vaultKey);

  return commit(cfg, state, state.items.concat(rec), session, request,
    { type: 'create', target: rec.name });
});

export const PUT = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const url = new URL(request.url);
  const body = await readJson(request);
  const state = await loadDashboards(cfg);
  if (state.mode === 'redis' && Number(body.rev) !== state.rev) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }

  if (url.searchParams.get('action') === 'reorder') {
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : null;
    const current = new Set(state.items.map((d) => d.id));
    if (!ids || ids.length !== current.size || new Set(ids).size !== ids.length || !ids.every((id) => current.has(id))) {
      throw new HttpError(400, 'Reorder must list every dashboard exactly once.');
    }
    const pos = new Map(ids.map((id, i) => [id, i]));
    const next = state.items.map((d) => ({ ...d, order: pos.get(d.id) }));
    return commit(cfg, state, next, session, request, { type: 'reorder' });
  }

  const id = url.searchParams.get('id');
  const existing = state.items.find((d) => d.id === id);
  if (!existing) throw new HttpError(404, 'That dashboard no longer exists. Reload the page.');

  let rec = normalizeDashboard(body, existing);
  if (state.mode === 'redis') rec = await sealPassword(rec, cfg.vaultKey);
  const next = state.items.map((d) => (d.id === id ? rec : d));
  return commit(cfg, state, next, session, request, { type: 'update', target: rec.name });
});

export const DELETE = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const url = new URL(request.url);
  const state = await loadDashboards(cfg);
  if (state.mode === 'redis' && Number(url.searchParams.get('rev')) !== state.rev) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }
  const id = url.searchParams.get('id');
  const existing = state.items.find((d) => d.id === id);
  if (!existing) throw new HttpError(404, 'That dashboard no longer exists. Reload the page.');
  return commit(cfg, state, state.items.filter((d) => d.id !== id), session, request,
    { type: 'delete', target: existing.name });
});
