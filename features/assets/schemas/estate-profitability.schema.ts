import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * Estate profitability — GET /admin/assets/:assetId/profitability, the real
 * abode-be-v2 calculation (confirmed field-for-field against
 * `profitability.service.ts`/`profitability.calculator.ts` on staging, PR
 * #82). This replaces the old client-side "accounting basis" toggle
 * (budget/committed/actual/forecast) entirely — the real model recognises
 * exactly one number: an APPROVED incurred/reversal/adjustment event. There
 * is no forecast-vs-actual view switch to reproduce.
 *
 * `ScopeResult` is the one shape reused at every granularity — the asset-wide
 * `summary`, and each row of `by_product`/`by_size` is that same shape plus
 * an identifying key.
 * ============================================================ */

export const ScopeResultSchema = z.object({
  revenue: z.number(),
  received: z.number(),
  direct_cost: z.number(),
  gross_profit: z.number(),
  allocated_opex: z.number(),
  net_profit: z.number(),
  /** null when revenue is 0 — never a fake 0%. */
  margin_pct: z.number().nullable(),
  units: z.number(),
  sqm: z.number(),
  cost_per_total_sqm: z.number().nullable(),
  cost_per_saleable_sqm: z.number().nullable(),
  complete: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type ScopeResult = z.infer<typeof ScopeResultSchema>;

export const ProfitabilityByProductRowSchema = ScopeResultSchema.extend({
  offer_type: OfferTypeSchema,
});
export type ProfitabilityByProductRow = z.infer<typeof ProfitabilityByProductRowSchema>;

export const ProfitabilityBySizeRowSchema = ScopeResultSchema.extend({
  offer_type: OfferTypeSchema,
  size_id: z.string().nullable(),
  size_sqm: z.number().nullable(),
});
export type ProfitabilityBySizeRow = z.infer<typeof ProfitabilityBySizeRowSchema>;

export const CommissionSummarySchema = z.object({
  settled_by_product: z.array(z.object({ offer_type: OfferTypeSchema, amount: z.number() })).default([]),
  settled_total: z.number(),
  awaiting_settlement: z.number(),
});
export type CommissionSummary = z.infer<typeof CommissionSummarySchema>;

/** GET /admin/assets/:assetId/profitability (?as_of=). */
export const EstateProfitabilitySchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  total_land_sqm: z.number().nullable(),
  saleable_sqm: z.number().nullable(),
  summary: ScopeResultSchema,
  by_product: z.array(ProfitabilityByProductRowSchema).default([]),
  by_size: z.array(ProfitabilityBySizeRowSchema).default([]),
  as_of: z.string(),
  commission: CommissionSummarySchema,
  complete: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type EstateProfitability = z.infer<typeof EstateProfitabilitySchema>;
