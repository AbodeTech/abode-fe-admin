import { z } from 'zod';

import { LANDING_PAGES } from '@/lib/rbac/landing';

/* ============================================================
 * Roles, permissions and admin accounts.
 *
 *   GET    /admin/roles            list with permissions + admin counts
 *   GET    /admin/roles/:id        one role
 *   GET    /admin/roles/:id/admins the role plus who holds it
 *   POST   /admin/roles            create a custom role
 *   PATCH  /admin/roles/:id        edit description / permissions
 *   DELETE /admin/roles/:id        custom roles only, and only when unassigned
 *   GET    /admin/permissions      the code-defined permission pool
 *   GET    /admin/admins           every admin account
 *   GET    /admin/admins/:id       one account
 *   PATCH  /admin/admins/:id/role  reassign an admin's role
 *
 * Reads take `view_admin`, role writes take `manage_roles`.
 * ============================================================ */

/**
 * A role.
 *
 * `permissions` on super_admin reports the LIVE pool rather than whatever the
 * row stores, so it always matches what the role actually grants. `is_system`
 * roles are editable (except super_admin) but can never be deleted or renamed.
 */
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.string()),
  /**
   * Where this role starts after sign-in. An open string (the BE validates it
   * against its own list): a value this app has not heard of yet must degrade
   * to the dashboard, not fail the whole roles list.
   */
  default_landing_page: z.string().default('dashboard'),
  is_system: z.boolean(),
  is_super_admin: z.boolean(),
  admin_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Role = z.infer<typeof RoleSchema>;

/** One entry of the permission pool, with tooltip copy. */
export const PermissionOptionSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type PermissionOption = z.infer<typeof PermissionOptionSchema>;

/** An admin holding a role, as returned by `GET /admin/roles/:id/admins`. */
export const AdminOnRoleSchema = z.object({
  id: z.string(),
  email: z.string(),
  userName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export type AdminOnRole = z.infer<typeof AdminOnRoleSchema>;

/** What to call an admin in a list: their name, else their user name, else their email. */
export const adminOnRoleName = (admin: AdminOnRole): string =>
  `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || admin.userName || admin.email;

export const RoleWithAdminsSchema = RoleSchema.extend({
  admins: z.array(AdminOnRoleSchema),
});

export type RoleWithAdmins = z.infer<typeof RoleWithAdminsSchema>;

/**
 * A role as it appears on an admin account: a bare ObjectId string, or — since
 * the BE started populating roles (abode-be-v2 `3a65785`, 18 Nov 2026) — the
 * role document itself. Both are accepted so the schema survives either, and
 * the mock (which still sends ids) keeps working.
 */
export const AdminRoleRefSchema = z.union([
  z.string(),
  z.looseObject({
    _id: z.string(),
    name: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    is_super_admin: z.boolean().optional(),
    default_landing_page: z.string().optional(),
  }),
]);

export type AdminRoleRef = z.infer<typeof AdminRoleRefSchema>;

/**
 * A raw admin account.
 *
 * `GET /admin/admins` has no response DTO — it returns bare Mongoose documents,
 * so this is loose and keeps `_id`. Two consequences worth knowing:
 *  - `role` and `additional_roles` are POPULATED role documents on the current
 *    BE and bare ids on older ones (see `AdminRoleRefSchema`); `joinAdminRole`
 *    normalises both, joining against `GET /admin/roles` where it must.
 *  - `password`, `salt` and `__v` are stripped by the schema's toJSON, so they
 *    never arrive despite the document being otherwise raw.
 *
 * `extra_permissions` and `start_page` are the per-person additions to roles.
 */
export const AdminAccountSchema = z.looseObject({
  _id: z.string(),
  userName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  role: AdminRoleRefSchema,
  additional_roles: z.array(AdminRoleRefSchema).default([]),
  extra_permissions: z.array(z.string()).default([]),
  start_page: z.string().nullable().default(null),
  /** The Associate Pro user this account is linked to (an id), or null. Some responses populate it. */
  associate_pro_user: z.union([z.string(), z.looseObject({ _id: z.string() })]).nullable().default(null),
  must_change_password: z.boolean().optional(),
  last_login: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AdminAccount = z.infer<typeof AdminAccountSchema>;

/* -------------------- derived view -------------------- */

/**
 * An admin with their role resolved — what every screen here actually renders.
 *
 * NOT a BE shape: `GET /admin/admins` returns the role as a bare id and carries
 * no permissions at all, so this is joined client-side against the roles list.
 * It replaces v1's flattened `AdminRoles` GraphQL type, which the BE computed.
 */
export interface AdminWithRole {
  id: string;
  name: string;
  email: string;
  role_id: string;
  /** Falls back to the raw id if the role list hasn't loaded or lacks the row. */
  role_name: string;
  /** Roles beyond the primary one, in the order they were given. */
  additional_roles: Array<{ id: string; name: string }>;
  /** The primary role's landing page: where the person starts when they have made no choice of their own. */
  primary_landing: string;
  /** Everything the roles grant, plus `extra_permissions`. */
  permissions: string[];
  /** Single keys granted to this person on top of their roles. */
  extra_permissions: string[];
  /** The stored start-page choice, or null when the primary role's applies. */
  start_page_choice: string | null;
  /** The Associate Pro user this account is linked to, for the personal tracker; null when none. */
  associate_pro_user_id: string | null;
}

export function adminAccountName(admin: AdminAccount): string {
  const full = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim();
  return full || admin.userName || admin.email;
}

function roleRefId(ref: AdminRoleRef): string {
  return typeof ref === 'string' ? ref : ref._id;
}

/** Name and keys of one role reference: the populated document, else the roles list, else the id. */
function resolveRoleRef(
  ref: AdminRoleRef,
  roles: Role[] | undefined,
): { id: string; name: string; permissions: string[]; landing: string } {
  const id = roleRefId(ref);
  const listed = roles?.find((candidate) => candidate.id === id);
  const populated = typeof ref === 'string' ? null : ref;

  return {
    id,
    name: populated?.name ?? listed?.name ?? id,
    // The list's keys win: for a super-admin role it reports the live pool,
    // which a stored row may not.
    permissions: listed?.permissions ?? populated?.permissions ?? [],
    landing: populated?.default_landing_page ?? listed?.default_landing_page ?? 'dashboard',
  };
}

/**
 * Joins accounts to roles. Handles a role sent as an id or as a populated
 * document, and a role the list doesn't contain degrades to its id.
 */
export function joinAdminRole(admin: AdminAccount, roles: Role[] | undefined): AdminWithRole {
  const primary = resolveRoleRef(admin.role, roles);
  const additional = (admin.additional_roles ?? []).map((ref) => resolveRoleRef(ref, roles));
  const extras = admin.extra_permissions ?? [];

  return {
    id: admin._id,
    name: adminAccountName(admin),
    email: admin.email,
    role_id: primary.id,
    role_name: primary.name,
    additional_roles: additional.map(({ id, name }) => ({ id, name })),
    primary_landing: primary.landing,
    permissions: [
      ...new Set([...primary.permissions, ...additional.flatMap((role) => role.permissions), ...extras]),
    ],
    extra_permissions: extras,
    start_page_choice: admin.start_page ?? null,
    associate_pro_user_id:
      typeof admin.associate_pro_user === 'string' ? admin.associate_pro_user : admin.associate_pro_user?._id ?? null,
  };
}

/* -------------------- writes -------------------- */

/** Lowercase snake_case, and immutable once created. */
export const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'At least 2 characters')
    .max(60, 'Keep it under 60 characters')
    .regex(ROLE_NAME_PATTERN, 'Lowercase snake_case, starting with a letter'),
  description: z.string().min(1, 'Describe what this role is for').max(500),
  permissions: z.array(z.string()).min(1, 'Pick at least one permission'),
  /** Where the role starts after sign-in. The BE rejects any value outside its list. */
  default_landing_page: z.enum(LANDING_PAGES).optional(),
});

export type CreateRolePayload = z.infer<typeof createRoleSchema>;

/**
 * `PATCH /admin/roles/:id`. There is deliberately no `name` — role names are
 * immutable, and `forbidNonWhitelisted` turns one in the body into a 400.
 */
export type UpdateRolePayload = {
  description?: string;
  permissions?: string[];
  default_landing_page?: (typeof LANDING_PAGES)[number];
};
