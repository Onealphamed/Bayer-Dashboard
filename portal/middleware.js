/*
 * Vercel Routing Middleware — the login gate.
 *
 * Runs before every request. Signed-out visitors are sent to /login; signed-out
 * API calls get 401. This is a convenience layer: the HTML and JS it guards
 * contain no secrets, and every API function verifies the session itself.
 *
 * Returning nothing lets the request continue to the static file or function.
 */
import { getSession } from './lib/session.js';

/* Files the login page needs before anyone is signed in. Nothing else is public. */
const PUBLIC_PATHS = new Set([
  '/login',
  '/login.html',
  '/api/login',
  '/assets/portal.css',
  '/assets/login.js',
  '/favicon.svg',
  '/robots.txt',
]);

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (PUBLIC_PATHS.has(path)) {
    // Already signed in? Skip the login screen.
    if ((path === '/login' || path === '/login.html') && request.method === 'GET'
      && (await getSession(request))) {
      return Response.redirect(new URL('/', url), 302);
    }
    return undefined;
  }

  if (await getSession(request)) return undefined;

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const login = new URL('/login', url);
  const next = path + url.search;
  if (next !== '/' && next !== '/index.html') login.searchParams.set('next', next);
  return Response.redirect(login, 302);
}
