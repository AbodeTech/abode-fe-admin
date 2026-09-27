import { z } from 'zod';

import { AllocationBasisSchema, ManualShareSchema } from './asset-cost.schema';
import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * POST /admin/assets/:assetId/costs/impact-preview — confirmed
 * field-for-field against `profitability.service.ts`'s `impactPreview()`
 * on staging. Replaces the old estate-wide "preview a draft allocation
 * basis" endpoint: the real one previews a single cost item's proposed
 * sharing/allocation change against CURRENT rules everywhere else — there
 * is no `as_of`/historical variant.
 * ============================================================ */

export const impactPreviewInputSchema = z.object({
  cost_item_id: z.string(),
  allocation_basis: AllocationBasisSchema.optional(),
  applies_to_products: z.array(OfferTypeSchema).optional(),
  excluded_products: z.array(OfferTypeSchema).optional(),
  manual_shares: z.array(ManualShareSchema).optional(),
  is_shared: z.boolean().optional(),
});
export type ImpactPreviewInput = z.infer<typeof impactPreviewInputSchema>;

const ImpactPreviewByProductSchema = z.object({
  by_product: z.array(
    z.object({
      offer_type: OfferTypeSchema,
      direct_cost: z.number(),
      allocated_opex: z.number(),
      net_profit: z.number(),
    })
  ),
  complete: z.boolean(),
});

export const CostImpactPreviewSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  before: ImpactPreviewByProductSchema,
  after: ImpactPreviewByProductSchema,
  changes: z.array(z.object({ offer_type: OfferTypeSchema, net_profit_change: z.number() })).default([]),
  new_warnings: z.array(z.string()).default([]),
});
export type CostImpactPreview = z.infer<typeof CostImpactPreviewSchema>;
