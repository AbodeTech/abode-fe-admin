import { z } from 'zod';

/* ============================================================
 * Associate Pro Yearly Tracker — /admin/associate-pro-tracker/*
 *
 * Four endpoints, all year-scoped:
 *   GET  /dashboard?year=      the five metric sections
 *   GET  /years                the year picker's options
 *   GET  /goals/:year          one year's targets (404 when unset)
 *   PUT  /goals/:year          set or revise them
 *
 * NOT here, because the BE has no route for them: the recruitment, upgrades
 * and payment-plan tables, and the CSV export. The `export_associate_pro_tracker`
 * permission exists in `permissions.ts` but nothing uses it yet. See
 * docs/TRANSACTION-STATS-GAPS.md.
 * ============================================================ */

/** Tracker years are bounded on the BE; the picker should never offer others. */
export const MIN_TRACKER_YEAR = 2020;
export const MAX_TRACKER_YEAR = 2100;

/* -------------------- year picker -------------------- */

/**
 * Years with a goal set, unioned with years that saw activity, plus the current
 * year — newest first. A fresh install still gets the current year, so the
 * picker is never empty.
 */
export const YearsListSchema = z.object({
  years: z.array(z.number()),
  current_year: z.number(),
});

export type YearsList = z.infer<typeof YearsListSchema>;

/* -------------------- goals -------------------- */

export const YearlyGoalSchema = z.object({
  year: z.number(),
  associate_pro_target: z.number(),
  revenue_target: z.number(),
  notes: z.string().nullable(),
  created_by: z.string(),
  last_edited_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type YearlyGoal = z.infer<typeof YearlyGoalSchema>;

/**
 * `PUT /goals/:year` body. Revising is allowed all year and is never locked —
 * the BE audits every change with before/after, so a mid-year correction is a
 * normal action rather than an exception.
 */
export const upsertYearlyGoalSchema = z.object({
  // Plain `number`, not `z.coerce.number()`: coercion widens the schema's INPUT
  // type to `unknown`, which no longer matches react-hook-form's Resolver. The
  // inputs convert with `valueAsNumber` instead, as the commission forms do.
  associate_pro_target: z
    .number({ message: 'Enter a number' })
    .int('Use a whole number of associate pros')
    .min(0, 'Cannot be negative'),
  revenue_target: z.number({ message: 'Enter a number' }).min(0, 'Cannot be negative'),
  notes: z.string().max(2000, 'Keep notes under 2000 characters').optional(),
});

export type UpsertYearlyGoalPayload = z.infer<typeof upsertYearlyGoalSchema>;

/* -------------------- dashboard -------------------- */

/** The year window the numbers were computed over, in UTC. */
export const YearPeriodSchema = z.object({
  year: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  days_elapsed: z.number(),
  days_remaining: z.number(),
  total_days: z.number(),
});

export type YearPeriod = z.infer<typeof YearPeriodSchema>;

/**
 * Goal-dependent fields are NULL when no goal is set for the year, while the
 * live figures alongside them are always populated. That is the whole point of
 * `goals_set`: a historical year still shows its real numbers, and only the
 * target comparison is swapped for a prompt.
 */
export const AssociateProProgressSchema = z.object({
  current_associate_pro: z.number(),
  target_associate_pro: z.number().nullable(),
  progress_text: z.string().nullable(),
  percentage_complete: z.number().nullable(),
});

export const RevenueMetricsSchema = z.object({
  total_revenue: z.number(),
  revenue_goal: z.number().nullable(),
  revenue_remaining: z.number().nullable(),
  progress_text: z.string().nullable(),
  percentage_complete: z.number().nullable(),
});

/** A rate against a zero denominator is 0 — never NaN, never hidden. */
export const FunnelSchema = z.object({
  total: z.number(),
  converted: z.number(),
  not_converted: z.number(),
  conversion_rate: z.number(),
});

export type Funnel = z.infer<typeof FunnelSchema>;

export const ConversionMetricsSchema = z.object({
  /** Denominator: everyone who signed up in the year. */
  user_to_associate_pro: FunnelSchema,
  /** Denominator: everyone who reached the associate rung in the year. */
  associate_to_associate_pro: FunnelSchema,
  total_associate_pro: z.number(),
  overall_conversion_rate: z.number(),
});

export const DailyPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export type DailyPoint = z.infer<typeof DailyPointSchema>;

/**
 * `average` is over days the YEAR has run, not over days that reported data —
 * a quiet week counts against the average rather than being skipped.
 */
export const SeriesSchema = z.object({
  chart_data: z.array(DailyPointSchema),
  total: z.number(),
  average: z.number(),
  peak: DailyPointSchema.nullable(),
});

export type Series = z.infer<typeof SeriesSchema>;

export const GraphsSchema = z.object({
  revenue_graph: SeriesSchema,
  conversion_graph: z.object({
    user_to_associate_pro: SeriesSchema,
    associate_to_associate_pro: SeriesSchema,
    new_signups: SeriesSchema,
  }),
});

export const TrackerDashboardSchema = z.object({
  goals_set: z.boolean(),
  year_period: YearPeriodSchema,
  associate_pro_progress: AssociateProProgressSchema,
  revenue_metrics: RevenueMetricsSchema,
  conversion_metrics: ConversionMetricsSchema,
  graphs: GraphsSchema,
});

export type TrackerDashboard = z.infer<typeof TrackerDashboardSchema>;

/* -------------------- permissions -------------------- */

export const TRACKER_PERMISSIONS = {
  view: 'view_associate_pro_tracker',
  manageGoals: 'manage_yearly_goals',
  export: 'export_associate_pro_tracker',
} as const;
