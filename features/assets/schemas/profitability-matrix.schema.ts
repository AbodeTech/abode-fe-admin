import { z } from 'zod';

import { OfferTypeSchema } from './asset.schema';

/* ============================================================
 * GET /admin/assets/:assetId/profitability/matrix — one row per
 * (offer_type, size_id, tenor_months), confirmed field-for-field against
 * `profitability.service.ts`'s `matrix()` on staging. Field names differ
 * deliberately from `ScopeResult` (`revenue`→`sold_value`,
 * `gross_profit`→`forecast_gross_profit`, `net_profit`→
 * `forecast_net_contribution`) — this is the real backend's own naming for
 * the payment-plan matrix, not a mapping this codebase invented.
 * ============================================================ */

export const ProfitabilityMatrixRowSchema = z.object({
  offer_type: OfferTypeSchema,
  size_id: z.string().nullable(),
  tenor_months: z.number().nullable(),
  sold_value: z.number(),
  received: z.number(),
  balance: z.number(),
  /** null when sold_value is 0. */
  collection_efficiency_pct: z.number().nullable(),
  units: z.number(),
  forecast_gross_profit: z.number(),
  allocated_opex: z.number(),
  forecast_net_contribution: z.number(),
  margin_pct: z.number().nullable(),
  complete: z.boolean(),
});
export type ProfitabilityMatrixRow = z.infer<typeof ProfitabilityMatrixRowSchema>;

export const ProfitabilityMatrixSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  rows: z.array(ProfitabilityMatrixRowSchema).default([]),
  as_of: z.string(),
  calculation_version: z.string(),
  complete: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type ProfitabilityMatrix = z.infer<typeof ProfitabilityMatrixSchema>;

/* -------------------- rows for the screen -------------------- */

export type PlanProfitRow = ProfitabilityMatrixRow & {
  /** `null` when the row's size is no longer on the asset (or the sale has no size). */
  size_sqm: number | null;
};

const OFFER_ORDER = OfferTypeSchema.options as readonly string[];

/**
 * The matrix rows, labelled and ordered for display: by product, then size,
 * then tenor (outright first).
 *
 * The backend sends a size's id, not its area, so the area is looked up in
 * the asset's own offers. A row whose size cannot be found keeps `null`.
 * Nothing else is derived: every figure is the backend's.
 */
export function planProfitRows(
  rows: ProfitabilityMatrixRow[],
  offers: { offer_type: string; sizes: { _id: string; size_sqm: number }[] }[]
): PlanProfitRow[] {
  const sqmBySize = new Map(offers.flatMap((offer) => offer.sizes.map((size) => [size._id, size.size_sqm] as const)));

  return rows
    .map((row) => ({ ...row, size_sqm: row.size_id ? (sqmBySize.get(row.size_id) ?? null) : null }))
    .sort(
      (a, b) =>
        OFFER_ORDER.indexOf(a.offer_type) - OFFER_ORDER.indexOf(b.offer_type) ||
        (a.size_sqm ?? Number.POSITIVE_INFINITY) - (b.size_sqm ?? Number.POSITIVE_INFINITY) ||
        (a.tenor_months ?? 0) - (b.tenor_months ?? 0)
    );
}
