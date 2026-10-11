/*
 * POST /api/logout                      sign out this browser
 * POST /api/logout  { everywhere: true } sign out every browser for this user
 *
 * The cookie is always cleared. With storage connected the session is also
 * revoked server-side, so a copied cookie stops working too; "everywhere"
 * ends every session issued to this user up to now.
 */
import { getConfig } from '../lib/config.js';
import { assertSameOrigin, clientIp, errorResponse, json, methodNotAllowed } from '../lib/http.js';
import { clearSessionCookie, getSession } from '../lib/session.js';
import { audit, revokeAllSessions, revokeSession } from '../lib/store.js';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const cfg = getConfig();
    let everywhere = false;
    if ((request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      try {
        everywhere = Boolean(JSON.parse((await request.text()) || '{}').everywhere);
      } catch {
        everywhere = false;
      }
    }
    const session = await getSession(request, cfg);
    let revoked = false;
    if (session) {
      try {
        const remaining = session.exp - Math.floor(Date.now() / 1000);
        revoked = await revokeSession(cfg, session.sid, remaining);
        if (everywhere) revoked = (await revokeAllSessions(cfg, session.username, Date.now())) || revoked;
      } catch {
        revoked = false; // storage down: the cookie is still cleared below
      }
      await audit(cfg, { type: everywhere ? 'logout_all' : 'logout', user: session.username, ip: clientIp(request) });
    }
    return json({ ok: true, revoked, everywhere: everywhere && revoked }, 200,
      { 'Set-Cookie': clearSessionCookie(request) });
  } catch (err) {
    return errorResponse(err);
  }
}

export const GET = methodNotAllowed(['POST']);
