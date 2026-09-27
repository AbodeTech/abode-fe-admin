import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';
import { AllocationBasisSchema, CostGroupSchema } from './asset-cost.schema';
import { ScopeResultSchema } from './estate-profitability.schema';

/* ============================================================
 * GET /admin/assets/:assetId/profitability/drill-down — "show your work"
 * for the estate profitability card, confirmed field-for-field against
 * `profitability.service.ts`'s `drillDown()` on staging.
 * ============================================================ */

export const DrillDownRevenueRowSchema = z.object({
  offer_type: OfferTypeSchema,
  size_id: z.string().nullable(),
  tenor_months: z.number().nullable(),
  sold_value: z.number(),
  received: z.number(),
  units: z.number(),
  sqm: z.number(),
});
export type DrillDownRevenueRow = z.infer<typeof DrillDownRevenueRowSchema>;

export const DrillDownCostShareSchema = z.object({
  offer_type: OfferTypeSchema,
  amount: z.number(),
  share_pct: z.number(),
});

export const DrillDownCostRowSchema = z.object({
  cost_item_id: z.string(),
  name: z.string(),
  group: CostGroupSchema,
  group_label: z.string(),
  amount: z.number().nullable(),
  basis: AllocationBasisSchema.nullable(),
  included_products: z.array(z.string()).default([]),
  excluded_products: z.array(z.string()).default([]),
  shares: z.array(DrillDownCostShareSchema).default([]),
  counted: z.boolean(),
  warning: z.string().nullable(),
});
export type DrillDownCostRow = z.infer<typeof DrillDownCostRowSchema>;

export const ProfitabilityDrillDownSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  revenue_rows: z.array(DrillDownRevenueRowSchema).default([]),
  cost_rows: z.array(DrillDownCostRowSchema).default([]),
  formula: z.object({
    gross_profit: z.string(),
    net_profit: z.string(),
    margin_pct: z.string(),
    cost_per_total_sqm: z.string(),
    cost_per_saleable_sqm: z.string(),
  }),
  subtotals: ScopeResultSchema,
  as_of: z.string(),
  complete: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type ProfitabilityDrillDown = z.infer<typeof ProfitabilityDrillDownSchema>;
