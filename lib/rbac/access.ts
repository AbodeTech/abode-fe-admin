import type { AdminPermission } from './permissions';

/* ============================================================
 * Access rules — the one vocabulary for "may this person see this".
 *
 * A rule is DATA, never a role name. Nothing here (or anywhere that reads a
 * rule) may branch on `role.name === 'sales_team_lead'`: a role is a database
 * row of permission keys, so a new role needs no code as long as the keys it
 * holds already exist. New feature = one new key and one registry entry.
 *
 * Pure functions, no React: the sidebar, the route guard, the landing lookup
 * and the verification script all evaluate the same rule the same way.
 * ============================================================ */

/**
 * A record that grants a page without a permission: being the Associate
 * Manager, CS Manager or Financial Officer on file. The backend scopes those
 * pages to the manager's own team whatever role they hold (BE `ca633ff`), so a
 * Member sees their own team with no key at all.
 */
export type AccessRecord = 'associate_manager' | 'cs_manager' | 'financial_officer';

export type AccessRule =
  /** No server permission: the backend deliberately admits every signed-in admin. */
  | { open: true }
  /** Super admins only (a page that checks `is_super_admin`, not a key). */
  | { superAdminOnly: true }
  /** Held if the person has ANY of these keys, or the record. */
  | { any: readonly AdminPermission[]; record?: AccessRecord }
  /** Held only if the person has ALL of these keys, or the record. */
  | { all: readonly AdminPermission[]; record?: AccessRecord };

/** Everything a rule is evaluated against. Built from the session by `subjectFromAdmin`. */
export interface AccessSubject {
  isSuperAdmin: boolean;
  /** The union the server resolved: roles plus the person's extras. */
  permissions: ReadonlySet<string>;
  /** Which records the person holds. A record not yet known is `undefined`. */
  records: Partial<Record<AccessRecord, boolean>>;
}

export const NO_ACCESS_SUBJECT: AccessSubject = {
  isSuperAdmin: false,
  permissions: new Set(),
  records: {},
};

/** Does the subject hold this one key? Super admins hold every key. */
export function hasPermission(subject: AccessSubject, permission: AdminPermission): boolean {
  return subject.isSuperAdmin || subject.permissions.has(permission);
}

export function hasAnyPermission(
  subject: AccessSubject,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.some((permission) => hasPermission(subject, permission));
}

export function hasAllPermissions(
  subject: AccessSubject,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.every((permission) => hasPermission(subject, permission));
}

/** Evaluate a rule. A super admin passes every rule, including `superAdminOnly`. */
export function canAccess(subject: AccessSubject, rule: AccessRule): boolean {
  if ('open' in rule) return true;
  if (subject.isSuperAdmin) return true;
  if ('superAdminOnly' in rule) return false;

  const byKey =
    'any' in rule
      ? hasAnyPermission(subject, rule.any)
      : hasAllPermissions(subject, rule.all);
  if (byKey) return true;

  return rule.record ? subject.records[rule.record] === true : false;
}

/**
 * True while the answer could still flip to "yes": the person lacks the keys
 * but holds a record the app has not finished looking up. A guard shows a
 * loader for this instead of flashing "no access" at a manager whose
 * `GET …/me` is still in flight.
 */
export function isAccessPending(subject: AccessSubject, rule: AccessRule): boolean {
  if ('open' in rule || 'superAdminOnly' in rule) return false;
  if (subject.isSuperAdmin || !rule.record) return false;
  if (canAccess(subject, rule)) return false;
  return subject.records[rule.record] === undefined;
}
