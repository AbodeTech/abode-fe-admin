import { MockHttpError, type MockRoutes } from '../router';

/* ============================================================
 * Roles, permissions and admin accounts — /admin/roles, /admin/permissions,
 * /admin/admins.
 *
 * Roles and admins are held in mutable maps so creating a role and reassigning
 * an admin actually change what the lists return, and `admin_count` moves with
 * them.
 *
 * The permission pool is a REPRESENTATIVE SAMPLE, not the BE's full list — the
 * real one is ~120 entries generated from `common/permissions.ts`. Enough
 * breadth to exercise the role editor's grouping and overflow without pasting
 * a copy that goes stale the moment the BE adds one.
 * ============================================================ */

const PERMISSIONS: { name: string; description: string }[] = [
  { name: 'view_admin', description: 'See admin accounts, roles and permissions.' },
  { name: 'manage_admins', description: 'Create, invite and remove admin accounts.' },
  { name: 'manage_roles', description: 'Create roles and change which role an admin holds.' },
  { name: 'view_audit_logs', description: 'Read the admin audit trail.' },
  { name: 'view_user', description: 'See customer accounts and their activity.' },
  { name: 'edit_user', description: 'Edit customer profiles and account state.' },
  { name: 'approve_payments', description: 'Credit, debit and approve wallet movements.' },
  { name: 'withdrawals', description: 'Review, approve and retry withdrawal requests.' },
  { name: 'asset_transactions', description: 'Approve or decline asset and document purchases.' },
  { name: 'view_sales', description: 'See the sales ledger.' },
  { name: 'export_sales', description: 'Download the sales ledger as CSV.' },
  { name: 'view_manager_tracker', description: 'See associate manager dashboards and rosters.' },
  { name: 'manage_manager_tracker', description: 'Assign managers and set their targets.' },
  { name: 'export_manager_tracker', description: 'Download manager rosters and sales records.' },
  { name: 'view_associate_pro_tracker', description: 'See the Associate Pro yearly tracker.' },
  { name: 'manage_yearly_goals', description: 'Set and revise yearly Associate Pro targets.' },
  { name: 'view_associates_leaderboard', description: 'See the associate leaderboard.' },
  { name: 'export_associates_leaderboard', description: 'Download the associate leaderboard.' },
  { name: 'view_campaigns', description: 'See campaign performance.' },
  { name: 'manage_campaigns', description: 'Create and edit campaigns.' },
];

type MockRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
};

const ALL_PERMISSION_NAMES = PERMISSIONS.map((permission) => permission.name);

const roles = new Map<string, MockRole>();
for (const role of [
  {
    id: '665fbbbb00000000000000r1',
    name: 'super_admin',
    description: 'Full access. Cannot be edited or deleted.',
    // Reports the LIVE pool rather than a stored list, as the BE does.
    permissions: ALL_PERMISSION_NAMES,
    is_system: true,
    is_super_admin: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '665fbbbb00000000000000r2',
    name: 'operations',
    description: 'Runs the day-to-day queues — payments, withdrawals and purchases.',
    permissions: ['view_user', 'approve_payments', 'withdrawals', 'asset_transactions'],
    is_system: true,
    is_super_admin: false,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-04-11T10:30:00.000Z',
  },
  {
    id: '665fbbbb00000000000000r3',
    name: 'finance_team',
    description: 'Reviews payouts and pulls commission exports.',
    permissions: ['view_user', 'view_sales', 'export_sales', 'view_audit_logs'],
    is_system: false,
    is_super_admin: false,
    created_at: '2025-06-02T14:00:00.000Z',
    updated_at: '2025-06-02T14:00:00.000Z',
  },
]) {
  roles.set(role.id, role);
}

type MockAdminAccount = {
  _id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  /** An unpopulated role id, exactly as the BE sends it. */
  role: string;
  must_change_password: boolean;
  last_login: string | null;
  createdAt: string;
  updatedAt: string;
};

const admins = new Map<string, MockAdminAccount>();
for (const admin of [
  {
    _id: '665faaaa000000000000ad01',
    userName: 'nadia',
    firstName: 'Nadia',
    lastName: 'Balogun',
    email: 'nadia@abode.ng',
    role: '665fbbbb00000000000000r1',
    must_change_password: false,
    last_login: '2026-08-30T08:12:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-08-30T08:12:00.000Z',
  },
  {
    _id: '665faaaa000000000000ad02',
    userName: 'tunde',
    firstName: 'Tunde',
    lastName: 'Adeyemi',
    email: 'tunde@abode.ng',
    role: '665fbbbb00000000000000r2',
    must_change_password: false,
    last_login: '2026-08-29T16:40:00.000Z',
    createdAt: '2025-02-14T09:00:00.000Z',
    updatedAt: '2026-08-29T16:40:00.000Z',
  },
  {
    _id: '665faaaa000000000000ad03',
    userName: 'chiamaka',
    firstName: 'Chiamaka',
    lastName: 'Eze',
    email: 'chiamaka@abode.ng',
    role: '665fbbbb00000000000000r3',
    must_change_password: true,
    last_login: null,
    createdAt: '2026-07-21T11:15:00.000Z',
    updatedAt: '2026-07-21T11:15:00.000Z',
  },
]) {
  admins.set(admin._id, admin);
}

const adminCount = (roleId: string) =>
  [...admins.values()].filter((admin) => admin.role === roleId).length;

const toRoleDto = (role: MockRole) => ({
  ...role,
  permissions: role.is_super_admin ? ALL_PERMISSION_NAMES : role.permissions,
  admin_count: adminCount(role.id),
});

const requireRole = (id: string) => {
  const role = roles.get(id);
  if (!role) throw new MockHttpError(404, 'Role not found', 'ROLE_NOT_FOUND');
  return role;
};

export const roleRoutes: MockRoutes = {
  'GET /admin/roles': () => [...roles.values()].map(toRoleDto),

  'GET /admin/permissions': ({ query }) =>
    // `?format=names` is the BE's back-compat shape for v1's bare string array.
    query.format === 'names' ? ALL_PERMISSION_NAMES : PERMISSIONS,

  'GET /admin/roles/:id': ({ params }) => toRoleDto(requireRole(params.id)),

  'GET /admin/roles/:id/admins': ({ params }) => {
    const role = requireRole(params.id);
    return {
      ...toRoleDto(role),
      admins: [...admins.values()]
        .filter((admin) => admin.role === role.id)
        .map((admin) => ({
          id: admin._id,
          email: admin.email,
          userName: admin.userName,
          firstName: admin.firstName,
          lastName: admin.lastName,
        })),
    };
  },

  'POST /admin/roles': ({ body }) => {
    const dto = (body ?? {}) as { name?: string; description?: string; permissions?: string[] };
    const name = String(dto.name ?? '').trim();

    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new MockHttpError(400, 'name must be lowercase snake_case', 'VALIDATION_ERROR');
    }
    if ([...roles.values()].some((role) => role.name === name)) {
      throw new MockHttpError(409, 'A role with that name already exists', 'ROLE_NAME_TAKEN');
    }

    // Names are validated against the pool, as the BE does — a typo is a 400
    // rather than a role that silently grants nothing.
    const unknown = (dto.permissions ?? []).filter((p) => !ALL_PERMISSION_NAMES.includes(p));
    if (unknown.length) {
      throw new MockHttpError(400, `Unknown permissions: ${unknown.join(', ')}`, 'UNKNOWN_PERMISSION');
    }

    const now = new Date().toISOString();
    const created: MockRole = {
      id: `665fbbbb${Date.now().toString(16).padStart(16, '0')}`.slice(0, 24),
      name,
      description: String(dto.description ?? ''),
      permissions: dto.permissions ?? [],
      is_system: false,
      is_super_admin: false,
      created_at: now,
      updated_at: now,
    };
    roles.set(created.id, created);
    return toRoleDto(created);
  },

  'GET /admin/admins': () => [...admins.values()],

  'GET /admin/admins/:id': ({ params }) => {
    const admin = admins.get(params.id);
    if (!admin) throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
    return admin;
  },

  'PATCH /admin/admins/:id/role': ({ params, body }) => {
    const admin = admins.get(params.id);
    if (!admin) throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');

    const roleId = String((body as { role_id?: string })?.role_id ?? '');
    requireRole(roleId);

    admin.role = roleId;
    admin.updatedAt = new Date().toISOString();
    return admin;
  },
};
