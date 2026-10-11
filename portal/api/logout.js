/*
 * POST /api/logout — clears the session cookie.
 */
import { getConfig } from '../lib/config.js';
import { assertSameOrigin, clientIp, errorResponse, json, methodNotAllowed } from '../lib/http.js';
import { clearSessionCookie, getSession } from '../lib/session.js';
import { audit } from '../lib/store.js';

export async function POST(request) {
  try {
    assertSameOrigin(request);
    const cfg = getConfig();
    const session = await getSession(request, cfg);
    if (session) await audit(cfg, { type: 'logout', user: session.username, ip: clientIp(request) });
    return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(request) });
  } catch (err) {
    return errorResponse(err);
  }
}

export const GET = methodNotAllowed(['POST']);
