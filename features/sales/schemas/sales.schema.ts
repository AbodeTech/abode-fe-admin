import { z } from 'zod';

/* ============================================================
 * Sales.
 *
 * Confirmed against abode-be-v2's sales module on `origin/staging`
 * (2026-08-29) — read directly from `sales.controller.ts` /
 * `sales.service.ts` / `sales.repository.ts` / `dto/sales-query.dto.ts`,
 * since that branch isn't deployed to the environment this app talks to
 * yet. Re-check against a live call once it ships.
 * ============================================================ */

export const SALES_ASSET_TYPES = ['flex', 'full-ownership', 'commercial', 'developer_plot'] as const;
export const SalesAssetTypeSchema = z.enum(SALES_ASSET_TYPES);
export type SalesAssetType = z.infer<typeof SalesAssetTypeSchema>;

export const SALES_SOURCE_TYPES = [
  'original_purchase',
  'marketplace_resale',
  'close_and_relocate',
] as const;
export const SalesSourceTypeSchema = z.enum(SALES_SOURCE_TYPES);
export type SalesSourceType = z.infer<typeof SalesSourceTypeSchema>;

export const SALES_PLAN_STATUSES = ['active', 'suspended', 'defaulted', 'closed', 'completed'] as const;
export const SalesPlanStatusSchema = z.enum(SALES_PLAN_STATUSES);
export type SalesPlanStatus = z.infer<typeof SalesPlanStatusSchema>;

export const SALES_ALLOCATION_STATUSES = ['pending', 'allocated', 'released'] as const;
export const SalesAllocationStatusSchema = z.enum(SALES_ALLOCATION_STATUSES);
export type SalesAllocationStatus = z.infer<typeof SalesAllocationStatusSchema>;

/**
 * `GET /admin/sales` row — `SalesListRowDto` in `sales.controller.ts`.
 * `admin_creation_subtype` is only present on `created_by_admin` rows; the FE
 * uses it to explain why a row is excluded from the dashboard/analytics
 * totals (gift | migration | compensation | relocation_target don't count —
 * see the revenue-eligibility note on the dashboard/KPI schemas below).
 */
export const SalesRowSchema = z.object({
  id: z.string(),
  buyer: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  referrer: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .nullable(),
  agency: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  asset: z.object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    type: z.string().nullable(),
    location: z.string().nullable(),
  }),
  size: z.number().nullable(),
  no_of_units: z.number(),
  price: z.number(),
  amount_paid: z.number(),
  balance: z.number(),
  default_amount: z.number(),
  doc_price: z.number().nullable(),
  doc_amount_paid: z.number(),
  month_subscription: z.number(),
  month_remaining: z.number(),
  payment_completion_percentage: z.number(),
  start_date: z.string().nullable(),
  next_date_of_payment: z.string().nullable(),
  allocation_status: z.string(),
  plan_status: SalesPlanStatusSchema,
  is_defaulted: z.boolean(),
  has_defaulted_ever: z.boolean(),
  is_suspended: z.boolean(),
  source_type: SalesSourceTypeSchema,
  created_by_admin: z.boolean(),
  admin_creation_subtype: z.string().nullable().optional(),
  originated_from_close_relocate: z.boolean(),
  created_at: z.string(),
});

export type SalesRow = z.infer<typeof SalesRowSchema>;

/** `GET /admin/sales/dashboard` — one of the four cards. */
export const SalesDashboardCardSchema = z.object({
  total: z.number(),
  received: z.number(),
  outstanding: z.number(),
  received_percentage: z.number(),
});

export type SalesDashboardCard = z.infer<typeof SalesDashboardCardSchema>;

export const SalesDashboardResponseSchema = z.object({
  overall: SalesDashboardCardSchema,
  flex: SalesDashboardCardSchema,
  full_ownership: SalesDashboardCardSchema,
  commercial: SalesDashboardCardSchema,
  as_of: z.string(),
});

export type SalesDashboardResponse = z.infer<typeof SalesDashboardResponseSchema>;

/**
 * `GET /admin/sales/analytics/kpis` — top-level KPI strip. Every Naira-
 * weighted field here excludes developer plots (unconditionally) and
 * non-revenue admin-created subtypes (gift/migration/compensation/
 * relocation_target) — same `revenueEligibleMatch()` the dashboard cards use.
 */
export const SalesPaymentHealthSchema = z.object({
  completed: z.number(),
  defaulted: z.number(),
  terminated: z.number(),
});

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

/** `GET /admin/sales/analytics/by-asset` row — ranked by expected_amount desc. */
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
 * `GET /admin/sales/analytics/timeline` bucket — one per month. Note
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
