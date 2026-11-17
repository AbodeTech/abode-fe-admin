import { z } from 'zod';

/**
 * GET /admin/audit-logs (abode-be-v2, `view_audit_logs`).
 *
 * The service returns the stored Mongo documents as they are — the backend's
 * `AdminLogResponseDto` (snake_case `admin_id`, `old_state`, …) is declared
 * but never applied. So this schema follows the stored field names, which mix
 * camelCase (`adminId`, `adminEmail`, `oldState`) with snake_case
 * (`actor_type`, `new_state`, `entity_id`). Rows written before v2 can be
 * missing `actor_type`, so it defaults to "admin".
 */
const JsonObject = z.record(z.string(), z.unknown());

export const AdminLogRowSchema = z.looseObject({
  _id: z.string(),
  adminId: z.string().nullable().optional(),
  adminEmail: z.string().nullable().optional(),
  actor_type: z.enum(['admin', 'system']).optional(),
  action: z.string(),
  description: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  entity: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  target_user_id: z.string().nullable().optional(),
  metadata: JsonObject.nullable().optional(),
  oldState: JsonObject.nullable().optional(),
  new_state: JsonObject.nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  timestamp: z.string(),
});

export type AdminLogRow = z.infer<typeof AdminLogRowSchema>;

/** UI shape. Field names the details modal already reads are kept as they were. */
export interface AdminLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  isSystem: boolean;
  adminId: string | null;
  adminEmail: string | null;
  reason: string | null;
  entity: string | null;
  entityId: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown> | null;
  oldState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  ipAddress: string | null;
}

export function normalizeAdminLog(row: AdminLogRow): AdminLog {
  return {
    id: row._id,
    timestamp: row.timestamp,
    action: row.action,
    description: row.description ?? '',
    isSystem: row.actor_type === 'system',
    adminId: row.adminId ?? null,
    adminEmail: row.adminEmail ?? null,
    reason: row.reason ?? null,
    entity: row.entity ?? null,
    entityId: row.entity_id ?? null,
    targetUserId: row.target_user_id ?? null,
    metadata: row.metadata ?? null,
    oldState: row.oldState ?? null,
    newState: row.new_state ?? null,
    ipAddress: row.ip_address ?? null,
  };
}

/** Who did it, as a reader wants to see it. System rows have no admin. */
export function adminLogActor(log: Pick<AdminLog, 'isSystem' | 'adminEmail'>): string {
  if (log.isSystem) return 'System';
  return log.adminEmail || '—';
}

/** "update-payment-plan" → "Update payment plan". */
export function formatAdminLogAction(action: string): string {
  const words = action.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** GET /admin/admins — just what the admin filter needs. */
export const AdminLogAdminSchema = z.looseObject({
  _id: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export type AdminLogAdmin = z.infer<typeof AdminLogAdminSchema>;

/**
 * Every value the backend writes to `action`. Copied from
 * abode-be-v2 `src/modules/admin/schemas/admin-logs.schema.ts`
 * (`ADMIN_LOG_ACTIONS`, 190 entries as of 2026-11-09). The endpoint accepts any
 * string, so a stale list only hides new actions from the picker — it never
 * breaks the request.
 */
export const ADMIN_LOG_ACTIONS = [
  'log-in', 'create-asset', 'update-asset', 'adjust-streak', 'delete-asset', 'buy-asset',
  'decline-transaction', 'sign-up', 'create-role', 'approve-asset-transaction',
  'decline-asset-transaction', 'decline-document-transaction', 'disable-asset', 'decline-bvn',
  'approve-bvn', 'decline-kyc', 'approve-kyc', 'unsuspend-user', 'suspend-user',
  'update-payment-plan', 'remove-asset', 'add-asset', 'add-referral', 'remove-referral',
  'edit-wallet-commission', 'edit-wallet-details', 'edit-user-details', 'modify-referral-status',
  'approve-upgrade', 'decline-upgrade', 'add-financial-officer', 'remove-financial-officer',
  'set-financial-officer-target', 'reassign-recovery-plan', 'export-recovery-plans',
  'approve-withdrawal', 'send-contract', 'update-role', 'update-asset-question',
  'process-commission', 'edit-commission', 'process-receipt', 'send-asset-statements',
  'create-coupon', 'update-coupon', 'update-coupon-status', 'delete-coupon',
  'update-commission-config', 'upsert-asset-commission-override',
  'delete-asset-commission-override', 'assign-associate-manager-target',
  'bulk-assign-associate-pros', 'add-associate-manager', 'remove-associate-manager',
  'reassign-associate-pro', 'manual-wallet-credit', 'manual-wallet-debit',
  'flip-withdrawal-provider', 'update-flex-lead', 'delete-flex-lead', 'export-flex-leads',
  'resolve-purchase-dispute', 'resend-purchase-confirmation', 'export-purchase-confirmations',
  'log-onboarding-attempt', 'export-manager-dashboard-pros', 'export-manager-sales-record',
  'inactivity-reminder-sent', 'add-cs-manager', 'remove-cs-manager',
  'assign-customers-to-cs-manager', 'log-onboarding-call', 'assign-cs-manager-target',
  'export-cs-manager-plans', 'create-campaign', 'update-campaign', 'transition-campaign',
  'invalidate-campaign-reward', 'export-campaign-rewards', 'download-campaign-ticket',
  'export-top-associates', 'create-yearly-goal', 'update-yearly-goal',
  'export-associate-pro-tracker', 'export-associate-roster', 'export-payment-plans',
  'delete-role', 'assign-admin-role', 'create-agency', 'update-agency', 'suspend-agency',
  'reactivate-agency', 'delete-agency', 'change-agency-owner', 'set-user-agency',
  'export-agency-commissions', 'export-asset-subscribers', 'allocate-land', 'deallocate-land',
  'reassign-land', 'send-allocation-email', 'create-block', 'update-block', 'delete-block',
  'create-plot', 'update-plot', 'delete-plot', 'export-allocation-eligible-clients',
  'export-audit-logs', 'unmapped-legacy-action', 'create-course', 'update-course',
  'delete-course', 'publish-course', 'unpublish-course', 'update-academy-settings',
  'revoke-credential', 'reinstate-credential', 'create-estate-update', 'update-estate-update',
  'publish-estate-update', 'archive-estate-update', 'create-ticket', 'update-ticket',
  'link-ticket-user', 'classify-ticket', 'reply-ticket', 'resolve-ticket', 'merge-tickets',
  'add-ticket-collaborator', 'remove-ticket-collaborator', 'add-ticket-participant',
  'remove-ticket-participant', 'add-ticket-note', 'edit-ticket-note', 'delete-ticket-note',
  'export-tickets', 'create-issue', 'update-issue', 'link-ticket-issue', 'unlink-ticket-issue',
  'resolve-issue', 'reopen-issue', 'trigger-ingestion', 'invite-field-staff',
  'resend-field-staff-invite', 'disable-field-staff', 'enable-field-staff', 'assign-field-staff',
  'end-field-staff-assignment', 'create-field-scorecard', 'update-field-scorecard',
  'publish-field-scorecard', 'revise-field-scorecard', 'finalise-field-scorecard',
  'restate-field-scorecard', 'verify-field-submission', 'reject-field-submission',
  'correct-field-submission', 'reverse-field-submission', 'link-field-submission-plots',
  'set-asset-boundary', 'assign-allocation-event-owner', 'create-asset-cost-item',
  'update-asset-cost-item', 'create-asset-cost', 'update-asset-cost', 'add-asset-cost-stage',
  'approve-asset-cost', 'reverse-asset-cost', 'archive-asset-cost', 'set-cost-allocation-rule',
  'accept-asset-cost-claim', 'set-asset-selling-charges', 'marketplace-suspend',
  'marketplace-unsuspend', 'marketplace-approve', 'marketplace-reject', 'create-meeting',
  'update-meeting', 'toggle-meeting-active', 'mark-deed-delivered', 'create-company-event',
  'update-company-event-status', 'allocate-to-company-event', 'deallocate-from-company-event',
  'register-event-attendee', 'set-event-attendee-pickup', 'apply-event-confirmations',
  'split-outright-payment',
] as const;
