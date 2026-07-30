'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';
import { clearAuthCookies, getRefreshToken } from '@/lib/utils/cookies';
import { useAuthStore } from '@/store/auth-store';

import { MessageResponseSchema } from '../schemas/auth.schema';

/**
 * POST /auth/logout — revokes the session behind the refresh token.
 *
 * The endpoint is shared with users and is `@Public()`; it identifies the
 * session from the refresh token in the body, not from the access token.
 *
 * Server-side revocation is best-effort. If it fails (offline, token already
 * expired) the local session is still torn down — refusing to sign someone out
 * because the network is down would be worse than a lingering server session,
 * which expires on its own anyway.
 *
 * Note: this does not invalidate the current access token. The BE checks the
 * session record on refresh but not on ordinary requests, so an already-issued
 * access token stays valid until it expires. That is what the short (15m) TTL
 * is for.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;

      await apiPost('/auth/logout', { refreshToken }, MessageResponseSchema).catch(
        () => undefined
      );
    },
    onSettled: () => {
      clearAuthCookies();
      logout();
      queryClient.clear();
    },
  });
};
