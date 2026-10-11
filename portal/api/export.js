/*
 * GET /api/export            backup of the list without passwords
 * GET /api/export?secrets=1  full DASHBOARDS value including passwords (audited)
 * Admins only. The response is the exact JSON the DASHBOARDS variable accepts.
 */
import { getConfig } from '../lib/config.js';
import { clientIp, handle, json, methodNotAllowed, requireAdmin } from '../lib/http.js';
import { toSeedEntries } from '../lib/seedjson.js';
import { audit, loadDashboards } from '../lib/store.js';

export const GET = handle(async (request) => {
  const cfg = getConfig();
  const session = await requireAdmin(request, cfg);
  const includeSecrets = new URL(request.url).searchParams.get('secrets') === '1';
  const state = await loadDashboards(cfg);
  const entries = await toSeedEntries(state.items, cfg.vaultKey, { includeSecrets });
  await audit(cfg, {
    type: includeSecrets ? 'export_secrets' : 'export', user: session.username, ip: clientIp(request),
  });
  return json({ includesPasswords: includeSecrets, count: entries.length, dashboards: entries });
});

export const POST = methodNotAllowed(['GET']);
