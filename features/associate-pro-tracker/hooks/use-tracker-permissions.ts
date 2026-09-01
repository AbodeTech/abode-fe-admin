'use client';

import { useAuthStore } from '@/store/auth-store';

import { TRACKER_PERMISSIONS } from '../schemas/tracker.schema';

/**
 * What the signed-in admin may do on this page.
 *
 * The design doc called for a shared `useAdminPermissions()` hook — there
 * isn't one in this repo. The established pattern is reading
 * `useAuthStore().user.permissions` at the call site (see the document ledger
 * and the users export modal), so this wraps that for the tracker's three
 * permissions. Promote it to a shared hook once a second feature needs one.
 *
 * FE-side hiding is UX only. The BE re-checks every route, so a missing
 * permission here never grants anything.
 */
export const useTrackerPermissions = () => {
  const { user } = useAuthStore();
  const permissions = user?.permissions ?? [];
  // A super admin is not enumerated permission-by-permission on the FE.
  const isSuperAdmin = user?.role === 'admin';

  const has = (permission: string) => isSuperAdmin || permissions.includes(permission);

  return {
    canView: has(TRACKER_PERMISSIONS.view),
    canManageGoals: has(TRACKER_PERMISSIONS.manageGoals),
    canExport: has(TRACKER_PERMISSIONS.export),
  };
};
