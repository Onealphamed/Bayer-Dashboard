/*
 * GET /api/me — who is signed in, what they may do, and (for admins) any
 * configuration problems worth surfacing in the UI.
 */
import { configWarnings, getConfig } from '../lib/config.js';
import { handle, json, methodNotAllowed, requireSession } from '../lib/http.js';
import { storageMode } from '../lib/store.js';

export const GET = handle(async (request) => {
  const cfg = getConfig();
  const session = await requireSession(request, cfg);
  const isAdmin = session.role === 'admin';
  const mode = storageMode(cfg);
  return json({
    user: { username: session.username, role: session.role },
    sessionExpiresAt: new Date(session.exp * 1000).toISOString(),
    portal: { title: cfg.title },
    storage: { mode, writable: mode === 'redis' },
    canEdit: isAdmin,
    warnings: isAdmin ? configWarnings(cfg) : [],
  });
});

export const POST = methodNotAllowed(['GET']);
