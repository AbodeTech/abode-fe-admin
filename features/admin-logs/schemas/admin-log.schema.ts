import { z } from 'zod';

/* ============================================================
 * Admin audit log — GET /admin/audit-logs (`view_audit_logs`).
 *
 * One row is the documented `AdminLogResponseDto` (snake_case: `id`, `admin_id`,
 * `admin_email`, `old_state`, `new_state`, ...). The backend still sends the old
 * camelCase fields (`_id`, `adminId`, `adminEmail`, `oldState`) beside them as
 * deprecated aliases; this schema reads only the documented ones, so dropping the
 * aliases there changes nothing here.
 *
 * Query: `page`, `limit`, `admin_id`, `action`. There is no search by email, no
 * date range and no export.
 * ============================================================ */

/**
 * `action` is an open string. The BE validates it against a list of several
 * hundred values that grows with every feature, so a closed enum here would turn
 * every new action into a SCHEMA_MISMATCH for the whole page.
 */
export const AdminLogSchema = z.looseObject({
  id: z.string(),
  /** Null for a system-actor row (a scheduled job): show "System", not blank. */
  admin_id: z.string().nullable().optional(),
  admin_email: z.string().nullable().optional(),
  actor_type: z.string().optional(),
  action: z.string(),
  description: z.string(),
  /** The admin's typed justification, where one was collected. */
  reason: z.string().nullable().optional(),
  entity: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  /** The user affected, which is often not the entity. */
  target_user_id: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  old_state: z.record(z.string(), z.unknown()).nullable().optional(),
  new_state: z.record(z.string(), z.unknown()).nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  timestamp: z.string(),
});

export type AdminLog = z.infer<typeof AdminLogSchema>;

/** `GET /admin/admins` as the filter's admin picker needs it: who, by id. */
export const AdminLogAdminOptionSchema = z.looseObject({
  _id: z.string(),
  email: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export type AdminLogAdminOption = z.infer<typeof AdminLogAdminOptionSchema>;

/**
 * The actions worth filtering by, with the BE's own spelling (checked against
 * `ADMIN_LOG_ACTIONS`). The full list is several hundred values; these are the
 * ones an admin reviewing access or money actually looks for. Any action can
 * still be reached with `?action=` in the URL.
 */
export const ADMIN_LOG_ACTION_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'permission-denied', label: 'Denied attempt' },
  { value: 'assign-admin-role', label: 'Roles changed' },
  { value: 'update-admin-extra-permissions', label: 'Extra permissions changed' },
  { value: 'update-admin-start-page', label: 'Start page changed' },
  { value: 'create-role', label: 'Create role' },
  { value: 'delete-admin', label: 'Delete admin' },
  { value: 'log-in', label: 'Log in' },
  { value: 'approve-purchase-confirmation', label: 'Approve purchase confirmation' },
  { value: 'approve-asset-transaction', label: 'Approve asset transaction' },
  { value: 'approve-withdrawal', label: 'Approve withdrawal' },
  { value: 'reassign-associate-pro', label: 'Reassign associate pro' },
  { value: 'modify-referral-status', label: 'Modify referral status' },
  { value: 'update-payment-plan', label: 'Update payment plan' },
  { value: 'suspend-user', label: 'Suspend user' },
  { value: 'unsuspend-user', label: 'Unsuspend user' },
  { value: 'edit-wallet-details', label: 'Edit wallet details' },
  { value: 'buy-asset', label: 'Buy asset' },
  { value: 'update-asset', label: 'Update asset' },
  { value: 'delete-asset', label: 'Delete asset' },
];
