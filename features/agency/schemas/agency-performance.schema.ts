import { z } from 'zod';

/**
 * Proposed agency aggregates (Admin v2 — Backend Requirements, items 7–8).
 * Neither endpoint exists on today's BE; the screens that use them are gated
 * by `agency_sales` / `agency_stats` in lib/backend-ready.ts.
 */

/** `GET /admin/agencies/:agency_id/stats?start_date&end_date`. Null = not computable. */
export const AgencyPerformanceSchema = z.object({
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  sales_value: z.number().nullable(),
  amount_received: z.number().nullable(),
  outstanding: z.number().nullable(),
  sqm_sold: z.number().nullable(),
  units_sold: z.number().nullable(),
  buyers: z.number().nullable(),
  commission_paid: z.number().nullable(),
  commission_projected: z.number().nullable(),
  member_count: z.number().nullable(),
  active_members: z.number().nullable(),
});
export type AgencyPerformance = z.infer<typeof AgencyPerformanceSchema>;

/**
 * One row of `GET /admin/sales/analytics/by-asset?agency_id=` — the land this
 * agency's clients bought. Same row the BE returns for the whole platform.
 */
export const AgencyInventoryRowSchema = z.object({
  asset_id: z.string(),
  asset_name: z.string().nullable(),
  asset_type: z.string().nullable(),
  asset_location: z.string().nullable(),
  expected_amount: z.number(),
  total_received: z.number(),
  outstanding_balance: z.number(),
  sqm_sold: z.number(),
  total_buyers: z.number(),
});
export type AgencyInventoryRow = z.infer<typeof AgencyInventoryRowSchema>;
