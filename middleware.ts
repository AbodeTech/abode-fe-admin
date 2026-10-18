import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ============================================================
 * Route guard.
 *
 * What this is: a UX guard. It stops an unauthenticated visitor from ever
 * painting a page shell they can't use, and redirects a locked account before
 * React mounts.
 *
 * What this is NOT: a security boundary. Middleware sees an opaque cookie
 * string — it cannot verify the JWT signature (that would need the admin
 * secret at the edge) or know whether the session was revoked. Real
 * enforcement is the BE returning 401/403, handled by the interceptor in
 * lib/api-client.ts and by AdminSessionGate.
 *
 * The matcher is INVERTED deliberately. The previous version enumerated
 * ['/', '/admin/:path*', '/signin'] — but `(dashboard)` is a route group, so
 * parentheses never appear in the URL and nothing is served under /admin.
 * That matcher covered exactly one of the app's 47 dashboard routes. Listing
 * routes rots the moment someone adds a page; listing the few public ones does
 * not.
 * ============================================================ */

/** Reachable with no session at all. */
const PUBLIC_ROUTES = ['/signin', '/forgot-password', '/reset-password'];

/**
 * Requires a session but is not part of the dashboard — an admin sent here by
 * the temp-password lock must be able to reach it.
 */
const CHANGE_PASSWORD_ROUTE = '/change-password';

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Maintenance switch — flip to `false` and deploy to reopen the dashboard.
 * While on, every request signs the admin out by clearing the session cookies
 * and redirects to /maintenance. The admin app has no public pages, so sign-in
 * and its side flows (forgot/reset/change password) are closed too. While off,
 * /maintenance redirects home.
 */
const MAINTENANCE_MODE = true;
const MAINTENANCE_PATH = '/maintenance';
/** Same set lib/utils/cookies.ts `clearAuthCookies` removes on sign-out. */
const AUTH_COOKIES = [
  'adminAccessToken',
  'adminRefreshToken',
  'adminMustChangePassword',
  'accessToken',
  'user',
  'adminRole',
];

function maintenanceResponse(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!MAINTENANCE_MODE) {
    if (pathname !== MAINTENANCE_PATH) return null;
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  let response: NextResponse;
  if (pathname !== MAINTENANCE_PATH) {
    const url = request.nextUrl.clone();
    url.pathname = MAINTENANCE_PATH;
    url.search = '';
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  // Sign everyone out, on every request, for as long as maintenance is on.
  for (const name of AUTH_COOKIES) {
    if (request.cookies.has(name)) response.cookies.delete(name);
  }
  return response;
}

export function middleware(request: NextRequest) {
  // Maintenance takes precedence over every rule below.
  const maintenance = maintenanceResponse(request);
  if (maintenance) return maintenance;

  const { pathname } = request.nextUrl;

  const hasSession = !!request.cookies.get('adminAccessToken')?.value;
  // A hint only — AdminSessionGate re-reads the real value from
  // GET /auth/admin/me and corrects this cookie when the server disagrees.
  const mustChangePassword = !!request.cookies.get('adminMustChangePassword')?.value;

  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = '';
    return NextResponse.redirect(url);
  };

  if (isPublic(pathname)) {
    // Already signed in and settled — no reason to be on an auth page.
    if (hasSession && !mustChangePassword) {
      return redirectTo('/');
    }
    // Signed in but still locked: finish the password change first.
    if (hasSession && mustChangePassword) {
      return redirectTo(CHANGE_PASSWORD_ROUTE);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return redirectTo('/signin');
  }

  if (pathname === CHANGE_PASSWORD_ROUTE) {
    // Open to any signed-in admin. Not gated on the lock: the same screen
    // serves a voluntary password change, and blocking it when unlocked would
    // make that impossible to reach.
    return NextResponse.next();
  }

  // Everything else is dashboard. The BE 403s all of it while the lock is set,
  // so send the admin somewhere that actually works.
  if (mustChangePassword) {
    return redirectTo(CHANGE_PASSWORD_ROUTE);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Everything except Next internals, the metadata files, and anything with a
   * file extension (static assets in /public). New routes are guarded by
   * default — the failure mode of the old enumerated matcher.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)',
  ],
};
