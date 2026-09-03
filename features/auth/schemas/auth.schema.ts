import { z } from 'zod';

/* ============================================================
 * Auth schemas — the source of truth for every admin auth shape.
 *
 * Mirrors abode-be-v2:
 *   AuthAdminView          → AdminSchema
 *   AdminAuthResult        → AdminAuthResultSchema (login / change-password / refresh)
 *   AdminLoginDto          → signInSchema
 *   AdminChangePasswordDto → changePasswordSchema
 *
 * Types are derived with z.infer — never hand-write a response interface.
 * ============================================================ */

/**
 * Roles are DB-backed records now, not a fixed enum — ops can create custom
 * ones ("finance_team") through the roles UI without a deploy. A closed
 * `z.enum` would turn every such role into a SCHEMA_MISMATCH at login, so the
 * name is an open string.
 *
 * `is_super_admin` is the governance flag. Do NOT gate on `name === 'admin'`:
 * `admin` is an ordinary, ops-editable role now, and the real escape hatch is
 * `super_admin`. The flag is what the BE's own SuperAdminGuard checks.
 */
export const AdminRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_super_admin: z.boolean().default(false),
});

export type AdminRole = z.infer<typeof AdminRoleSchema>;

/**
 * The admin record the BE returns from every auth endpoint (`AuthAdminView`).
 *
 * `permissions` is resolved server-side from the admin's role document — it is
 * not stored per admin. Kept as `string[]` rather than an enum so a new BE
 * permission does not turn every login into a SCHEMA_MISMATCH.
 */
export const AdminSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  role: AdminRoleSchema.nullable(),
  permissions: z.array(z.string()).default([]),
  /**
   * True while the admin is still on a temporary password. The BE's
   * PasswordChangeGuard 403s **every** admin route until it clears — only
   * POST /auth/admin/change-password is exempt.
   */
  must_change_password: z.boolean(),
});

export type Admin = z.infer<typeof AdminSchema>;

/**
 * Returned by POST /auth/admin/login, POST /auth/admin/change-password and
 * POST /auth/refresh alike.
 *
 * The access token is short-lived (BE default 15m). `refreshToken` is an
 * opaque, single-use, rotating credential — trading it in burns it and issues
 * a replacement.
 */
export const AdminAuthResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  admin: AdminSchema,
});

export type AdminAuthResult = z.infer<typeof AdminAuthResultSchema>;

/** Endpoints that only acknowledge (logout, logout-all). */
export const MessageResponseSchema = z.object({
  message: z.string().nullable().optional(),
});

/* -------------------- password recovery (provisional) --------------------
 * These three shapes mirror the BE's *user* recovery flow exactly. The admin
 * equivalents DO NOT EXIST on abode-be-v2 yet — see
 * docs/BACKEND-REQUESTS.md. Until they ship, these paths only resolve in mock
 * mode; against a real backend they 404.
 * ------------------------------------------------------------------------ */

/** POST /auth/admin/forgot-password → the token that authorizes OTP redemption. */
export const ForgotPasswordResultSchema = z.object({
  resetToken: z.string(),
  message: z.string().nullable().optional(),
});

export type ForgotPasswordResult = z.infer<typeof ForgotPasswordResultSchema>;

/** POST /auth/admin/verify-otp → the grant that authorizes the password write. */
export const VerifyOtpResultSchema = z.object({
  resetGrantToken: z.string(),
  message: z.string().nullable().optional(),
});

export type VerifyOtpResult = z.infer<typeof VerifyOtpResultSchema>;

/* -------------------- form schemas -------------------- */

export const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInValues = z.infer<typeof signInSchema>;

/**
 * Matches AdminChangePasswordDto: `currentPassword` + `newPassword`, min 8.
 * `confirmPassword` is UI-only and must NOT be sent — the BE runs
 * forbidNonWhitelisted, so an extra body field is a hard 400.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

/** The BE's VerifyOtpDto requires exactly 6 digits. */
export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .min(1, 'Verification code is required')
      .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
