import { z } from 'zod';

/* ============================================================
 * Per-asset analytics — GET /admin/assets/:id/analytics.
 *
 * One asset's sale-through, arrears position and the per-size / per-tenor
 * breakdown behind the detail page's Performance tab (ticket 17b, now live).
 * Transcribed from abode-be-v2 `asset-analytics/dto/asset-analytics-responses.dto.ts`
 * (`AssetAnalyticsResponseDto`) and `asset-analytics-requests.dto.ts`.
 *
 * `filter=custom` narrows which plans are counted by `start_date`/`end_date`;
 * `active_customers` and `total_customers` stay all-time regardless (§7.4 on
 * the BE), so the customer figures do not move when the date range does.
 *
 * Amounts are decimal naira; rates are percentages (0-100), not fractions.
 * ============================================================ */

export const ANALYTICS_FILTERS = ['all_time', 'custom'] as const;
export const AnalyticsFilterSchema = z.enum(ANALYTICS_FILTERS);
export type AnalyticsFilter = z.infer<typeof AnalyticsFilterSchema>;

/**
 * Shared by the defaulting / terminated blocks at every level. `value` is the
 * asset value tied up in those plans; `amount_owing` is what is still
 * unrecovered on them.
 */
export const LifecycleBucketSchema = z.object({
  customers: z.number(),
  plans: z.number(),
  value: z.number(),
  amount_paid: z.number(),
  amount_owing: z.number(),
});

export type LifecycleBucket = z.infer<typeof LifecycleBucketSchema>;

/** One (size, tenor) row inside its size group. `month_subscription` 0 = outright. */
export const AssetSizePlanBreakdownSchema = z.object({
  month_subscription: z.number(),
  plan_count: z.number(),
  units_sold: z.number(),
  sqm_sold: z.number(),
  sold_value: z.number(),
  money_received: z.number(),
  balance_owed: z.number(),
  /** This row's share of the size's starting value (§7.2). */
  efficiency: z.number(),
  defaulting: LifecycleBucketSchema,
  terminated: LifecycleBucketSchema,
});

export type AssetSizePlanBreakdown = z.infer<typeof AssetSizePlanBreakdownSchema>;

/**
 * One size, carrying the capacity figures its tenor rows are measured against.
 * `start_value`, `sqm_remaining` and `capacity_*` exist only at this level —
 * there is no per-tenor equivalent, so the Performance matrix shows them on
 * the size row and not on the plan rows beneath it.
 */
export const AssetSizePlanGroupSchema = z.object({
  size: z.number(),
  start_value: z.number(),
  capacity_sqm: z.number(),
  capacity_units: z.number(),
  units_sold: z.number(),
  sqm_sold: z.number(),
  sqm_remaining: z.number(),
  sold_value: z.number(),
  efficiency: z.number(),
  plans: z.array(AssetSizePlanBreakdownSchema),
});

export type AssetSizePlanGroup = z.infer<typeof AssetSizePlanGroupSchema>;

export const AssetAnalyticsResponseSchema = z.object({
  asset_id: z.string(),
  asset_name: z.string().nullable(),
  location: z.string().nullable(),

  total_inventory_value: z.number(),
  total_realised: z.number(),
  remaining_value: z.number(),
  total_value_sold: z.number(),
  balance_owed: z.number(),

  total_capacity_sqm: z.number(),
  total_capacity_units: z.number(),
  sqm_sold: z.number(),
  sqm_remaining: z.number(),

  efficiency_rate: z.number(),
  occupancy_rate: z.number(),

  total_plans: z.number(),
  active_plans: z.number(),
  /** All-time — never narrowed by the date filter. */
  active_customers: z.number(),
  total_customers: z.number(),

  defaulting: LifecycleBucketSchema,
  terminated: LifecycleBucketSchema,

  size_plan_breakdown: z.array(AssetSizePlanGroupSchema),

  filter: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  as_of: z.string(),
});

export type AssetAnalyticsResponse = z.infer<typeof AssetAnalyticsResponseSchema>;

/** Tenor label for a plan row — the BE sends the month count, not a name. */
export function planTenorLabel(monthSubscription: number): string {
  if (!monthSubscription) return 'Outright';
  return `${monthSubscription} month${monthSubscription === 1 ? '' : 's'}`;
}
