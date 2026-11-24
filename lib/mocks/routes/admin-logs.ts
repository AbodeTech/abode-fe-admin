import type { MockRoutes } from '../router';
import { paged } from './util';

/* ============================================================
 * Admin audit log mocks — GET /admin/audit-logs (page, limit, admin_id, action).
 *
 * Rows use the documented snake_case shape (`id`, `admin_id`, `admin_email`,
 * `old_state`, `new_state`, `actor_type`), which is what the endpoint returns
 * since the backend's B3 fix. Covers the entries the Roles and
 * Permissions work writes (a denied attempt, a role change, extra permissions, a
 * start page), a purchase approval, a login, and a system-actor row with no admin.
 * ============================================================ */

const ADA = { id: '665f1c0a9b2e4d0012a3b456', email: 'ada@abode.ng' };
const TUNDE = { id: '665faaaa000000000000ad02', email: 'tunde@abode.ng' };
const EMEKA = { id: '665faaaa000000000000ad05', email: 'emeka@abode.ng' };

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

type Row = {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  actor_type: 'admin' | 'system';
  action: string;
  description: string;
  reason?: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  old_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
};

const row = (n: number, minutes: number, who: { id: string; email: string } | null, r: Partial<Row> & Pick<Row, 'action' | 'description'>): Row => ({
  id: `665flogs0000000000000${String(n).padStart(3, '0')}`,
  admin_id: who?.id ?? null,
  admin_email: who?.email ?? null,
  actor_type: who ? 'admin' : 'system',
  ip_address: who ? '102.89.34.12' : undefined,
  user_agent: who ? 'Mozilla/5.0' : undefined,
  timestamp: minutesAgo(minutes),
  ...r,
});

const ROWS: Row[] = [
  row(1, 3, TUNDE, {
    action: 'permission-denied',
    description: 'Denied GET /api/v1/admin/users: missing view_users',
    metadata: { roles: ['sales_member'], required: ['view_users'], missing: ['view_users'], method: 'GET', path: '/api/v1/admin/users' },
  }),
  row(2, 12, ADA, {
    action: 'assign-admin-role',
    description: 'Roles changed for ife@abode.ng: sales_team_lead → sales_team_lead, recruitment_member',
    metadata: { targetAdminId: '665faaaa000000000000ad04', from_role_names: ['sales_team_lead'], to_role_names: ['sales_team_lead', 'recruitment_member'] },
  }),
  row(3, 14, ADA, {
    action: 'update-admin-extra-permissions',
    description: 'Extra permissions changed for ife@abode.ng (+approve_purchase_confirmation, +view_assets)',
    entity: 'Admin',
    metadata: { targetAdminId: '665faaaa000000000000ad04', before: [], after: ['approve_purchase_confirmation', 'view_assets'], added: ['approve_purchase_confirmation', 'view_assets'], removed: [] },
  }),
  row(4, 15, ADA, {
    action: 'update-admin-start-page',
    description: 'Start page changed for ife@abode.ng: (role default) → recruitment',
    entity: 'Admin',
    metadata: { targetAdminId: '665faaaa000000000000ad04', before: null, after: 'recruitment', self: false },
  }),
  row(5, 31, EMEKA, {
    action: 'approve-purchase-confirmation',
    description: 'Approved purchase confirmation for plan 665fplan0000000000000011',
    entity: 'PurchaseConfirmation',
    metadata: { plan_id: '665fplan0000000000000011', status_before: 'waiting', note: 'Buyer confirmed by phone', buyer_emailed: true },
  }),
  row(6, 44, TUNDE, {
    action: 'permission-denied',
    description: 'Denied PATCH /api/v1/admin/admins/665faaaa000000000000ad03/role: missing manage_roles',
    metadata: { roles: ['sales_member'], required: ['manage_roles'], missing: ['manage_roles'], method: 'PATCH', path: '/api/v1/admin/admins/665faaaa000000000000ad03/role' },
  }),
  row(7, 60, ADA, { action: 'log-in', description: 'Admin logged in' }),
  row(8, 95, null, {
    action: 'update-payment-plan',
    description: 'Nightly job marked 3 plans overdue',
    metadata: { job: 'overdue-sweep', plans: 3 },
  }),
  row(9, 180, ADA, {
    action: 'reassign-associate-pro',
    description: 'Reassigned associate pro 665fpro00000000000000a1 to manager 665faaaa000000000000ad05',
    metadata: { pro_id: '665fpro00000000000000a1', to_manager: '665faaaa000000000000ad05' },
    old_state: { from_manager: '665faaaa000000000000ad02' },
  }),
];

export const adminLogRoutes: MockRoutes = {
  'GET /admin/audit-logs': ({ query }) => {
    const adminId = typeof query.admin_id === 'string' ? query.admin_id : '';
    const action = typeof query.action === 'string' ? query.action : '';
    const rows = ROWS.filter((r) => (!adminId || r.admin_id === adminId) && (!action || r.action === action)).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    return paged(rows, query, 20);
  },
};
