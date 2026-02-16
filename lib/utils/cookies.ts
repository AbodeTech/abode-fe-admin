

export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  ADMIN_ACCESS_TOKEN: 'adminAccessToken',
  USER: 'user',
  ADMIN_ROLE: 'adminRole',
} as const;

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export function getAccessToken(): string | null {
  return getCookie(COOKIE_KEYS.ADMIN_ACCESS_TOKEN);
}

export function getUserFromCookie(): { email: string; role: string; permissions: string[] } | null {
  const userCookie = getCookie(COOKIE_KEYS.USER);
  if (!userCookie) return null;

  try {
    return JSON.parse(userCookie);
  } catch {
    return null;
  }
}


export function isAuthenticated(): boolean {
  return !!getAccessToken();
}


export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}


export function clearAuthCookies(): void {
  deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
  deleteCookie(COOKIE_KEYS.ADMIN_ACCESS_TOKEN);
  deleteCookie(COOKIE_KEYS.USER);
  deleteCookie(COOKIE_KEYS.ADMIN_ROLE);
}
