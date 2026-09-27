import { z } from 'zod';

import { FieldAssetRefSchema, FieldStaffTypeSchema } from './field-staff.schema';
import { FieldMetricKeySchema, FieldMetricUnitSchema, ScorecardStateSchema } from './scorecard.schema';

/* ============================================================
 * Field performance. /admin/field-performance/*, /admin/assets/:id/site-setup
 *
 * Mirrors abode-be-v2 `field-performance.service.ts` (build, summary) and
 * `site-setup.service.ts`. Scores and percentages are 0–100 numbers.
 *
 *   achievement  = verified ÷ target        (uncapped_achievement_pct may pass 100)
 *   earned_score = min(achievement, 100%) × weight
 *   score        = Σ earned_score on one scorecard
 *   total_score  = mean of the person's scorecard scores
 *
 * Draft scorecards are left out entirely — a site whose only scorecard is a
 * draft shows up in `sites_without_targets`.
 * ============================================================ */

export const MetricPerformanceSchema = z.object({
  metric_key: FieldMetricKeySchema,
  label: z.string(),
  unit: FieldMetricUnitSchema,
  target: z.number(),
  weight: z.number(),
  verified: z.number(),
  pending: z.number(),
  uncapped_achievement_pct: z.number(),
  achievement_pct: z.number(),
  earned_score: z.number(),
  verified_submissions: z.number(),
  pending_submissions: z.number(),
  last_work_date: z.string().nullable(),
  /**
   * Verified quantity per ISO week of the year. Grouped by metric only, so it
   * covers all of the person's sites for that metric, not just this one.
   */
  weekly: z.array(z.object({ week: z.number(), quantity: z.number() })),
  projected_score: z.number(),
  projected_achievement_pct: z.number(),
});
export type MetricPerformance = z.infer<typeof MetricPerformanceSchema>;

/** `missing` — no scorecard. `invalid` — published but weights don't total 100, so not comparable. */
export const PerformanceStateSchema = z.union([ScorecardStateSchema, z.enum(['missing', 'invalid'])]);
export type PerformanceState = z.infer<typeof PerformanceStateSchema>;

/** One site in a person's month — a scorecard, or a site covered with no live targets. */
export const SitePerformanceSchema = z.object({
  scorecard_id: z.string().nullable(),
  asset: FieldAssetRefSchema,
  state: PerformanceStateSchema,
  scorecard_state: PerformanceStateSchema,
  target_version: z.number().nullable(),
  is_restatement: z.boolean(),
  target_coverage: z.object({
    metrics_with_targets: z.number(),
    metrics_available: z.number(),
    missing_metrics: z.array(z.string()),
    weight_total: z.number(),
  }),
  metrics: z.array(MetricPerformanceSchema),
  score: z.number(),
  projected_score: z.number(),
  projected_score_note: z.string(),
});
export type SitePerformance = z.infer<typeof SitePerformanceSchema>;

/** GET /admin/field-performance/staff/:staffId — one person's month across every site. */
export const StaffMonthSchema = z.object({
  field_staff: z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string(),
    staff_type: FieldStaffTypeSchema,
  }),
  year: z.number(),
  month: z.number(),
  month_label: z.string(),
  allocation_events: z.array(z.looseObject({})),
  /** Sites with a published, finalised or restated scorecard. */
  scorecards: z.array(SitePerformanceSchema),
  /** Sites covered this month with no live scorecard — "no targets", never a zero. */
  sites_without_targets: z.array(SitePerformanceSchema),
  metrics: z.array(MetricPerformanceSchema),
  /** 0 when there are no scorecards — check `scorecards.length` before showing it. */
  total_score: z.number(),
  projected_score: z.number(),
  /** Waiting submissions on targeted metrics only. */
  pending_submissions: z.number(),
});
export type StaffMonth = z.infer<typeof StaffMonthSchema>;

/** GET /admin/field-performance/summary — active workers only. */
export const PerformanceSummarySchema = z.object({
  month: z.string(),
  year: z.number(),
  month_number: z.number(),
  workers: z.array(StaffMonthSchema),
  totals: z.object({
    workers: z.number(),
    with_targets: z.number(),
    average_score: z.number(),
    pending_reviews: z.number(),
    comparable_scores: z.number(),
    not_comparable: z.number(),
    sites_without_targets: z.number(),
  }),
  coverage_note: z.string(),
});
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

/** GET /admin/field-performance/trend/:staffId?months= — one person's score month by month, oldest first. */
export const StaffTrendSchema = z.object({
  field_staff: z.looseObject({ id: z.string(), full_name: z.string() }),
  points: z.array(
    z.object({
      year: z.number(),
      month: z.number(),
      label: z.string(),
      /** 0 when the month had no targets — check `scorecards` before showing it. */
      score: z.number(),
      projected_score: z.number(),
      scorecards: z.number(),
      sites_without_targets: z.number(),
    })
  ),
  /** Averaged over months that had targets only. */
  average_score: z.number(),
  months_compared: z.number(),
  note: z.string(),
});
export type StaffTrend = z.infer<typeof StaffTrendSchema>;

const BlockerStaffSchema = z.looseObject({ id: z.string(), full_name: z.string() });

/**
 * GET /admin/field-performance/blockers?year&month&stale_after_days — what's
 * holding field performance back. Covers **every role**: stale reviews carry
 * no staff_type, so filter them against the roster on screen.
 */
export const FieldBlockersSchema = z.object({
  month: z.string(),
  /** Oldest first, capped at 200 by the BE. Not limited to the month. */
  stale_reviews: z.array(
    z.object({
      submission_id: z.string(),
      field_staff: BlockerStaffSchema,
      asset: z.object({ id: z.string(), name: z.string().nullable() }),
      metric_key: z.string(),
      submitted_at: z.string().nullable(),
      days_waiting: z.number().nullable(),
    })
  ),
  /** Active workers with no scorecard at all this month (drafts count as having one). */
  workers_without_targets: z.array(z.object({ field_staff: BlockerStaffSchema.extend({ staff_type: z.string() }) })),
  unpublished_scorecards: z.array(
    z.object({
      field_staff: BlockerStaffSchema.extend({ staff_type: z.string() }),
      asset: z.object({ id: z.string(), name: z.string().nullable() }),
    })
  ),
  stale_after_days: z.number(),
});
export type FieldBlockers = z.infer<typeof FieldBlockersSchema>;

/** GET /admin/assets/:assetId/field-costs — verified field spending on one estate. */
export const FieldCostsSchema = z.looseObject({
  total_amount: z.number(),
  /** One per verified cost; a verified submission appears here with its `submission_id`. */
  entries: z.array(z.looseObject({ submission_id: z.string(), amount: z.number() })),
});
export type FieldCosts = z.infer<typeof FieldCostsSchema>;

/* -------------------- site setup -------------------- */

export const FENCING_SIDES = ['front', 'right', 'back', 'left'] as const;

export const FencingSideSchema = z.object({
  side: z.enum(FENCING_SIDES),
  /** Null until an approved boundary exists — show "not set", not 0. */
  approved_metres: z.number().nullable(),
  fenced_metres: z.number(),
  repaired_metres: z.number(),
  remaining_metres: z.number().nullable(),
  over_by_metres: z.number().nullable(),
  percent_complete: z.number().nullable(),
});
export type FencingSide = z.infer<typeof FencingSideSchema>;

/** GET /admin/assets/:assetId/site-setup — estate-wide progress from verified work. */
export const SiteSetupSchema = z.looseObject({
  asset: z.looseObject({ id: z.string(), name: z.string() }),
  boundary: z
    .looseObject({
      version: z.number(),
      /** The approved lengths per side, in metres. */
      sides: z.record(z.string(), z.number()).nullable().optional(),
      perimeter_metres: z.number().nullable(),
      approved_at: z.string().nullable(),
    })
    .nullable(),
  boundary_established_metres: z.number(),
  fencing: z.looseObject({
    sides: z.array(FencingSideSchema),
    total_fenced_metres: z.number(),
    approved_perimeter_metres: z.number().nullable(),
    percent_complete: z.number().nullable(),
  }),
  clearing: z.looseObject({ cleared_sqm: z.number() }),
  parcelation: z.looseObject({ plots_parcelled: z.number(), plots_re_pegged: z.number() }),
});

/** One plot from GET /admin/assets/:assetId/plots — just its field state. */
export const AssetPlotSchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  size_sqm: z.number().nullable(),
  parcelled: z.boolean(),
  re_pegged_count: z.number(),
  cleared_sqm: z.number(),
});
export type AssetPlot = z.infer<typeof AssetPlotSchema>;

/** GET /admin/assets/:assetId/plots — the plots page, filtered. */
export const AssetPlotsSchema = z.looseObject({ plots: z.array(AssetPlotSchema) });
export type SiteSetup = z.infer<typeof SiteSetupSchema>;
