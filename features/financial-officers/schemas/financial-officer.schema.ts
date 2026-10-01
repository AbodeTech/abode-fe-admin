import { z } from 'zod';

/* ============================================================
 * Financial Officers — promoted admins measured on two things:
 *
 *   1. Approval speed: average time from submission to approve/decline on
 *      bank-transfer payments, split into asset payments and Associate Pro
 *      upgrades. Saturday and Sunday (WAT) don't count; public holidays do
 *      (no holiday calendar exists). Declines count. The
 *      queue is shared; speed is credited to whoever decided.
 *   2. Debt recovered: a payment plan (flex, full ownership or commercial)
 *      enters an officer's recovery book automatically when it is in its
 *      FINAL month and owes more than one installment, or when its final due
 *      date has passed with any balance. Falling behind mid-tenor doesn't
 *      enter. Plans go to the officer with the fewest open plans. Land
 *      payments settled while it is in the book, up to suspension, are that
 *      officer's recovery; development levy doesn't count.
 *
 * 🚧 Provisional. `abode-be-v2` has no financial-officer module yet; the BE
 * design is abode-be-v2/docs/FINANCIAL-OFFICER-DESIGN.md, and these shapes
 * follow its §6. Runs against lib/mocks only (docs/BACKEND-REQUESTS.md #33).
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
  return (admin.user_name || admin.email || '').slice(0, 2).toUpperCase() || '?';
}

/* -------------------- role -------------------- */

/** GET /admin/financial-officers */
export const FinancialOfficerSummarySchema = z.object({
  id: z.string(),
  officer: AdminMinSchema,
  active_since: z.string(),
  open_plans_count: z.number(),
  /** Null when no recovery target is set for the current month. */
  current_period_score: z.number().nullable(),
});

export type FinancialOfficerSummary = z.infer<typeof FinancialOfficerSummarySchema>;

/** POST /admin/financial-officers, DELETE /admin/financial-officers/:officer_id */
export const FinancialOfficerAssignmentSchema = z.object({
  id: z.string(),
  officer: z.string(),
  assigned_from: z.string(),
  assigned_to: z.string().nullable(),
  created_by: z.string(),
});

/**
 * GET /admin/admins — the admin picker for promoting an officer. Bare Mongoose
 * docs on the BE. Same source cs-managers uses; roles-permissions hasn't
 * migrated off GraphQL, so each feature that needs a picker reads it directly.
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

/* -------------------- targets -------------------- */

/**
 * GET/PUT /admin/financial-officers/:officer_id/targets[/:year/:month]
 *
 * Only recovery is targeted per officer. The approval-time target is one
 * platform-wide number (24 weekday hours), returned on the dashboard as
 * `approval_target_hours`, not set per person.
 */
export const FinancialOfficerTargetSchema = z.object({
  id: z.string(),
  officer: z.string(),
  month: z.number(),
  year: z.number(),
  /** Naira. */
  recovery_target: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FinancialOfficerTarget = z.infer<typeof FinancialOfficerTargetSchema>;

export type AssignFinancialOfficerTargetPayload = { recovery_target: number };

/* -------------------- shared dashboard blocks -------------------- */

const PeriodSchema = z.object({
  month: z.number(),
  year: z.number(),
  start: z.string(),
  end: z.string(),
});

export const APPROVAL_KINDS = ['asset', 'associate_pro'] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

const ApprovalStatsSchema = z.object({
  decided: z.number(),
  approved: z.number(),
  declined: z.number(),
  /** Weekday hours. Null when nothing was decided in the period. */
  avg_hours: z.number().nullable(),
  median_hours: z.number().nullable(),
  slowest: z
    .object({
      hours: z.number(),
      customer_name: z.string(),
      submitted_at: z.string(),
    })
    .nullable(),
});

export type ApprovalStats = z.infer<typeof ApprovalStatsSchema>;

/** Live, not period-scoped: what is waiting right now, by weekday hours waited. */
const ApprovalQueueSchema = z.object({
  total: z.number(),
  under_12h: z.number(),
  between_12_24h: z.number(),
  over_24h: z.number(),
  asset: z.object({ waiting: z.number(), over_24h: z.number() }),
  associate_pro: z.object({ waiting: z.number(), over_24h: z.number() }),
});

export type ApprovalQueue = z.infer<typeof ApprovalQueueSchema>;

/* -------------------- officer dashboard -------------------- */

export const RecentDecisionSchema = z.object({
  id: z.string(),
  kind: z.enum(APPROVAL_KINDS),
  /** e.g. "Flex installment", "Full ownership outright", "Upgrade". */
  label: z.string(),
  customer_name: z.string(),
  amount: z.number(),
  submitted_at: z.string(),
  decided_at: z.string(),
  /** Weekday hours between the two — what the average is built from. */
  hours_counted: z.number(),
  outcome: z.enum(['approved', 'declined']),
});

export type RecentDecision = z.infer<typeof RecentDecisionSchema>;

export const RECOVERY_PRODUCTS = ['flex', 'full_ownership', 'commercial'] as const;
export type RecoveryProduct = (typeof RECOVERY_PRODUCTS)[number];

/** `final_month`: open, before the final due date. `past_due`: open, after it. */
export const RECOVERY_STATES = ['final_month', 'past_due', 'cleared', 'suspended'] as const;
export type RecoveryState = (typeof RECOVERY_STATES)[number];

const RecoveryCustomerSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
});

export const RecoveryPlanRowSchema = z.object({
  plan_id: z.string(),
  /**
   * The officer's own assignment row. A plan can have several (reassigned, or
   * back after an unsuspension); each table row is one of them, and the drawer
   * opens that one.
   */
  assignment_id: z.string(),
  customer: RecoveryCustomerSchema,
  asset: z.string(),
  product: z.enum(RECOVERY_PRODUCTS),
  tenor_months: z.number(),
  entered_book_at: z.string(),
  /** Behind in the final month, or already past the final due date. */
  entry_reason: z.enum(['final_month_behind', 'past_final_due']),
  state: z.enum(RECOVERY_STATES),
  final_due_date: z.string(),
  /** The monthly installment. In the final month, `balance − installment_amount` is how far behind. */
  installment_amount: z.number(),
  /** Days past the final due date. 0 until it passes. */
  days_past_due: z.number(),
  /** Projected while open; the actual date once suspended; null when cleared. */
  suspends_at: z.string().nullable(),
  balance: z.number(),
  recovered_since_assigned: z.number(),
  /** Set once cleared or suspended. */
  left_book_at: z.string().nullable(),
});

export type RecoveryPlanRow = z.infer<typeof RecoveryPlanRowSchema>;

export const RECOVERY_FILTER_KEYS = [
  'in_book',
  'final_month',
  'past_due',
  'suspending_soon',
  'cleared',
  'suspended',
] as const;
export const RecoveryFilterKeySchema = z.enum(RECOVERY_FILTER_KEYS);
export type RecoveryFilterKey = z.infer<typeof RecoveryFilterKeySchema>;

export const FinancialOfficerDashboardSchema = z.object({
  period: PeriodSchema,
  officer: AdminMinSchema,
  approval_target_hours: z.number(),
  approvals: z.object({
    asset: ApprovalStatsSchema,
    associate_pro: ApprovalStatsSchema,
  }),
  queue: ApprovalQueueSchema,
  recent_decisions: z.array(RecentDecisionSchema),
  recovery: z.object({
    /** Naira. 0 when no target is set for the period. */
    target: z.number(),
    recovered: z.number(),
    payments_count: z.number(),
    plans_paid_count: z.number(),
    in_book: z.number(),
    final_month: z.number(),
    past_due: z.number(),
    outstanding: z.number(),
    cleared: z.number(),
    suspended: z.number(),
    /** Balance left owing on plans suspended this period. */
    unrecovered_on_suspension: z.number(),
    suspending_within_14_days: z.number(),
  }),
  /**
   * Asset speed 25 + Associate Pro speed 25 + recovery 50. Speed earns full
   * marks at or under the target and scales down (target / avg) above it;
   * recovery is capped at its target. Untargeted recovery contributes 0.
   */
  performance_score: z.object({
    score: z.number(),
    asset_speed_component: z.number(),
    pro_speed_component: z.number(),
    recovery_component: z.number(),
  }),
  plans: z.array(RecoveryPlanRowSchema),
  /** Post-filter, pre-pagination. */
  plans_total: z.number(),
  /** Book-wide, unaffected by the active filter. */
  filter_counts: z.object({
    in_book: z.number(),
    final_month: z.number(),
    past_due: z.number(),
    suspending_soon: z.number(),
    cleared: z.number(),
    suspended: z.number(),
  }),
});

export type FinancialOfficerDashboard = z.infer<typeof FinancialOfficerDashboardSchema>;

/* -------------------- team dashboard -------------------- */

export const OfficerLeagueRowSchema = z.object({
  officer: AdminMinSchema,
  active_since: z.string(),
  /** Set when they were removed; the team view lists anyone who held the role that month. */
  role_ended_at: z.string().nullable(),
  in_book: z.number(),
  suspending_within_14_days: z.number(),
  recovered: z.number(),
  recovery_target: z.number(),
  asset_avg_hours: z.number().nullable(),
  pro_avg_hours: z.number().nullable(),
  decisions: z.number(),
  score: z.number().nullable(),
});

export type OfficerLeagueRow = z.infer<typeof OfficerLeagueRowSchema>;

/** GET /admin/financial-officers/team-dashboard */
export const FinancialOfficersTeamDashboardSchema = z.object({
  period: PeriodSchema,
  approval_target_hours: z.number(),
  approvals: z.object({
    asset: z.object({ decided: z.number(), avg_hours: z.number().nullable() }),
    associate_pro: z.object({ decided: z.number(), avg_hours: z.number().nullable() }),
  }),
  queue: ApprovalQueueSchema,
  /** Upgrades cancelled after sitting 24h+ with nobody deciding them. */
  expired_unreviewed_upgrades: z.number(),
  /** Plans that qualify for a book but have no officer, because none exist. */
  unassigned_eligible: z.number(),
  recovery: z.object({
    recovered: z.number(),
    target: z.number(),
    in_book: z.number(),
    outstanding: z.number(),
    suspended: z.number(),
    unrecovered_on_suspension: z.number(),
  }),
  officers: z.array(OfficerLeagueRowSchema),
  /** Admins with approve permission who aren't officers — their decisions still happen. */
  other_admins: z.object({
    asset_avg_hours: z.number().nullable(),
    pro_avg_hours: z.number().nullable(),
    decisions: z.number(),
  }),
});

export type FinancialOfficersTeamDashboard = z.infer<typeof FinancialOfficersTeamDashboardSchema>;

/* -------------------- recovery plan detail -------------------- */

export const RecoveryPaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  paid_at: z.string(),
  method: z.enum(['transfer', 'paystack', 'wallet']),
  /** Null for automatic payments (Paystack, wallet). */
  approved_by: AdminMinSchema,
  approval_hours: z.number().nullable(),
});

export type RecoveryPayment = z.infer<typeof RecoveryPaymentSchema>;

/** GET /admin/financial-officers/recovery-plans/:plan_id */
export const RecoveryPlanDetailSchema = RecoveryPlanRowSchema.extend({
  plan_price: z.number(),
  amount_paid: z.number(),
  /** Null on some migrated plans; full-ownership plans can still enter via `tenor_end_date`. */
  start_date: z.string().nullable(),
  /** Default-penalty date, when one is still ahead. */
  penalty_at: z.string().nullable(),
  assignment: z.object({
    officer: AdminMinSchema,
    assigned_at: z.string(),
    /** False when a super admin reassigned it by hand. */
    auto: z.boolean(),
  }),
  payments: z.array(RecoveryPaymentSchema),
});

export type RecoveryPlanDetail = z.infer<typeof RecoveryPlanDetailSchema>;
