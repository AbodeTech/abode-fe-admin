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

/* -------------------- direct vs shared cost, per product -------------------- */

export type ProductCostSplit = { direct: number; shared: number };

/**
 * Splits each product's cost into what it carries alone and what it shares.
 *
 * Every counted cost row lists the products it was charged to (`shares`). A
 * row charged to ONE product is that product's direct cost. A row split
 * across SEVERAL products (a road, a perimeter fence, estate-wide overhead)
 * is a shared cost, and each product's slice of it is its shared cost.
 *
 * `GET .../profitability`'s own `direct_cost` / `allocated_opex` pair is a
 * different cut — by cost GROUP (operating expenses vs everything else), so a
 * shared road sits inside `direct_cost` there. The two cuts add up to the
 * same total per product; this one is the split the asset-detail design
 * draws. Rows the backend did not count (no amount, no split rule) have no
 * shares and so contribute nothing, exactly as in the backend's totals.
 */
export function costSplitByProduct(costRows: DrillDownCostRow[]): Map<string, ProductCostSplit> {
  const split = new Map<string, ProductCostSplit>();

  for (const row of costRows) {
    if (!row.counted) continue;
    const bucket: keyof ProductCostSplit = row.shares.length > 1 ? 'shared' : 'direct';
    for (const share of row.shares) {
      const current = split.get(share.offer_type) ?? { direct: 0, shared: 0 };
      current[bucket] += share.amount;
      split.set(share.offer_type, current);
    }
  }

  return split;
}

/* -------------------- the calculation, arranged for reading -------------------- */

export type RevenueByProduct = {
  offer_type: DrillDownRevenueRow['offer_type'];
  sold_value: number;
  received: number;
  units: number;
  /** The product's own lines (one per size and tenor), largest first. */
  lines: DrillDownRevenueRow[];
};

export type CalculationBreakdown = {
  revenue: RevenueByProduct[];
  /** Counted costs charged to exactly one product, largest first. */
  direct: DrillDownCostRow[];
  /** Counted costs split across several products, largest first. */
  shared: DrillDownCostRow[];
  /** Costs the backend left out of the profit figure, each with its `warning` saying why. */
  uncounted: DrillDownCostRow[];
  directTotal: number;
  sharedTotal: number;
};

/**
 * Re-arranges the drill-down for the calculation drawer without changing a
 * single figure: sale lines are gathered under their product, and cost items
 * are sorted into the same direct / shared buckets `costSplitByProduct` uses
 * (plus the ones not counted at all). The two totals are sums of the amounts
 * actually charged (`shares`), so they always agree with the per-product
 * split and with the backend's `direct_cost + allocated_opex`.
 */
export function calculationBreakdown(drillDown: Pick<ProfitabilityDrillDown, 'revenue_rows' | 'cost_rows'>): CalculationBreakdown {
  const byProduct = new Map<string, RevenueByProduct>();
  for (const row of drillDown.revenue_rows) {
    const current =
      byProduct.get(row.offer_type) ??
      ({ offer_type: row.offer_type, sold_value: 0, received: 0, units: 0, lines: [] } satisfies RevenueByProduct);
    current.sold_value += row.sold_value;
    current.received += row.received;
    current.units += row.units;
    current.lines.push(row);
    byProduct.set(row.offer_type, current);
  }
  const revenue = [...byProduct.values()].sort((a, b) => b.sold_value - a.sold_value);
  for (const product of revenue) product.lines.sort((a, b) => b.sold_value - a.sold_value);

  const charged = (row: DrillDownCostRow) => row.shares.reduce((sum, share) => sum + share.amount, 0);
  const largestFirst = (a: DrillDownCostRow, b: DrillDownCostRow) => charged(b) - charged(a);

  const counted = drillDown.cost_rows.filter((row) => row.counted);
  const direct = counted.filter((row) => row.shares.length <= 1).sort(largestFirst);
  const shared = counted.filter((row) => row.shares.length > 1).sort(largestFirst);

  return {
    revenue,
    direct,
    shared,
    uncounted: drillDown.cost_rows.filter((row) => !row.counted),
    directTotal: direct.reduce((sum, row) => sum + charged(row), 0),
    sharedTotal: shared.reduce((sum, row) => sum + charged(row), 0),
  };
}
