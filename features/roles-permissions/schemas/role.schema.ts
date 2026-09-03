import { z } from 'zod';

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

export const RoleWithAdminsSchema = RoleSchema.extend({
  admins: z.array(AdminOnRoleSchema),
});

export type RoleWithAdmins = z.infer<typeof RoleWithAdminsSchema>;

/**
 * A raw admin account.
 *
 * `GET /admin/admins` has no response DTO — it returns bare Mongoose documents,
 * so this is loose and keeps `_id`. Two consequences worth knowing:
 *  - `role` is an UNPOPULATED ObjectId string, not a role object. The name and
 *    permissions have to be joined from `GET /admin/roles` (see `joinAdminRole`).
 *  - `password`, `salt` and `__v` are stripped by the schema's toJSON, so they
 *    never arrive despite the document being otherwise raw.
 */
export const AdminAccountSchema = z.looseObject({
  _id: z.string(),
  userName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  role: z.string(),
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
  permissions: string[];
}

export function adminAccountName(admin: AdminAccount): string {
  const full = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim();
  return full || admin.userName || admin.email;
}

/** Joins accounts to roles. A role the list doesn't contain degrades to its id. */
export function joinAdminRole(admin: AdminAccount, roles: Role[] | undefined): AdminWithRole {
  const role = roles?.find((candidate) => candidate.id === admin.role);

  return {
    id: admin._id,
    name: adminAccountName(admin),
    email: admin.email,
    role_id: admin.role,
    role_name: role?.name ?? admin.role,
    permissions: role?.permissions ?? [],
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
});

export type CreateRolePayload = z.infer<typeof createRoleSchema>;

/**
 * `PATCH /admin/roles/:id`. There is deliberately no `name` — role names are
 * immutable, and `forbidNonWhitelisted` turns one in the body into a 400.
 */
export type UpdateRolePayload = {
  description?: string;
  permissions?: string[];
};
