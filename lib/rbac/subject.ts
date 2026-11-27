import type { Admin } from '@/features/auth/schemas/auth.schema';

import type { AccessRecord, AccessSubject } from './access';
import { NO_ACCESS_SUBJECT } from './access';

/**
 * Turns the signed-in admin into something a rule can be evaluated against.
 *
 * - `isSuperAdmin` is true if ANY held role is a super-admin role: the server
 *   resolves a super-admin role to the whole pool wherever it sits in the
 *   person's role list, so the frontend must not look only at the primary one.
 * - `permissions` is the server's union (roles plus extras). It is never
 *   rebuilt here: the frontend reads it, it does not compute it.
 * - A session persisted before these fields existed has no `additional_roles`;
 *   every read degrades to the old single-role behaviour instead of throwing.
 */
export function subjectFromAdmin(
  admin: Admin | null | undefined,
  records: Partial<Record<AccessRecord, boolean>> = {},
): AccessSubject {
  if (!admin) return NO_ACCESS_SUBJECT;

  const roles = [admin.role, ...(admin.additional_roles ?? [])];

  return {
    isSuperAdmin: roles.some((role) => role?.is_super_admin === true),
    permissions: new Set(admin.permissions ?? []),
    records,
  };
}
