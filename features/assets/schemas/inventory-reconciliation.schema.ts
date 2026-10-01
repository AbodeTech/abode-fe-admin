import { z } from 'zod';

/* ============================================================
 * Physical (Block/Plot) vs. commercial (Analytics) reconciliation, joined by
 * `size` — the one field both domains already share. See
 * lib/mocks/routes/inventory-reconciliation.ts's header for why `size` is
 * usable as a join key and what it does NOT resolve (this codebase's own
 * documented "four non-reconciling sqm concepts," land-configuration.schema.ts).
 *
 * This is a genuinely partial reconciliation — by size only, not by product
 * (no product dimension exists on either side of this join). Deferred:
 * per-product reconciliation, which needs the not-yet-decided sqm-allocation
 * architecture already flagged in the Costs & Profitability epic's roadmap.
 * ============================================================ */

export const AllocatedPlotHolderSchema = z.object({
  plot_id: z.string(),
  plot_name: z.string(),
  customer_name: z.string().nullable(),
  attributable_value: z.number().nullable(),
});

export type AllocatedPlotHolder = z.infer<typeof AllocatedPlotHolderSchema>;

export const PhysicalSizeStatusSchema = z.object({
  allocated_count: z.number(),
  available_count: z.number(),
  /** "Separate system allocation from ground confirmation" — a subset of allocated_count, never larger than it. */
  ground_confirmed_count: z.number(),
  total_sqm: z.number(),
  allocated_holders: z.array(AllocatedPlotHolderSchema),
});

export type PhysicalSizeStatus = z.infer<typeof PhysicalSizeStatusSchema>;

export const CommercialSizeStatusSchema = z.object({
  units_sold: z.number(),
  sqm_sold: z.number(),
  sold_value: z.number(),
  defaulted_count: z.number(),
  defaulted_value: z.number(),
});

export type CommercialSizeStatus = z.infer<typeof CommercialSizeStatusSchema>;

/**
 * `code` is what "Make Review issues actionable" hangs a CTA off — plain
 * strings gave the FE nothing to key an action on besides fragile substring
 * matching. `NO_PHYSICAL_PLOTS` and `OVERSOLD` both point at the same fix
 * (record more plots), so both get the panel's "Manage plots" action;
 * `NO_SALES_DATA` has no admin action available from this panel.
 */
export const RECONCILIATION_EXCEPTION_CODES = ['NO_SALES_DATA', 'NO_PHYSICAL_PLOTS', 'OVERSOLD'] as const;
export const ReconciliationExceptionCodeSchema = z.enum(RECONCILIATION_EXCEPTION_CODES);
export type ReconciliationExceptionCode = z.infer<typeof ReconciliationExceptionCodeSchema>;

export const ReconciliationExceptionSchema = z.object({
  code: ReconciliationExceptionCodeSchema,
  message: z.string(),
});

export type ReconciliationException = z.infer<typeof ReconciliationExceptionSchema>;

/** One size category — `physical`/`commercial` are null when that side has nothing recorded at this size, never a fake zero. */
export const SizeReconciliationRowSchema = z.object({
  size: z.number(),
  physical: PhysicalSizeStatusSchema.nullable(),
  commercial: CommercialSizeStatusSchema.nullable(),
  /** Computed once, server-side, so the FE never re-derives a discrepancy that should be authoritative. */
  exceptions: z.array(ReconciliationExceptionSchema),
});

export type SizeReconciliationRow = z.infer<typeof SizeReconciliationRowSchema>;

/**
 * "Reconcile the whole estate" — an aggregate rollup across every size row,
 * not a new join. Still deliberately by-size under the hood (see this file's
 * header comment); this just sums what's already reconciled per size into
 * one estate-wide answer, the same way a table footer sums its own rows.
 */
export const EstateReconciliationTotalsSchema = z.object({
  physical_plot_count: z.number(),
  physical_sqm: z.number(),
  ground_confirmed_count: z.number(),
  commercial_units_sold: z.number(),
  commercial_sqm_sold: z.number(),
  commercial_sold_value: z.number(),
  exception_count: z.number(),
});

export type EstateReconciliationTotals = z.infer<typeof EstateReconciliationTotalsSchema>;

export const InventoryReconciliationSchema = z.object({
  asset_id: z.string(),
  as_of: z.string(),
  estate_totals: EstateReconciliationTotalsSchema,
  rows: z.array(SizeReconciliationRowSchema),
  /** Asset-wide, e.g. "This estate has no blocks recorded at all." */
  warnings: z.array(z.string()),
});

export type InventoryReconciliation = z.infer<typeof InventoryReconciliationSchema>;
