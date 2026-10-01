import { z } from 'zod';

import { FieldAssetRefSchema, FieldStaffRefSchema, FieldStaffTypeSchema } from './field-staff.schema';

/* ============================================================
 * Monthly scorecards — one worker, one estate, one month, versioned.
 * /admin/field-scorecards/*
 *
 * Mirrors abode-be-v2 `scorecard.presenter.ts` and `field-metrics.ts`.
 * The pickable metrics come from GET /admin/field-scorecards/metrics — don't
 * hardcode the list; the keys below exist only for typing.
 * ============================================================ */

export const FIELD_METRIC_KEYS = [
  'fencing_new_metres',
  'allocation_customers',
  'parcelation_plots',
  'clearing_sqm',
  'boundary_metres',
] as const;
export const FieldMetricKeySchema = z.enum(FIELD_METRIC_KEYS);
export type FieldMetricKey = z.infer<typeof FieldMetricKeySchema>;

export const FIELD_METRIC_UNITS = ['metres', 'sqm', 'plots', 'customers'] as const;
export const FieldMetricUnitSchema = z.enum(FIELD_METRIC_UNITS);
export type FieldMetricUnit = z.infer<typeof FieldMetricUnitSchema>;

export const FieldMetricDefinitionSchema = z.object({
  key: FieldMetricKeySchema,
  label: z.string(),
  unit: FieldMetricUnitSchema,
  staff_type: FieldStaffTypeSchema,
  description: z.string(),
});
export type FieldMetricDefinition = z.infer<typeof FieldMetricDefinitionSchema>;

/**
 * Metrics the backend offers that this admin deliberately doesn't offer for
 * new targets. Physical allocation (`allocation_customers`) stays parked until
 * the product decision in docs/docs/FIELD-TRACKING-FRONTEND-TODO.md is revisited.
 * A scorecard that already has one keeps it — see useRoleMetrics.
 */
export const HIDDEN_METRIC_KEYS: readonly FieldMetricKey[] = ['allocation_customers'];

/** GET /admin/field-scorecards/metrics */
export const FieldMetricsSchema = z.object({
  metrics: z.array(FieldMetricDefinitionSchema),
  by_staff_type: z.object({
    site_manager: z.array(FieldMetricKeySchema),
    surveyor: z.array(FieldMetricKeySchema),
  }),
});
export type FieldMetrics = z.infer<typeof FieldMetricsSchema>;

/**
 * `draft` — invisible to the worker, editable. `published` — live.
 * `finalised` — month closed, score frozen. `restated` — a finalised month
 * reopened as a new version; editable, and scored once published again.
 */
export const SCORECARD_STATES = ['draft', 'published', 'finalised', 'restated'] as const;
export const ScorecardStateSchema = z.enum(SCORECARD_STATES);
export type ScorecardState = z.infer<typeof ScorecardStateSchema>;

export const SCORECARD_STATE_LABELS: Record<ScorecardState, string> = {
  draft: 'Draft',
  published: 'Published',
  finalised: 'Finalised',
  restated: 'Restated',
};

/** Only these can be edited or published. */
export const EDITABLE_SCORECARD_STATES: ScorecardState[] = ['draft', 'restated'];

export const ScorecardTargetSchema = z.object({
  metric_key: FieldMetricKeySchema,
  label: z.string(),
  target: z.number(),
  unit: FieldMetricUnitSchema,
  /** Share of the score, out of 100. May carry up to two decimals. */
  weight: z.number(),
  note: z.string().nullable(),
});
export type ScorecardTarget = z.infer<typeof ScorecardTargetSchema>;

/** GET /admin/field-scorecards (paged), and every write's response. */
export const FieldScorecardSchema = z.object({
  id: z.string(),
  field_staff: FieldStaffRefSchema.nullable(),
  asset: FieldAssetRefSchema.nullable(),
  staff_type: FieldStaffTypeSchema,
  year: z.number(),
  month: z.number(),
  timezone: z.string(),
  state: ScorecardStateSchema,
  version: z.number(),
  is_current: z.boolean(),
  is_restatement: z.boolean(),
  /** The reason given for a revision or a restatement. */
  restatement_reason: z.string().nullable(),
  prior_version_id: z.string().nullable(),
  targets: z.array(ScorecardTargetSchema),
  weight_total: z.number(),
  weights_complete: z.boolean(),
  published_at: z.string().nullable(),
  finalised_at: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type FieldScorecard = z.infer<typeof FieldScorecardSchema>;

/* -------------------- request bodies -------------------- */

/** ScorecardTargetDto — never send `unit`; the server fills it from the metric. */
export type ScorecardTargetInput = {
  metric_key: FieldMetricKey;
  target: number;
  weight: number;
  note?: string;
};

/** CreateScorecardDto — always created as a draft. */
export type CreateScorecardPayload = {
  field_staff_id: string;
  asset_id: string;
  year: number;
  month: number;
  timezone?: string;
  targets: ScorecardTargetInput[];
};

/** UpdateScorecardDto — drafts and restatements only. */
export type UpdateScorecardPayload = {
  targets: ScorecardTargetInput[];
};

/** ReviseScorecardDto / RestateScorecardDto */
export type ScorecardReasonPayload = {
  reason: string;
};
