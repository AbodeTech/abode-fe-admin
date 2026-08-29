import { z } from 'zod';

/* ============================================================
 * Sales analytics (KPIs / per-asset breakdown / monthly timeline).
 *
 * Confirmed against abode-be-v2's sales module on `origin/staging`
 * (2026-08-29) — `sales.controller.ts` / `sales.repository.ts` /
 * `dto/sales-query.dto.ts`. Duplicated from `features/sales/schemas` rather
 * than imported: features stay cross-import-free per CLAUDE.md, and the
 * `sales` and `analytics` features are independently migrated modules that
 * happen to read the same BE resource.
 * ============================================================ */

export const SalesPaymentHealthSchema = z.object({
  completed: z.number(),
  defaulted: z.number(),
  terminated: z.number(),
});

/** GET /admin/sales/analytics/kpis — every Naira field is revenue-eligible only (S-1b/S-1e). */
export const SalesKpisSchema = z.object({
  total_sales_value: z.number(),
  expected_amount: z.number(),
  total_received: z.number(),
  outstanding_balance: z.number(),
  sqm_sold: z.number(),
  unique_buyers: z.number(),
  unique_salespersons: z.number(),
  completed_payments: z.number(),
  payment_health: SalesPaymentHealthSchema,
  active_transactions: z.number(),
});

export type SalesKpis = z.infer<typeof SalesKpisSchema>;

/** GET /admin/sales/analytics/by-asset — ranked by expected_amount desc, capped at 500. */
export const SalesByAssetRowSchema = z.object({
  asset_id: z.string(),
  asset_name: z.string().nullable(),
  asset_type: z.string().nullable(),
  asset_location: z.string().nullable(),
  expected_amount: z.number(),
  total_received: z.number(),
  outstanding_balance: z.number(),
  sqm_sold: z.number(),
  total_buyers: z.number(),
  payment_health: SalesPaymentHealthSchema,
});

export type SalesByAssetRow = z.infer<typeof SalesByAssetRowSchema>;

/**
 * GET /admin/sales/analytics/timeline bucket — one per month.
 * `expected_revenue` is cumulative across buckets on the BE (matches v1
 * behavior, per a code comment in `sales.service.ts`), not a per-month figure.
 */
export const SalesTimelineBucketSchema = z.object({
  month: z.string(),
  expected_revenue: z.number(),
  total_due: z.number(),
  total_received: z.number(),
  active_transactions: z.number(),
  missed_payment_count: z.number(),
  defaulted_count: z.number(),
});

export type SalesTimelineBucket = z.infer<typeof SalesTimelineBucketSchema>;
