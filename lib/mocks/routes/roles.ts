import { LANDING_PAGES } from '@/lib/rbac/landing';
import { MockHttpError, type MockRoutes } from '../router';
import { requireSession } from './auth';
import { ADMINS } from './cs-managers';
import { findPerson } from './people';
import { MOCK_PERMISSION_POOL, MOCK_SEEDED_ROLES } from './rbac-roles.generated';

/* ============================================================
 * Roles, permissions and admin accounts — /admin/roles, /admin/permissions,
 * /admin/admins, and the per-person access endpoints.
 *
 * Mirrors abode-be-v2 closely enough to try the Security screens:
 *  - roles are the backend's SEEDED roles and the whole permission pool, copied
 *    by scripts/rbac-gen-mock-roles.ts (rbac-roles.generated.ts), so they cannot
 *    drift from the real ones;
 *  - an admin account carries a primary `role`, `additional_roles`,
 *    `extra_permissions` and a `start_page` choice, and `GET /admin/admins`
 *    returns the roles POPULATED (full role documents), as the BE does since
 *    3a65785;
 *  - the three write endpoints enforce the BE's own rules (no editing yourself,
 *    only keys you hold, super-admin-only keys, a start page must belong to a held
 *    role), so the dialog's error handling can be exercised.
 *
 * This file owns `GET /admin/admins` (the admin pickers of the manager, CS manager,
 * officer and ticket features read the same list).
 * ============================================================ */

const NOW = '2026-11-23T09:00:00.000Z';

type MockRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  default_landing_page: string;
  is_system: boolean;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
};

const SYSTEM_ROLE_NAMES = new Set(Object.keys(MOCK_SEEDED_ROLES));
const POOL_NAMES = MOCK_PERMISSION_POOL.map((permission) => permission.name);

/** Keys only a super admin may grant or revoke as a per-person extra (BE SUPER_ADMIN_GRANT_ONLY_PERMISSIONS). */
const SUPER_ADMIN_GRANT_ONLY = new Set([
  'view_dashboard',
  'view_asset_analytics',
  'view_finance_runs',
  'manage_roles',
  'manage_admins',
]);

const roles = new Map<string, MockRole>();
for (const [name, seeded] of Object.entries(MOCK_SEEDED_ROLES)) {
  roles.set(`mock-role-${name}`, {
    id: `mock-role-${name}`,
    name,
    description: seeded.description,
    permissions: seeded.permissions,
    default_landing_page: seeded.default_landing_page,
    is_system: true,
    is_super_admin: seeded.is_super_admin,
    created_at: NOW,
    updated_at: NOW,
  });
}

type MockAccount = {
  _id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Role ids, primary first. */
  roleIds: string[];
  extra_permissions: string[];
  start_page: string | null;
  /** The Associate Pro user this admin is linked to, or null. */
  associate_pro_user: string | null;
  must_change_password: boolean;
  last_login: string | null;
  createdAt: string;
  updatedAt: string;
};

const account = (over: Partial<MockAccount> & Pick<MockAccount, '_id' | 'email' | 'roleIds'>): MockAccount => ({
  userName: over.email.split('@')[0],
  firstName: '',
  lastName: '',
  extra_permissions: [],
  start_page: null,
  associate_pro_user: null,
  must_change_password: false,
  last_login: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: NOW,
  ...over,
});

const accounts = new Map<string, MockAccount>();
for (const a of [
  // The default mock login (a super admin), so "you cannot edit yourself" can be tried.
  account({ _id: '665f1c0a9b2e4d0012a3b456', email: 'ada@abode.ng', firstName: 'Ada', lastName: 'Okafor', roleIds: ['mock-role-super_admin'], last_login: NOW }),
  account({ _id: '665faaaa000000000000ad01', email: 'nadia@abode.ng', firstName: 'Nadia', lastName: 'Balogun', roleIds: ['mock-role-founder_super_admin'] }),
  account({ _id: '665faaaa000000000000ad02', email: 'tunde@abode.ng', firstName: 'Tunde', lastName: 'Adeyemi', roleIds: ['mock-role-sales_member'] }),
  account({ _id: '665faaaa000000000000ad03', email: 'chiamaka@abode.ng', firstName: 'Chiamaka', lastName: 'Eze', roleIds: ['mock-role-cs_manager'], must_change_password: true }),
  account({
    _id: '665faaaa000000000000ad04',
    email: 'ife@abode.ng',
    firstName: 'Ife',
    lastName: 'Adeleke',
    roleIds: ['mock-role-sales_team_lead', 'mock-role-recruitment_member'],
    extra_permissions: ['approve_purchase_confirmation', 'view_assets'],
    start_page: 'recruitment',
  }),
  account({ _id: '665faaaa000000000000ad05', email: 'emeka@abode.ng', firstName: 'Emeka', lastName: 'Obi', roleIds: ['mock-role-support_lead'] }),
  account({ _id: '665faaaa000000000000ad06', email: 'amara@abode.ng', firstName: 'Amara', lastName: 'Nwosu', roleIds: ['mock-role-finance_member'] }),
  // The admins the manager / CS manager / officer mocks refer to by id.
  ...ADMINS.map((admin) =>
    account({
      _id: admin._id,
      email: admin.email,
      userName: admin.userName ?? undefined,
      firstName: admin.firstName ?? '',
      lastName: admin.lastName ?? '',
      roleIds: [`mock-role-${admin.role}`],
    }),
  ),
]) {
  accounts.set(a._id, a);
}

const holders = (roleId: string) => [...accounts.values()].filter((a) => a.roleIds.includes(roleId));

const livePermissions = (role: MockRole) => (role.is_super_admin ? POOL_NAMES : role.permissions);

const toRoleDto = (role: MockRole) => ({
  ...role,
  permissions: livePermissions(role),
  admin_count: holders(role.id).length,
});

/** A role as the BE embeds it when it populates an account: the document itself. */
const toRoleDoc = (roleId: string) => {
  const role = roles.get(roleId);
  if (!role) return roleId;
  return {
    _id: role.id,
    name: role.name,
    description: role.description,
    permissions: livePermissions(role),
    default_landing_page: role.default_landing_page,
    is_system: role.is_system,
    is_super_admin: role.is_super_admin,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  };
};

const toAccountDto = (a: MockAccount) => ({
  _id: a._id,
  userName: a.userName,
  firstName: a.firstName,
  lastName: a.lastName,
  email: a.email,
  role: toRoleDoc(a.roleIds[0]),
  additional_roles: a.roleIds.slice(1).map(toRoleDoc),
  extra_permissions: a.extra_permissions,
  start_page: a.start_page,
  associate_pro_user: a.associate_pro_user,
  must_change_password: a.must_change_password,
  last_login: a.last_login,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
});

const requireRole = (id: string) => {
  const role = roles.get(id);
  if (!role) throw new MockHttpError(404, 'Role not found', 'ROLE_NOT_FOUND');
  return role;
};

const requireAccount = (id: string) => {
  const found = accounts.get(id);
  if (!found) throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
  return found;
};

const landingsOf = (a: MockAccount) => [...new Set(a.roleIds.map((id) => requireRole(id).default_landing_page))];

/** Does the signed-in mock admin hold this key? A super admin holds all. */
const actorHolds = (key: string) => {
  const actor = requireSession();
  const superAdmin = [actor.role, ...(actor.additional_roles ?? [])].some((r) => r.is_super_admin);
  return superAdmin || actor.permissions.includes(key);
};
const actorIsSuperAdmin = () => {
  const actor = requireSession();
  return [actor.role, ...(actor.additional_roles ?? [])].some((r) => r.is_super_admin);
};

export const roleRoutes: MockRoutes = {
  'GET /admin/roles': () => [...roles.values()].map(toRoleDto),

  'GET /admin/permissions': ({ query }) =>
    // `?format=names` is the BE's back-compat shape for v1's bare string array.
    query.format === 'names' ? POOL_NAMES : MOCK_PERMISSION_POOL,

  'GET /admin/roles/:id': ({ params }) => toRoleDto(requireRole(params.id)),

  'GET /admin/roles/:id/admins': ({ params }) => {
    const role = requireRole(params.id);
    return {
      ...toRoleDto(role),
      admins: holders(role.id).map((a) => ({
        id: a._id,
        email: a.email,
        userName: a.userName,
        firstName: a.firstName,
        lastName: a.lastName,
      })),
    };
  },

  'POST /admin/roles': ({ body }) => {
    const dto = (body ?? {}) as { name?: string; description?: string; permissions?: string[]; default_landing_page?: string };
    const name = String(dto.name ?? '').trim();

    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new MockHttpError(400, 'name must be lowercase snake_case', 'VALIDATION_ERROR');
    }
    if ([...roles.values()].some((role) => role.name === name)) {
      throw new MockHttpError(409, 'A role with that name already exists', 'ROLE_NAME_TAKEN');
    }

    // Names are validated against the pool, as the BE does — a typo is a 400
    // rather than a role that silently grants nothing.
    const unknown = (dto.permissions ?? []).filter((p) => !POOL_NAMES.includes(p));
    if (unknown.length) {
      throw new MockHttpError(400, `Unknown permissions: ${unknown.join(', ')}`, 'UNKNOWN_PERMISSION');
    }
    if (dto.default_landing_page !== undefined && !(LANDING_PAGES as readonly string[]).includes(dto.default_landing_page)) {
      throw new MockHttpError(400, 'default_landing_page must be one of the allowed values', 'VALIDATION_ERROR');
    }

    const created: MockRole = {
      id: `mock-role-${name}`,
      name,
      description: String(dto.description ?? ''),
      permissions: dto.permissions ?? [],
      default_landing_page: dto.default_landing_page ?? 'dashboard',
      is_system: SYSTEM_ROLE_NAMES.has(name),
      is_super_admin: false,
      created_at: NOW,
      updated_at: NOW,
    };
    roles.set(created.id, created);
    return toRoleDto(created);
  },

  // PATCH /admin/roles/:id — description, permissions, landing. No rename; super_admin is immutable; a
  // permission outside the pool is a 400. Same messages as the BE.
  'PATCH /admin/roles/:id': ({ params, body }) => {
    const role = requireRole(params.id);
    if (role.is_super_admin) throw new MockHttpError(400, 'The super_admin role cannot be edited or deleted', 'SUPER_ADMIN_IMMUTABLE');

    const dto = (body ?? {}) as { name?: string; description?: string; permissions?: string[]; default_landing_page?: string };
    if (dto.name !== undefined) throw new MockHttpError(400, 'property name should not exist', 'VALIDATION_ERROR');
    if (dto.permissions !== undefined) {
      const unknown = dto.permissions.filter((p) => !POOL_NAMES.includes(p));
      if (unknown.length) throw new MockHttpError(400, 'One or more permissions are not defined by the system', 'UNKNOWN_PERMISSION');
    }
    if (dto.default_landing_page !== undefined && !(LANDING_PAGES as readonly string[]).includes(dto.default_landing_page)) {
      throw new MockHttpError(400, 'default_landing_page must be one of the allowed values', 'VALIDATION_ERROR');
    }
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissions !== undefined) role.permissions = dto.permissions;
    if (dto.default_landing_page !== undefined) role.default_landing_page = dto.default_landing_page;
    role.updated_at = new Date().toISOString();
    return toRoleDto(role);
  },

  // DELETE /admin/roles/:id — never super_admin or a system role, and only when nobody holds it.
  'DELETE /admin/roles/:id': ({ params }) => {
    const role = requireRole(params.id);
    if (role.is_super_admin) throw new MockHttpError(400, 'The super_admin role cannot be edited or deleted', 'SUPER_ADMIN_IMMUTABLE');
    if (role.is_system) throw new MockHttpError(400, 'System roles cannot be deleted, and no role can be renamed', 'ROLE_SYSTEM_PROTECTED');
    if (holders(role.id).length > 0) {
      throw new MockHttpError(400, 'Reassign the admins on this role before deleting it', 'ROLE_HAS_ASSIGNED_ADMINS');
    }
    roles.delete(role.id);
    return { message: 'Role deleted' };
  },

  // POST /admin/invite — `role_ids` (first = primary). 409 for a taken email, 403 for a super-admin
  // role from a non-super admin, like the BE.
  'POST /admin/invite': ({ body }) => {
    const dto = (body ?? {}) as { email?: string; role_ids?: string[]; role_id?: string };
    const email = String(dto.email ?? '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new MockHttpError(400, 'email must be an email', 'VALIDATION_ERROR');
    const ids = dto.role_ids ?? (dto.role_id ? [dto.role_id] : []);
    if (ids.length === 0) throw new MockHttpError(400, 'role_ids must contain at least 1 elements', 'VALIDATION_ERROR');
    if (new Set(ids).size !== ids.length) throw new MockHttpError(400, "role_ids's elements must be unique", 'VALIDATION_ERROR');
    if ([...accounts.values()].some((a) => a.email.toLowerCase() === email)) {
      throw new MockHttpError(409, 'Email is already registered', 'CONFLICT');
    }

    const next = ids.map(requireRole);
    if (next.some((role) => role.is_super_admin) && !actorIsSuperAdmin()) {
      throw new MockHttpError(403, 'Only a super admin can assign a super-admin role', 'PERMISSION_DENIED');
    }

    const created = account({
      _id: `665faaaa${Date.now().toString(16).padStart(16, '0')}`.slice(0, 24),
      email,
      roleIds: next.map((role) => role.id),
      must_change_password: true,
    });
    accounts.set(created._id, created);
    return {
      id: created._id,
      email,
      userName: created.userName,
      role_id: next[0].id,
      role_name: next[0].name,
      role_ids: next.map((role) => role.id),
      role_names: next.map((role) => role.name),
      message: 'Admin invited. Login credentials have been emailed.',
    };
  },

  // The admin list: populated roles, as the BE returns it.
  'GET /admin/admins': () => [...accounts.values()].map(toAccountDto),

  'GET /admin/admins/:id': ({ params }) => toAccountDto(requireAccount(params.id)),

  // PATCH /admin/admins/:id/role — `role_ids` replaces every role (first = primary); `role_id` is the single-role form.
  'PATCH /admin/admins/:id/role': ({ params, body }) => {
    const target = requireAccount(params.id);
    if (target._id === requireSession().id) {
      throw new MockHttpError(400, 'You cannot change your own role', 'BUSINESS_RULE');
    }

    const dto = (body ?? {}) as { role_id?: string; role_ids?: string[] };
    const ids = dto.role_ids ?? (dto.role_id ? [dto.role_id] : []);
    if (ids.length === 0) throw new MockHttpError(400, 'role_ids must contain at least 1 elements', 'VALIDATION_ERROR');
    if (new Set(ids).size !== ids.length) throw new MockHttpError(400, "role_ids's elements must be unique", 'VALIDATION_ERROR');

    const next = ids.map(requireRole);
    if (next.some((role) => role.is_super_admin) && !actorIsSuperAdmin()) {
      throw new MockHttpError(403, 'Only a super admin can assign a super-admin role', 'PERMISSION_DENIED');
    }

    target.roleIds = next.map((role) => role.id);
    target.updatedAt = new Date().toISOString();
    return toAccountDto(target);
  },

  // PATCH /admin/admins/:id/start-page — must be the landing page of a held role; null clears.
  'PATCH /admin/admins/:id/start-page': ({ params, body }) => {
    const target = requireAccount(params.id);
    const { start_page } = (body ?? {}) as { start_page?: string | null };
    if (start_page === undefined) throw new MockHttpError(400, 'start_page must be one of the allowed values', 'VALIDATION_ERROR');

    const available = landingsOf(target);
    if (start_page !== null && !available.includes(start_page)) {
      throw new MockHttpError(
        400,
        "The start page must be the landing page of one of the person's roles",
        'START_PAGE_NOT_AVAILABLE',
        { available },
      );
    }
    target.start_page = start_page;
    return {
      admin_id: target._id,
      start_page_choice: start_page,
      start_page: start_page ?? available[0],
    };
  },

  // PATCH /admin/admins/:id/associate-pro — link to an Associate Pro user. Refused when the user is
  // missing, is not an Associate Pro, or is already linked to another admin (the BE's own messages).
  'PATCH /admin/admins/:id/associate-pro': ({ params, body }) => {
    const target = requireAccount(params.id);
    const { associate_pro_user_id } = (body ?? {}) as { associate_pro_user_id?: string };
    if (!associate_pro_user_id) throw new MockHttpError(400, 'associate_pro_user_id must be a mongodb id', 'VALIDATION_ERROR');

    const person = findPerson(associate_pro_user_id);
    if (!person) throw new MockHttpError(404, 'Associate Pro user not found', 'NOT_FOUND');
    if (person.referral_status !== 'associate-pro') {
      throw new MockHttpError(400, 'The linked user must have Associate Pro status', 'BUSINESS_RULE');
    }
    for (const other of accounts.values()) {
      if (other._id !== target._id && other.associate_pro_user === associate_pro_user_id) {
        throw new MockHttpError(409, 'This Associate Pro user is already linked to another admin', 'CONFLICT');
      }
    }
    target.associate_pro_user = associate_pro_user_id;
    return { admin_id: target._id, associate_pro_user_id };
  },

  'DELETE /admin/admins/:id/associate-pro': ({ params }) => {
    const target = requireAccount(params.id);
    target.associate_pro_user = null;
    return { admin_id: target._id, associate_pro_user_id: null };
  },

  // PUT /admin/admins/:id/extra-permissions — the FULL list; replaces what is stored.
  'PUT /admin/admins/:id/extra-permissions': ({ params, body }) => {
    const target = requireAccount(params.id);
    if (target._id === requireSession().id) {
      throw new MockHttpError(400, 'You cannot change your own permissions', 'BUSINESS_RULE');
    }

    const { permissions } = (body ?? {}) as { permissions?: string[] };
    if (!Array.isArray(permissions)) throw new MockHttpError(400, 'permissions must be an array', 'VALIDATION_ERROR');

    const unknown = permissions.filter((p) => !POOL_NAMES.includes(p));
    if (unknown.length) throw new MockHttpError(400, `Unknown permissions: ${unknown.join(', ')}`, 'UNKNOWN_PERMISSION');

    const before = target.extra_permissions;
    const next = [...new Set(permissions)];
    const added = next.filter((p) => !before.includes(p));
    const removed = before.filter((p) => !next.includes(p));

    const superOnly = [...added, ...removed].filter((p) => SUPER_ADMIN_GRANT_ONLY.has(p));
    if (superOnly.length && !actorIsSuperAdmin()) {
      throw new MockHttpError(403, 'Only a super admin can grant or revoke these permissions', 'PERMISSION_DENIED', { permissions: superOnly });
    }
    const notHeld = added.filter((p) => !actorHolds(p));
    if (notHeld.length) {
      throw new MockHttpError(403, 'You can only grant permissions you hold yourself', 'PERMISSION_DENIED', { permissions: notHeld });
    }

    target.extra_permissions = next;
    const fromRoles = target.roleIds.flatMap((id) => livePermissions(requireRole(id)));
    return { admin_id: target._id, extra_permissions: next, permissions: [...new Set([...fromRoles, ...next])] };
  },
};
