'use client';

import { useAuthStore } from '@/store/auth-store';
import {
  hasPermission,
  subjectFromAdmin,
  type AdminPermission,
} from '@/lib/rbac';

/* ============================================================
 * Does the signed-in admin hold a permission?
 *
 * The vocabulary lives in `lib/rbac/permissions.ts` and is the backend's,
 * verbatim, **underscored**. Typing the argument to that union is the point of
 * this hook: several hand-written checks in this repo pass hyphenated names
 * (`"suspend-user"`, `"modify-referral-status"`) which can never match, so those
 * actions are hidden from every role including a full admin. A typo here is a
 * compile error instead.
 *
 * `permissions` is derived server-side from every role the person holds plus
 * their own extras, so an `admin` already holds every entry. The super-admin
 * short-circuit is a safety net for a login response that arrives without the
 * array — locking a full admin out of an action they own is the worse failure
 * of the two. "Super admin" means ANY held role is one, not only the primary.
 *
 * Pages and buttons that need more than one key, or a record (manager, CS
 * manager, officer), use `useCanAccess` from `hooks/use-access.ts` instead.
 * ============================================================ */

export { ADMIN_PERMISSIONS, type AdminPermission } from '@/lib/rbac';

export function useHasPermission(permission: AdminPermission): boolean {
  const user = useAuthStore((state) => state.user);

  if (!user) return false;
  return hasPermission(subjectFromAdmin(user), permission);
}

/**
 * Is the signed-in admin a super admin on ANY role they hold?
 *
 * Use this ONLY where the backend itself says `superAdmin: true` on the
 * endpoint (promoting or removing CS Managers and Financial Officers, setting
 * their targets, changing an agency's owner, the deed issuer). Everywhere else
 * the backend guards by a permission key, and the frontend must check that key:
 * a role is a row of keys, so "super admin" is not a stand-in for any of them.
 * Reading `user.role.is_super_admin` directly looks at the primary role only.
 */
export function useIsSuperAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return subjectFromAdmin(user).isSuperAdmin;
}

/** MD §4 uses `useAdminPermissions().has('manage_campaigns')`. */
export function useAdminPermissions() {
  const user = useAuthStore((state) => state.user);

  return {
    has: (permission: AdminPermission) => {
      if (!user) return false;
      return hasPermission(subjectFromAdmin(user), permission);
    },
  };
}
