/* ============================================================
 * Admin session cookies.
 *
 * The BE issues a short-lived access token (default 15m) plus an opaque,
 * rotating refresh token (default 30d). Both are stored here; the refresh
 * interceptor in lib/api-client.ts trades the refresh token for a new pair
 * when the access token expires.
 *
 * Cookie lifetime tracks the REFRESH token, not the access token. A cookie
 * that expired with the 15m JWT would leave nothing to refresh *with* — the
 * request would go out unauthenticated instead of 401-ing, and the session
 * would be unrecoverable.
 *
 * These are readable by JavaScript because the app is fully CSR and the
 * client must attach the token itself. That means an XSS can read the refresh
 * token. Moving refresh behind an httpOnly cookie requires a Next.js route
 * handler to proxy POST /auth/refresh — see docs/BACKEND-REQUESTS.md.
 *
 * The pre-migration `accessToken` / `user` / `adminRole` cookies are gone:
 * `user` and `adminRole` were written but never read, and `accessToken` was a
 * duplicate of `adminAccessToken` read only by the legacy server-side GraphQL
 * path (lib/api/server-utils.ts), which is being removed.
 * ============================================================ */

export const COOKIE_KEYS = {
  ADMIN_ACCESS_TOKEN: 'adminAccessToken',
  ADMIN_REFRESH_TOKEN: 'adminRefreshToken',
  /**
   * A **hint** for middleware.ts, never an authority.
   *
   * `must_change_password` decides whether the dashboard is reachable, but it
   * arrives in a response body — middleware only sees cookies. Mirroring it
   * here lets the edge redirect before anything renders, instead of mounting
   * the dashboard and bouncing after React hydrates.
   *
   * It is client-writable, so it can be tampered with. That buys nothing: the
   * BE 403s every admin route regardless, exactly as it does when the access
   * token cookie is forged. AdminSessionGate re-reads the real value from
   * GET /auth/admin/me and rewrites this cookie whenever the server disagrees.
   */
  MUST_CHANGE_PASSWORD: 'adminMustChangePassword',
} as const;

/** Matches the BE's JWT_REFRESH_EXPIRES_DAYS default. */
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): void {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; samesite=lax${secure}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getAccessToken(): string | null {
  return getCookie(COOKIE_KEYS.ADMIN_ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return getCookie(COOKIE_KEYS.ADMIN_REFRESH_TOKEN);
}

/**
 * Persist a freshly issued token pair. Called after login, after a refresh,
 * and after a password change (which revokes every session and issues a new
 * pair — skipping this logs the admin straight back out).
 */
export function setSessionCookies(tokens: { accessToken: string; refreshToken: string }): void {
  setCookie(COOKIE_KEYS.ADMIN_ACCESS_TOKEN, tokens.accessToken);
  setCookie(COOKIE_KEYS.ADMIN_REFRESH_TOKEN, tokens.refreshToken);
}

/**
 * Mirror the temp-password lock for middleware. Cleared rather than written as
 * "false", so a missing cookie and an unlocked account read identically —
 * there is no third state to reason about at the edge.
 */
export function setMustChangePasswordHint(mustChange: boolean): void {
  if (mustChange) setCookie(COOKIE_KEYS.MUST_CHANGE_PASSWORD, '1');
  else deleteCookie(COOKIE_KEYS.MUST_CHANGE_PASSWORD);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function clearAuthCookies(): void {
  deleteCookie(COOKIE_KEYS.ADMIN_ACCESS_TOKEN);
  deleteCookie(COOKIE_KEYS.ADMIN_REFRESH_TOKEN);
  deleteCookie(COOKIE_KEYS.MUST_CHANGE_PASSWORD);
  // Pre-migration cookies — cleared so an in-flight session doesn't keep stale
  // copies around after this deploy.
  deleteCookie('accessToken');
  deleteCookie('user');
  deleteCookie('adminRole');
}
