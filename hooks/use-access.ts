'use client';

import { useMemo } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useIsCurrentUserManager } from '@/features/associate-managers';
import { useIsCurrentCSManager } from '@/features/cs-managers';
import { useIsCurrentFinancialOfficer } from '@/features/financial-officers';
import {
  canAccess,
  findPage,
  isAccessPending,
  landingRoute,
  subjectFromAdmin,
  type AccessRule,
  type AccessSubject,
  type AdminPermission,
  type PageEntry,
} from '@/lib/rbac';

/* ============================================================
 * Access hooks — the React side of `lib/rbac`.
 *
 * One subject (the session plus the three "am I the manager / officer?"
 * records) is built here and every question is answered against it: may I open
 * this page, may I see this button, where do I start. The rules are data in
 * `lib/rbac/registry.ts`; nothing here names a role.
 *
 * The three record lookups are `GET …/me` calls the app already makes for the
 * sidebar (manager, CS manager) and for the Financial Officer page; React Query
 * shares them, so asking from many places costs one request each.
 * ============================================================ */

/**
 * The signed-in admin as a rule can be evaluated against. A record whose lookup
 * is still in flight is `undefined` (not `false`), so a guard can wait instead
 * of flashing "no access" at a manager.
 */
export function useAccessSubject(): AccessSubject {
  const user = useAuthStore((state) => state.user);
  const manager = useIsCurrentUserManager();
  const csManager = useIsCurrentCSManager();
  const officer = useIsCurrentFinancialOfficer();

  const associateManager = manager.isLoading ? undefined : manager.isManager;
  const csManagerRecord = csManager.isLoading ? undefined : csManager.isCSManager;
  const financialOfficer = officer.isLoading ? undefined : officer.isOfficer;

  return useMemo(
    () =>
      subjectFromAdmin(user, {
        associate_manager: associateManager,
        cs_manager: csManagerRecord,
        financial_officer: financialOfficer,
      }),
    [user, associateManager, csManagerRecord, financialOfficer],
  );
}

/** May the signed-in admin pass this rule? */
export function useCanAccess(rule: AccessRule): boolean {
  return canAccess(useAccessSubject(), rule);
}

/**
 * Shorthand for the common button case: does the admin hold ANY of these keys?
 * `useCan('manage_campaigns')` or `useCan(['approve_payments', 'withdrawals'])`.
 */
export function useCan(permission: AdminPermission | readonly AdminPermission[]): boolean {
  const subject = useAccessSubject();
  const any = Array.isArray(permission) ? permission : [permission as AdminPermission];
  return canAccess(subject, { any });
}

export interface PageAccess {
  /** The registry entry governing this path; undefined for a path the registry does not know. */
  entry: PageEntry | undefined;
  /** True for a page the registry does not know: the server still decides. */
  allowed: boolean;
  /** True while a manager/officer record lookup could still turn "no" into "yes". */
  pending: boolean;
}

/** Access to the page at `pathname`, from the registry. */
export function usePageAccess(pathname: string): PageAccess {
  const subject = useAccessSubject();
  const entry = findPage(pathname);

  if (!entry) return { entry, allowed: true, pending: false };

  return {
    entry,
    allowed: canAccess(subject, entry.access),
    pending: isAccessPending(subject, entry.access),
  };
}

/**
 * The route to open after sign-in: the server-resolved `start_page`, mapped to
 * a route by the registry. Anything unknown falls back to the dashboard.
 */
export function useStartRoute(): string {
  const startPage = useAuthStore((state) => state.user?.start_page);
  return landingRoute(startPage);
}
