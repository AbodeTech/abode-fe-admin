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

/**
 * GET /admin/cs-managers/me (BE e660a21), mirroring GET /admin/managers/me:
 * a body, not a 403, when the caller has no book.
 * `manager` is the same row GET /admin/cs-managers lists.
 */
export const CSManagerProfileSchema = z.object({
  is_cs_manager: z.boolean(),
  manager: CSManagerSummarySchema.nullable(),
});

export type CSManagerProfile = z.infer<typeof CSManagerProfileSchema>;

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
  /**
   * The third target, and a PERCENTAGE rather than a count: the share of the
   * month's ticket intake that should end up resolved.
   *
   * Replaced `deeds_delivered_target`, which is deprecated and unread now that
   * the system issues deeds itself. The API accepts and returns this one.
   */
  tickets_resolved_target: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CSManagerTarget = z.infer<typeof CSManagerTargetSchema>;

/** All three are required by AssignTargetDto — unlike main's GraphQL input, none are optional. */
export type AssignTargetPayload = {
  customers_allocated_target: number;
  customers_onboarded_target: number;
  /** A percentage (0-100), not a count. */
  tickets_resolved_target: number;
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

/*
 * abode-be-v2 `port/v1-sep-oct` (2026-10-17) adds the estate filter, the phone
 * and last call on each row, the three "what was tried" chips, the split of the
 * onboarding backlog and `estates[]`. Read from `csm-dashboard.derive.ts` and
 * `dto/cs-manager-requests.dto.ts` on that branch. The new response fields
 * default or stay optional, so the page still renders against a BE without
 * them (a chip with no count is hidden rather than shown as 0).
 */
export const PLAN_FILTER_KEYS = [
  'all',
  'due_allocation',
  'onboarding_pending',
  'never_attempted',
  'no_answer',
  'rescheduled',
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

/** The most recent onboarding call on a plan, whatever came of it. */
export const LastAttemptSchema = z.object({
  outcome: z.string(),
  called_at: z.string(),
  /** Every call logged on the plan, this one included. */
  attempts: z.number(),
});

export type LastAttempt = z.infer<typeof LastAttemptSchema>;

/** One row of the dashboard's plans table. */
export const PlanRowSchema = z.object({
  plan_id: z.string(),
  customer: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    /** As the customer typed it (0803…, +234…), not normalised. Empty when none. */
    phone: z.string().default(''),
  }),
  prior_plans_count: z.number(),
  /** The estate name. */
  asset: z.string(),
  asset_id: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  /** sqm per unit; the plan's land is `size × units`. */
  size: z.number().nullable().default(null),
  units: z.number().default(1),
  /** As stored on the plan (`pending`, `allocated`, …) — distinct from the derived `allocation`. */
  allocation_status: z.string().nullable().default(null),
  product: z.enum(['flex', 'full_ownership', 'commercial']),
  purchase_date: z.string().nullable(),
  payment_status: z.enum(['in_plan', 'completed', 'close_to_default']),
  payment_label: z.string(),
  onboarding: z.enum(['call_pending', 'confirmed', 'disputed', 'not_applicable']),
  allocation: z.enum(['awaiting', 'allocated', 'not_applicable']),
  allocation_label: z.string().nullable(),
  doa: z.enum(['not_sent', 'sent', 'not_applicable']),
  doa_label: z.string().nullable(),
  last_activity_at: z.string().nullable(),
  /** Null when nobody has rung yet. */
  last_attempt: LastAttemptSchema.nullable().default(null),
});

export type PlanRow = z.infer<typeof PlanRowSchema>;

/**
 * One estate in the book, for the estate filter. Counted over the whole book
 * before any estate, chip or search, and grouped by name (flex and
 * full-ownership of one estate are one option).
 */
export const EstateOptionSchema = z.object({
  name: z.string(),
  plans: z.number(),
  /** Of those plans, fully paid and waiting for a plot. */
  due_allocation: z.number(),
});

export type EstateOption = z.infer<typeof EstateOptionSchema>;

export const CSManagerDashboardSchema = z.object({
  period: z.object({
    period_type: z.literal('MONTH'),
    month: z.number(),
    year: z.number(),
    start: z.string(),
    end: z.string(),
  }),
  manager: AdminMinSchema.nullable(),
  target: z.object({
    allocated_target: z.number(),
    allocated_so_far: z.number(),
    onboarded_target: z.number(),
    onboarded_so_far: z.number(),
    /**
     * The third component is ticket resolution, not deeds delivered
     * (CSM-ADD-16). Issuing a deed became a generated document, so scoring it
     * measured the machine — and `deed_delivered_at` was a box the manager
     * ticked by hand, so with issuance automated they could collect 30 points
     * for work the system had already done.
     *
     * This one is a RATE, not a count: a percentage of the month's intake
     * against a percentage target. The raw counts ride along so the dashboard
     * can show the working — "18 of 24 resolved" is legible where "75%" alone
     * is not.
     */
    tickets_resolved_target: z.number(),
    /** Null when no tickets arrived — the UI shows "—", not a damning 0%. */
    ticket_resolution_rate: z.number().nullable(),
    tickets_entered: z.number().default(0),
    tickets_resolved: z.number().default(0),
    ticket_flow: z.array(z.object({ month: z.string(), created: z.number(), resolved: z.number() })),
  }),
  performance_score: z.object({
    score: z.number(),
    allocated_component: z.number(),
    onboarded_component: z.number(),
    tickets_component: z.number(),
  }),
  obligation: z.object({
    paid_not_allocated_this_period: z.number(),
  }),
  backlogs: z.object({
    allocation: AgeSplitBacklogSchema,
    onboarding: z.object({
      total: z.number(),
      call_pending: z.number(),
      /**
       * `call_pending` split by purchase date: bought in the selected period
       * against already waiting before it. Always sums to `call_pending`.
       */
      call_pending_this_period: z.number().optional(),
      call_pending_carried_over: z.number().optional(),
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
  /** Per chip, narrowed by the estate but not by the active chip or search. */
  filter_counts: z.object({
    all: z.number(),
    due_allocation: z.number(),
    onboarding_pending: z.number(),
    never_attempted: z.number().optional(),
    no_answer: z.number().optional(),
    rescheduled: z.number().optional(),
    due_doa: z.number(),
    defaulting_soon: z.number(),
    completed_payment: z.number(),
  }),
  /** Every estate in the book, whatever the estate, chip or search. */
  estates: z.array(EstateOptionSchema).default([]),
});

export type CSManagerDashboard = z.infer<typeof CSManagerDashboardSchema>;

/* ============================================================
 * Onboarding calls —
 * GET/POST /admin/payment-plans/:plan_id/onboarding-attempts
 *
 * There is no deed mutation here any more. The system issues the Deed of
 * Assignment on its own, so nobody marks one delivered; the `doa` column on the
 * plans table reads `deed_sent_at` and is information, not a task.
 * ============================================================ */

export const ONBOARDING_CALL_OUTCOMES = ['done', 'spoke', 'no_answer', 'rescheduled'] as const;
export const OnboardingCallOutcomeSchema = z.enum(ONBOARDING_CALL_OUTCOMES);
export type OnboardingCallOutcome = z.infer<typeof OnboardingCallOutcomeSchema>;

/**
 * Why the customer bought — `LAND_CHOICE_REASONS` on the BE, which rejects
 * anything off this list when a call is logged. Taken from what CSMs actually
 * typed across 556 free-text answers, in order of how often each came up.
 */
export const LAND_CHOICE_REASONS = [
  'investment',
  'location',
  'campaign',
  'referrer',
  'price',
  'flexible_payment',
  'payment_duration',
  'development_in_area',
  'other',
] as const;
export const LandChoiceReasonSchema = z.enum(LAND_CHOICE_REASONS);
export type LandChoiceReason = z.infer<typeof LandChoiceReasonSchema>;

export const LAND_CHOICE_REASON_LABELS: Record<LandChoiceReason, string> = {
  investment: 'Investment',
  location: 'Location',
  campaign: 'Campaign',
  referrer: 'Referrer',
  price: 'Price',
  flexible_payment: 'Flexible payment',
  payment_duration: 'Payment duration',
  development_in_area: 'Development in the area',
  other: 'Other',
};

/**
 * The label for a reason on the list, or the stored text as-is: calls logged
 * before the list hold free text, and the BE returns them unchanged.
 */
export function landChoiceReasonLabel(reason: string): string {
  const parsed = LandChoiceReasonSchema.safeParse(reason);
  return parsed.success ? LAND_CHOICE_REASON_LABELS[parsed.data] : reason;
}

export const CustomerOnboardingAttemptSchema = z.object({
  id: z.string(),
  payment_plan: z.string(),
  customer: z.string(),
  csm: z.string(),
  outcome: OnboardingCallOutcomeSchema,
  /** A LAND_CHOICE_REASONS value, or free text on calls logged before the list. */
  land_choice_reason: z.string().nullable(),
  notes: z.string().nullable(),
  called_at: z.string(),
  createdAt: z.string(),
});

export type CustomerOnboardingAttempt = z.infer<typeof CustomerOnboardingAttemptSchema>;

/** LogOnboardingCallDto — `called_at` is also accepted but this form never sends it. */
export type LogOnboardingCallPayload = {
  outcome: OnboardingCallOutcome;
  land_choice_reason?: LandChoiceReason;
  notes?: string;
};

/* ============================================================
 * Auto-assign — GET /admin/cs-managers/auto-assign/preview (super admin).
 *
 * A dry run of the job that gives every buyer with no CS Manager the manager
 * with the smallest book. Writes nothing, whatever the flag. The job itself
 * only runs when the BE env `CS_MANAGER_AUTO_ASSIGN=true`.
 * ============================================================ */

export const AUTO_ASSIGN_STATUSES = ['ok', 'dry_run', 'disabled', 'locked', 'no_managers'] as const;

export const AutoAssignPreviewSchema = z.object({
  /** `dry_run`, or `no_managers` when buyers are waiting and no CS Manager is active. */
  status: z.enum(AUTO_ASSIGN_STATUSES),
  /** Whether `CS_MANAGER_AUTO_ASSIGN` is on. */
  enabled: z.boolean(),
  /** Buyers with no CS Manager right now. */
  pending: z.number(),
  /** How many the next run would assign. */
  assigned: z.number(),
  /** `manager_id` is the admin id, as on `CSManagerSummary.manager.id`. */
  by_manager: z.array(z.object({ manager_id: z.string(), assigned: z.number() })),
});

export type AutoAssignPreview = z.infer<typeof AutoAssignPreviewSchema>;

