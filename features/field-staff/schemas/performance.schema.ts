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
});
export type SiteSetup = z.infer<typeof SiteSetupSchema>;
