'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';
import { setMustChangePasswordHint, setSessionCookies } from '@/lib/utils/cookies';
import { useAuthStore } from '@/store/auth-store';

import { AdminAuthResultSchema, type ChangePasswordValues } from '../schemas/auth.schema';
import { authKeys } from './query-keys';

/**
 * POST /auth/admin/change-password.
 *
 * The one admin route exempt from the temp-password lock, so it works while
 * every other endpoint is 403ing.
 *
 * Two things make this different from an ordinary mutation:
 *  - The BE revokes **every** session on success and returns a fresh token
 *    pair. Not storing it logs the admin out the instant they succeed.
 *  - `confirmPassword` is UI-only and must never reach the body —
 *    forbidNonWhitelisted turns an unknown field into a hard 400.
 */
export const useChangePassword = () => {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      apiPost(
        '/auth/admin/change-password',
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        AdminAuthResultSchema
      ),
    onSuccess: (result) => {
      setSessionCookies(result);
      // Clears the lock, which is what lets middleware admit the dashboard.
      setMustChangePasswordHint(result.admin.must_change_password);
      login(result.admin);
      queryClient.setQueryData(authKeys.me(), result.admin);
    },
  });
};
