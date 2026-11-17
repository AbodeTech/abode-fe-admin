import type { MockRoutes } from '../router';
import { ADMINS } from './cs-managers';
import { paged } from './util';

/**
 * GET /admin/audit-logs — shaped like abode-be-v2's raw stored documents
 * (camelCase adminId/adminEmail/oldState next to snake_case actor_type/
 * new_state), not its unused AdminLogResponseDto. Newest first; filters are
 * the real ones: `adminId` (exact id) and `action` (exact value).
 */
type MockAdminLog = {
  _id: string;
  adminId: string | null;
  adminEmail: string | null;
  actor_type?: 'admin' | 'system';
  action: string;
  description: string;
  reason?: string;
  entity?: string;
  entity_id?: string;
  target_user_id?: string;
  metadata?: Record<string, unknown>;
  oldState?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
  timestamp: string;
  __v: number;
};

const ACTIONS: Array<Pick<MockAdminLog, 'action' | 'description' | 'entity'> & { reason?: string }> = [
  { action: 'log-in', description: 'Admin logged in' },
  { action: 'update-payment-plan', description: 'Updated a payment plan', entity: 'PaymentPlan', reason: 'Customer asked to move the due date' },
  { action: 'suspend-user', description: 'Suspended a user', entity: 'User', reason: 'Chargeback under review' },
  { action: 'approve-asset-transaction', description: 'Approved an asset transaction', entity: 'Transaction' },
  { action: 'manual-wallet-credit', description: 'Credited a wallet manually', entity: 'Wallet', reason: 'Refund for a failed transfer' },
  { action: 'allocate-land', description: 'Allocated a plot', entity: 'PaymentPlan' },
  { action: 'create-coupon', description: 'Created an upgrade coupon', entity: 'Coupon' },
];

const hex = (n: number, width = 24) => n.toString(16).padStart(width, '0');

const LOGS: MockAdminLog[] = Array.from({ length: 64 }, (_, i) => {
  const template = ACTIONS[i % ACTIONS.length];
  const admin = ADMINS[i % ADMINS.length];
  // Every ninth row is a scheduled job, which the backend writes with no admin.
  const isSystem = i % 9 === 8;
  const timestamp = new Date(Date.UTC(2026, 10, 9, 12, 0) - i * 47 * 60 * 1000).toISOString();
  return {
    _id: `6720a10c${hex(i, 16)}`,
    adminId: isSystem ? null : admin._id,
    adminEmail: isSystem ? null : admin.email,
    // Pre-v2 rows were written before actor_type existed.
    ...(i % 11 === 10 ? {} : { actor_type: isSystem ? ('system' as const) : ('admin' as const) }),
    action: isSystem ? 'inactivity-reminder-sent' : template.action,
    description: isSystem ? 'Sent inactivity reminders' : template.description,
    ...(template.reason && !isSystem ? { reason: template.reason } : {}),
    ...(template.entity && !isSystem ? { entity: template.entity, entity_id: `6720e00c${hex(i, 16)}` } : {}),
    metadata: { source: 'admin-dashboard', index: i },
    oldState: template.action === 'update-payment-plan' ? { next_date_of_payment: '2026-11-01' } : null,
    new_state: template.action === 'update-payment-plan' ? { next_date_of_payment: '2026-11-15' } : null,
    timestamp,
    __v: 0,
  };
});

export const adminLogRoutes: MockRoutes = {
  'GET /admin/audit-logs': ({ query }) => {
    const adminId = typeof query.adminId === 'string' ? query.adminId : undefined;
    const action = typeof query.action === 'string' ? query.action : undefined;
    const rows = LOGS.filter(
      (log) => (!adminId || log.adminId === adminId) && (!action || log.action === action)
    );
    return { ...paged(rows, query, 20), message: 'Audit logs retrieved successfully' };
  },
};
