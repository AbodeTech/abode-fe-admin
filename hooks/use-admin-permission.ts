'use client';

import { useAuthStore } from '@/store/auth-store';

/* ============================================================
 * Does the signed-in admin hold a permission?
 *
 * The vocabulary is the backend's, verbatim from `src/common/permissions.ts`,
 * and it is **underscored**. Typing the argument to that union is the point of
 * this hook: several hand-written checks in this repo pass hyphenated names
 * (`"suspend-user"`, `"modify-referral-status"`) which can never match, so those
 * actions are hidden from every role including a full admin. A typo here is a
 * compile error instead.
 *
 * `permissions` is derived server-side from `role`, so an `admin` already holds
 * every entry. The role short-circuit is a safety net for a login response that
 * arrives without the array — locking a full admin out of an action they own is
 * the worse failure of the two.
 * ============================================================ */

export const ADMIN_PERMISSIONS = [
  'view_user',
  'view_users',
  'view_user_analytics',
  'edit_user',
  'edit_user_profile',
  'delete_user',
  'suspend_user',
  'unsuspend_user',
  'force_password_reset',
  'edit_user_tin',
  'adjust_wallet',
  'suspend_wallet',
  'unsuspend_wallet',
  'modify_tier',
  'reassign_referrer',

  'view_admin',
  'manage_admins',
  'manage_roles',

  'view_assets',
  'manage_assets',
  'delete_assets',
  'buy_asset',
  'delete_user_asset',
  'update_asset_question',
  'send_contract',

  'asset_transactions',
  'approve_payments',
  'withdrawals',
  'manage_commission',
  'update_payment_plan',

  'add_referral',
  'remove_referral',
  'modify_referral_status',

  'view_kyc',
  'view_user_bank_details',
  'approve_kyc',

  'view_marketplace',
  'manage_marketplace',

  'view_agency',
  'manage_agency',

  'manage_promotions',

  'view_requests',
  'manage_requests',

  'view_reports',
  'generate_reports',
  'view_audit_logs',

  'view_meetings',
  'manage_meetings',

  'view_campaigns',
  'manage_campaigns',
  'export_campaigns',

  'view_payment_plans',
  'export_payment_plans',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export function useHasPermission(permission: AdminPermission): boolean {
  const user = useAuthStore((state) => state.user);

  if (!user) return false;
  // The super-admin bypass. Was `role === 'admin'`, which no longer means
  // unrestricted: `admin` is an ops-editable role now (RP-7).
  if (user.role?.is_super_admin) return true;

  return (user.permissions ?? []).includes(permission);
}

/** MD §4 uses `useAdminPermissions().has('manage_campaigns')`. */
export function useAdminPermissions() {
  const user = useAuthStore((state) => state.user);

  return {
    has: (permission: AdminPermission) => {
      if (!user) return false;
      if (user.role?.is_super_admin) return true;
      return (user.permissions ?? []).includes(permission);
    },
  };
}
