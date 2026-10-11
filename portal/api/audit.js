/*
 * GET /api/audit — recent activity (sign-ins, edits, credential reveals).
 * Admins only. Empty when no storage is connected.
 */
import { getConfig } from '../lib/config.js';
import { handle, json, methodNotAllowed, requireAdmin } from '../lib/http.js';
import { recentAudit, storageMode } from '../lib/store.js';

export const GET = handle(async (request) => {
  const cfg = getConfig();
  await requireAdmin(request, cfg);
  const limit = Math.min(200, Math.max(1, parseInt(new URL(request.url).searchParams.get('limit') || '50', 10) || 50));
  return json({ mode: storageMode(cfg), events: await recentAudit(cfg, limit) });
});

export const POST = methodNotAllowed(['GET']);
