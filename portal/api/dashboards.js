/*
 * /api/dashboards
 *   GET                                 list (passwords redacted)     any signed-in user
 *   POST                                add a dashboard                admin
 *   PUT    ?id=<id>                     edit a dashboard               admin
 *   PUT    ?action=reorder              reorder: { ids: [...], rev }   admin
 *   PUT    ?action=dismiss-notices      hide DASHBOARDS import notices admin
 *   DELETE ?id=<id>&rev=<rev>           remove a dashboard             admin
 *
 * With no storage connected the list is read-only: mutations are validated and
 * answered with the updated DASHBOARDS value for the admin to paste into Vercel.
 * The hub sends that value back as `draft` with its next change, so several
 * changes made before redeploying add up instead of replacing one another.
 */
import { getConfig } from '../lib/config.js';
import { normalizeDashboard, parseSeed, publicView, sortDashboards } from '../lib/dashboards.js';
import {
  HttpError, assertSameOrigin, clientIp, handle, json, readJson, requireAdmin, requireSession,
} from '../lib/http.js';
import { toSeedJson } from '../lib/seedjson.js';
import { audit, dismissSeedNotices, loadDashboards, saveDashboards, seedNotices } from '../lib/store.js';

/* A DASHBOARDS value fits in Vercel's 64 KB environment-variable budget, so a
   change that carries one back as its draft needs more than the default cap. */
const MAX_MUTATION_BYTES = 256 * 1024;
/* Past this size the value risks Vercel's 64 KB limit for all variables combined. */
const ENV_VALUE_WARN_CHARS = 48 * 1024;

async function listResponse(cfg, state, session) {
  const isAdmin = session.role === 'admin';
  let notices = [];
  if (isAdmin) notices = state.mode === 'redis' && !state.uninitialized ? await seedNotices(cfg) : state.seedErrors;
  return {
    items: state.items.map(publicView),
    rev: state.rev,
    mode: state.mode,
    canEdit: isAdmin,
    uninitialized: Boolean(state.uninitialized),
    seedErrors: notices,
  };
}

/**
 * Refuses a change that would silently lose data:
 *  - redis mode before the store is initialised (DASHBOARDS unreadable): saving
 *    would lock in a list without the dashboards DASHBOARDS was meant to import;
 *  - env mode while DASHBOARDS has entries that failed to load: the generated
 *    value would drop them, passwords included.
 */
function assertSafeToChange(state) {
  if (state.mode === 'redis' && state.uninitialized) {
    throw new HttpError(409, 'DASHBOARDS cannot be read, so nothing has been imported yet. Fix or clear '
      + 'DASHBOARDS in Vercel and redeploy before making changes here.', { seedErrors: state.seedErrors });
  }
  if (state.mode === 'env' && state.seedErrors.length) {
    throw new HttpError(409, 'Some DASHBOARDS entries could not be loaded. Fix them in Vercel first; '
      + 'otherwise the updated value would leave them (and their passwords) out.', { seedErrors: state.seedErrors });
  }
}

/**
 * The list a change is built on. In env mode nothing is stored between
 * requests, so a change made before the previous value was pasted into Vercel
 * would start again from the deployed DASHBOARDS and silently drop it. The hub
 * therefore sends back the last value it was given as `draft`, and the change
 * is built on that. It is re-validated exactly like DASHBOARDS itself.
 */
async function baseState(cfg, draft) {
  const state = await loadDashboards(cfg);
  assertSafeToChange(state);
  if (state.mode !== 'env' || draft === undefined || draft === null) return state;
  const parsed = typeof draft === 'string' ? await parseSeed(draft) : { fatal: true };
  if (parsed.fatal || parsed.errors.length) {
    throw new HttpError(400, 'Your unapplied changes could not be read. Reload the page and make them again.');
  }
  return { ...state, items: sortDashboards(parsed.items) };
}

/** Persists in redis mode; in env mode returns the value to paste instead. */
async function commit(cfg, state, nextItems, session, request, event) {
  const ordered = sortDashboards(nextItems);
  if (state.mode !== 'redis') {
    const { json: envJson, unreadable } = await toSeedJson(ordered, cfg.vaultKey);
    if (unreadable.length) {
      throw new HttpError(409, 'Some saved passwords cannot be read, so a complete value cannot be generated.');
    }
    let message = 'No storage is connected, so this change was not saved. Paste the value below into the '
      + 'DASHBOARDS environment variable in Vercel and redeploy, or connect storage to save directly.';
    if (envJson.length > ENV_VALUE_WARN_CHARS) {
      message += ' This value is close to Vercel\u2019s 64 KB limit for environment variables; '
        + 'connect storage before adding many more dashboards.';
    }
    return json({
      readOnly: true,
      mode: 'env',
      envJson,
      // The list as it will look once the value is applied (passwords redacted).
      items: ordered.map(publicView),
      count: ordered.length,
      message,
    });
  }
  const rev = await saveDashboards(cfg, ordered, state.rev);
  await audit(cfg, { ...event, user: session.username, ip: clientIp(request) });
  return json({ ...(await listResponse(cfg, { ...state, items: ordered, rev }, session)), saved: true });
}

function assertRev(state, rev) {
  if (state.mode === 'redis' && Number(rev) !== state.rev) {
    throw new HttpError(409, 'The list changed in another window. Reload and try again.', { conflict: true });
  }
}

export const GET = handle(async (request) => {
  const cfg = getConfig();
  const session = await requireSession(request, cfg);
  return json(await listResponse(cfg, await loadDashboards(cfg), session));
});

export const POST = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const body = await readJson(request, { maxBytes: MAX_MUTATION_BYTES });
  const state = await baseState(cfg, body.draft);
  assertRev(state, body.rev);
  if (state.items.length >= 200) throw new HttpError(400, 'The hub holds at most 200 dashboards.');

  const rec = normalizeDashboard(body);
  rec.order = state.items.reduce((m, d) => Math.max(m, Number(d.order) || 0), -1) + 1;
  return commit(cfg, state, state.items.concat(rec), session, request, { type: 'create', target: rec.name });
});

export const PUT = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const body = await readJson(request, { maxBytes: MAX_MUTATION_BYTES });

  if (action === 'dismiss-notices') {
    await dismissSeedNotices(cfg);
    return json({ ok: true });
  }

  const state = await baseState(cfg, body.draft);
  assertRev(state, body.rev);

  if (action === 'reorder') {
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

  const rec = normalizeDashboard(body, existing);
  const next = state.items.map((d) => (d.id === id ? rec : d));
  return commit(cfg, state, next, session, request, { type: 'update', target: rec.name });
});

export const DELETE = handle(async (request) => {
  assertSameOrigin(request);
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const url = new URL(request.url);
  // The body is optional; the hub sends one only to carry an env-mode draft.
  const body = request.headers.get('content-type') ? await readJson(request, { maxBytes: MAX_MUTATION_BYTES }) : {};
  const state = await baseState(cfg, body.draft);
  assertRev(state, url.searchParams.get('rev'));
  const id = url.searchParams.get('id');
  const existing = state.items.find((d) => d.id === id);
  if (!existing) throw new HttpError(404, 'That dashboard no longer exists. Reload the page.');
  return commit(cfg, state, state.items.filter((d) => d.id !== id), session, request,
    { type: 'delete', target: existing.name });
});
