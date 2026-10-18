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
 * Admin password recovery.
 *
 * Backed for real since 2026-07-28 (ticket 1 resolved) — the BE shipped
 * `/auth/admin/forgot-password`, `/auth/admin/verify-otp` and
 * `/auth/admin/reset-password`, with admin-audience scoped tokens
 * (`purpose: reset-password` → `purpose: reset-grant`). Response shapes below
 * verified against both the NestJS source and live calls to the deployment.
 *
 * The forgot step is enumeration-safe: an unregistered address still returns
 * 200 with a (useless) resetToken, so success must never be presented as
 * proof the account exists.
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
