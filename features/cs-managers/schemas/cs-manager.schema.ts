import { z } from 'zod';

/* ============================================================
 * CS Managers — role management, customer assignment, monthly targets, and
 * the performance dashboard, GET/POST/PUT/DELETE /admin/cs-managers/* and
 * /admin/payment-plans/:plan_id/*.
 *
 * The role/target/assignment endpoints landed on `staging` via PR #46 (same
 * push that shipped purchase-confirmations). The dashboard
 * (`:manager_id/dashboard`, `:manager_id/exports/plans` — CSM-21/CSM-39) is
 * on a separate branch, `feat/cs-manager-dashboard`, not yet merged but
 * clean (0 behind staging, 1 ahead) — shapes here are transcribed from that
 * branch's `cs-manager.service.ts` (`getDashboard`) and
 * `csm-dashboard.derive.ts` directly. Not live-verified either way — the
 * Railway deployment is down as of this writing.
 * ============================================================ */

export const AdminMinSchema = z
  .object({
    id: z.string(),
    user_name: z.string().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    email: z.string(),
    role: z.string(),
  })
  .nullable();

export type AdminMin = z.infer<typeof AdminMinSchema>;

/** lastName firstName — the platform-wide display order. */
export function adminMinName(admin: AdminMin): string {
  if (!admin) return 'Unknown';
  const full = `${admin.last_name ?? ''} ${admin.first_name ?? ''}`.trim();
  return full || admin.user_name || admin.email || 'Unknown';
}

export function adminMinInitials(admin: AdminMin): string {
  if (!admin) return '?';
  if (admin.first_name || admin.last_name) {
    return ((admin.first_name?.[0] ?? '') + (admin.last_name?.[0] ?? '')).toUpperCase() || '?';
  }
  const source = admin.user_name || admin.email || '';
  return source.slice(0, 2).toUpperCase() || '?';
}

/** GET /admin/cs-managers */
export const CSManagerSummarySchema = z.object({
  id: z.string(),
  manager: AdminMinSchema,
  assigned_customers_count: z.number(),
  assigned_plans_count: z.number(),
  current_period_score: z.number().nullable(),
  active_since: z.string(),
});

export type CSManagerSummary = z.infer<typeof CSManagerSummarySchema>;

/** POST /admin/cs-managers, DELETE /admin/cs-managers/:manager_id */
export const CSManagerAssignmentSchema = z.object({
  id: z.string(),
  manager: z.string(),
  assigned_from: z.string(),
  assigned_to: z.string().nullable(),
  created_by: z.string(),
  createdAt: z.string(),
});

/** GET/PUT /admin/cs-managers/:manager_id/targets/... */
export const CSManagerTargetSchema = z.object({
  id: z.string(),
  manager: z.string(),
  month: z.number(),
  year: z.number(),
  customers_allocated_target: z.number(),
  customers_onboarded_target: z.number(),
  deeds_delivered_target: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CSManagerTarget = z.infer<typeof CSManagerTargetSchema>;

/** All three are required by AssignTargetDto — unlike main's GraphQL input, none are optional. */
export type AssignTargetPayload = {
  customers_allocated_target: number;
  customers_onboarded_target: number;
  deeds_delivered_target: number;
};

/** GET /admin/cs-managers/unassigned-customers */
export const UnassignedCustomerSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  first_purchase_at: z.string(),
  days_unassigned: z.number(),
  plan_count: z.number(),
});

export type UnassignedCustomer = z.infer<typeof UnassignedCustomerSchema>;

export const UnassignedCustomersResultSchema = z.object({
  count: z.number(),
  results: z.array(UnassignedCustomerSchema),
});

/** POST /admin/cs-managers/:manager_id/assign-customers */
export const AssignCustomersResultSchema = z.object({
  assigned_count: z.number(),
  manager_id: z.string(),
});

/**
 * GET /admin/admins — bare Mongoose docs, no response DTO on the BE side.
 * Used as the admin picker source for promoting a CS Manager.
 */
export const AdminPickerRowSchema = z.looseObject({
  _id: z.string(),
  userName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  role: z.string(),
});

export type AdminPickerRow = z.infer<typeof AdminPickerRowSchema>;

export function pickerRowName(row: AdminPickerRow): string {
  const full = `${row.lastName ?? ''} ${row.firstName ?? ''}`.trim();
  return full || row.userName || row.email;
}

export function pickerRowInitials(row: AdminPickerRow): string {
  if (row.firstName || row.lastName) {
    return ((row.firstName?.[0] ?? '') + (row.lastName?.[0] ?? '')).toUpperCase() || '?';
  }
  return (row.userName || row.email).slice(0, 2).toUpperCase() || '?';
}

/* ============================================================
 * Dashboard — GET /admin/cs-managers/:manager_id/dashboard,
 * GET /admin/cs-managers/:manager_id/exports/plans.
 * ============================================================ */

export const PLAN_FILTER_KEYS = [
  'all',
  'due_allocation',
  'onboarding_pending',
  'due_doa',
  'defaulting_soon',
  'completed_payment',
] as const;
export const PlanFilterKeySchema = z.enum(PLAN_FILTER_KEYS);
export type PlanFilterKey = z.infer<typeof PlanFilterKeySchema>;

export const PLAN_SORT_KEYS = [
  'last_activity_desc',
  'last_activity_asc',
  'purchase_date_desc',
  'purchase_date_asc',
  'customer_asc',
] as const;
export const PlanSortKeySchema = z.enum(PLAN_SORT_KEYS);
export type PlanSortKey = z.infer<typeof PlanSortKeySchema>;

const AgeSplitBacklogSchema = z.object({
  total: z.number(),
  this_month: z.number(),
  last_month: z.number(),
  older: z.number(),
});

/** One row of the dashboard's plans table. */
export const PlanRowSchema = z.object({
  plan_id: z.string(),
  customer: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
  }),
  prior_plans_count: z.number(),
  asset: z.string(),
  product: z.enum(['flex', 'full_ownership']),
  purchase_date: z.string().nullable(),
  payment_status: z.enum(['in_plan', 'completed', 'close_to_default']),
  payment_label: z.string(),
  onboarding: z.enum(['call_pending', 'confirmed', 'disputed', 'not_applicable']),
  allocation: z.enum(['awaiting', 'allocated', 'not_applicable']),
  allocation_label: z.string().nullable(),
  doa: z.enum(['not_sent', 'sent', 'not_applicable']),
  doa_label: z.string().nullable(),
  last_activity_at: z.string().nullable(),
});

export type PlanRow = z.infer<typeof PlanRowSchema>;

export const CSManagerDashboardSchema = z.object({
  period: z.object({
    period_type: z.literal('MONTH'),
    month: z.number(),
    year: z.number(),
    start: z.string(),
    end: z.string(),
  }),
  manager: AdminMinSchema,
  target: z.object({
    allocated_target: z.number(),
    allocated_so_far: z.number(),
    onboarded_target: z.number(),
    onboarded_so_far: z.number(),
    deeds_delivered_target: z.number(),
    deeds_delivered_so_far: z.number(),
  }),
  performance_score: z.object({
    score: z.number(),
    allocated_component: z.number(),
    onboarded_component: z.number(),
    deeds_component: z.number(),
  }),
  obligation: z.object({
    paid_not_allocated_this_period: z.number(),
  }),
  backlogs: z.object({
    allocation: AgeSplitBacklogSchema,
    onboarding: z.object({
      total: z.number(),
      call_pending: z.number(),
      confirm_pending: z.number(),
      disputed: z.number(),
    }),
    doa: AgeSplitBacklogSchema,
  }),
  portfolio: z.object({
    total_assigned: z.number(),
    completed_payment: z.number(),
    within_payment_period: z.number(),
    close_to_defaulting: z.number(),
  }),
  plans: z.array(PlanRowSchema),
  plans_total: z.number(),
  filter_counts: z.object({
    all: z.number(),
    due_allocation: z.number(),
    onboarding_pending: z.number(),
    due_doa: z.number(),
    defaulting_soon: z.number(),
    completed_payment: z.number(),
  }),
});

export type CSManagerDashboard = z.infer<typeof CSManagerDashboardSchema>;

/* ============================================================
 * Onboarding calls + Deed of Assignment —
 * GET/POST /admin/payment-plans/:plan_id/onboarding-attempts,
 * POST /admin/payment-plans/:plan_id/mark-deed-delivered.
 * ============================================================ */

export const ONBOARDING_CALL_OUTCOMES = ['done', 'spoke', 'no_answer', 'rescheduled'] as const;
export const OnboardingCallOutcomeSchema = z.enum(ONBOARDING_CALL_OUTCOMES);
export type OnboardingCallOutcome = z.infer<typeof OnboardingCallOutcomeSchema>;

export const CustomerOnboardingAttemptSchema = z.object({
  id: z.string(),
  payment_plan: z.string(),
  customer: z.string(),
  csm: z.string(),
  outcome: OnboardingCallOutcomeSchema,
  land_choice_reason: z.string().nullable(),
  notes: z.string().nullable(),
  called_at: z.string(),
  createdAt: z.string(),
});

export type CustomerOnboardingAttempt = z.infer<typeof CustomerOnboardingAttemptSchema>;

export type LogOnboardingCallPayload = {
  outcome: OnboardingCallOutcome;
  land_choice_reason?: string;
  notes?: string;
};

export const MarkDeedDeliveredResultSchema = z.object({
  plan_id: z.string(),
  deed_delivered_at: z.string(),
  deed_delivered_by: z.string(),
  was_already_delivered: z.boolean(),
});
