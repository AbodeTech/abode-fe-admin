'use client';

import { useMutation } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import {
  ForgotPasswordResultSchema,
  MessageResponseSchema,
  VerifyOtpResultSchema,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from '../schemas/auth.schema';

/* ============================================================
 * Admin password recovery — PROVISIONAL.
 *
 * abode-be-v2 has NO admin recovery endpoints. `forgotPassword` looks up
 * `findUserByEmail` and `resetPassword` verifies a 'user'-audience token, so
 * neither works for an admin: admins live in a separate collection and carry
 * an 'admin'-audience token.
 *
 * The paths below mirror the BE's existing user flow one-for-one, so the
 * server-side work is mostly swapping the repository lookup. Until they ship,
 * these resolve in mock mode only and 404 against a real backend.
 *
 * Contract and rationale: docs/BACKEND-REQUESTS.md
 * ============================================================ */

/**
 * Step 1 — POST /auth/admin/forgot-password.
 *
 * Emails a 6-digit code and returns the token that authorizes redeeming it.
 * Mirrors the user endpoint's enumeration-safe behaviour: an unregistered
 * address still returns 200 with a token, so the caller must not treat a
 * success as proof the account exists.
 */
export const useForgotPassword = () =>
  useMutation({
    mutationFn: (values: ForgotPasswordValues) =>
      apiPost('/auth/admin/forgot-password', { email: values.email }, ForgotPasswordResultSchema),
  });

/**
 * Steps 2 and 3 — redeem the code, then write the new password.
 *
 * Kept as one mutation because they are one user action. Each call carries its
 * own scoped bearer token via `config.token`: the admin is signed out here, so
 * there is no session cookie for the interceptor to attach.
 *
 * `confirmPassword` stays out of both bodies (forbidNonWhitelisted → 400).
 */
export const useResetPassword = () =>
  useMutation({
    mutationFn: async (args: { resetToken: string; values: ResetPasswordValues }) => {
      const { resetGrantToken } = await apiPost(
        '/auth/admin/verify-otp',
        { otp: args.values.otp },
        VerifyOtpResultSchema,
        { token: args.resetToken }
      );

      return apiPost(
        '/auth/admin/reset-password',
        { newPassword: args.values.newPassword },
        MessageResponseSchema,
        { token: resetGrantToken }
      );
    },
  });
