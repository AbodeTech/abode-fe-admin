'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';
import { setMustChangePasswordHint, setSessionCookies } from '@/lib/utils/cookies';
import { useAuthStore } from '@/store/auth-store';

import { AdminAuthResultSchema, type SignInValues } from '../schemas/auth.schema';
import { authKeys } from './query-keys';

/**
 * POST /auth/admin/login.
 *
 * Returns `{ accessToken, refreshToken, admin }`. Note the field name: the
 * GraphQL API called this `authToken`, the REST API calls it `accessToken`.
 *
 * The caller must branch on `admin.must_change_password` — while it is true
 * the BE's PasswordChangeGuard 403s every other admin route, so sending the
 * admin to the dashboard would show a wall of failed requests.
 */
export const useAdminLogin = () => {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: (values: SignInValues) =>
      // Exactly the DTO's fields — the BE sets forbidNonWhitelisted.
      apiPost(
        '/auth/admin/login',
        { email: values.email, password: values.password },
        AdminAuthResultSchema
      ),
    onSuccess: (result) => {
      setSessionCookies(result);
      // Written before navigating, so middleware can redirect a locked account
      // at the edge instead of letting the dashboard mount and bounce.
      setMustChangePasswordHint(result.admin.must_change_password);
      login(result.admin);
      queryClient.setQueryData(authKeys.me(), result.admin);
    },
  });
};
