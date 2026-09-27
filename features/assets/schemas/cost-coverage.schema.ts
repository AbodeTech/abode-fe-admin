import { z } from 'zod';

import { AllocationBasisSchema, CostGroupSchema } from './asset-cost.schema';

/* ============================================================
 * GET /admin/assets/:assetId/costs/coverage — "how much of this estate cost
 * is actually known", confirmed field-for-field against
 * `profitability.service.ts`'s `coverage()` on staging.
 * ============================================================ */

export const CostCoverageItemSchema = z.object({
  cost_item_id: z.string(),
  name: z.string(),
  group: CostGroupSchema,
  is_shared: z.boolean(),
  allocation_basis: AllocationBasisSchema.nullable(),
  recognised_cost: z.number(),
  stages_recorded: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  complete: z.boolean(),
});
export type CostCoverageItem = z.infer<typeof CostCoverageItemSchema>;

export const CostCoverageSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  items: z.array(CostCoverageItemSchema).default([]),
  totals: z.object({
    items: z.number(),
    complete: z.number(),
    incomplete: z.number(),
    recognised_cost: z.number(),
    entries_awaiting_approval: z.number(),
    entries_without_an_amount: z.number(),
  }),
  complete: z.boolean(),
});
export type CostCoverage = z.infer<typeof CostCoverageSchema>;
