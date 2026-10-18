'use client';

import { useSyncExternalStore } from 'react';

/**
 * Short-lived handoff between /forgot-password (issues the token) and
 * /reset-password (redeems it).
 *
 * sessionStorage rather than a cookie: the token is single-purpose and must
 * never be attached to ordinary API requests by the axios interceptor.
 */
export const RESET_TOKEN_KEY = 'adminResetToken';
export const RESET_EMAIL_KEY = 'adminResetEmail';

export function storeResetSession(token: string, email: string): void {
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
  sessionStorage.setItem(RESET_EMAIL_KEY, email);
}

export function clearResetSession(): void {
  sessionStorage.removeItem(RESET_TOKEN_KEY);
  sessionStorage.removeItem(RESET_EMAIL_KEY);
}

/** The token is written before navigation and never changes while mounted. */
const subscribe = () => () => {};

/**
 * Reads the reset token without an effect, so there is no cascading render and
 * no hydration mismatch.
 *
 * Returns `undefined` on the server and until hydration completes, then
 * `string | null`. Callers must treat `undefined` as "not known yet" — showing
 * the "session expired" state on it would flash on every load.
 */
export function useResetToken(): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(RESET_TOKEN_KEY),
    () => undefined
  );
}
