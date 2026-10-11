/*
 * Vercel Routing Middleware — the login gate.
 *
 * Runs before every request. Signed-out visitors are sent to /login; signed-out
 * API calls get 401. This is a convenience layer: the HTML and JS it guards
 * contain no secrets, and every API function verifies the session itself.
 *
 * Platform contract (verified against @vercel/node 23 and `vercel build`/`vercel dev`):
 *  - Runtime is pinned to Node.js. New Vercel projects default middleware to
 *    Node.js, and Edge is deprecated; pinning removes the ambiguity and gives
 *    middleware the normal process.env.
 *  - To continue a request, return next(): an empty Response carrying
 *    `x-middleware-next: 1` (identical to next() in @vercel/edge and
 *    @vercel/functions; inlined to stay dependency-free). Returning nothing
 *    yields an empty 200 on the Node.js runtime.
 *  - Redirects use relative Location headers: under the Node.js runtime
 *    request.url is built as http://host, so an absolute redirect built from
 *    it would point users at http:// instead of https://.
 */
import { getSession } from './lib/session.js';

export const config = { runtime: 'nodejs' };

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

function next() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (PUBLIC_PATHS.has(path)) {
    // Already signed in? Skip the login screen.
    if ((path === '/login' || path === '/login.html') && request.method === 'GET'
      && (await getSession(request))) {
      return redirect('/');
    }
    return next();
  }

  if (await getSession(request)) return next();

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const target = path + url.search;
  return redirect(target === '/' || target === '/index.html'
    ? '/login'
    : '/login?next=' + encodeURIComponent(target));
}
