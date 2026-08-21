import { z } from 'zod';

/* ============================================================
 * GET /admin/dashboard/kpis — AdminDashboard KpiSnapshotDto
 *
 * Optional `from` / `to` (ISO dates). Omit both for lifetime figures.
 * Period-scoped fields honour the range; lifetime fields ignore it.
 * Amounts are decimal naira.
 * ============================================================ */

export const RevenueByAssetTypeSchema = z.object({
  flex: z.number(),
  full_ownership: z.number(),
  commercial: z.number(),
  developer_plot: z.number(),
});

export const DashboardKpisSchema = z.looseObject({
  period_revenue: z.number(),
  inflow: z.number(),
  outflow: z.number(),
  period_new_users: z.number(),
  period_new_payment_plans: z.number(),
  admin_created_plans_in_period: z.number(),
  revenue_by_asset_type: RevenueByAssetTypeSchema,

  total_users: z.number(),
  associate_users: z.number(),
  associate_pro_users: z.number(),
  total_assets: z.number(),
  default_users: z.number(),
  suspended_users: z.number(),
  suspended_payment_plans: z.number(),
  wallet_balances_held_total: z.number(),
  total_payment_plans: z.number(),
  admin_created_plans_count: z.number(),
  closed_plans_count: z.number(),

  period_scoped: z.array(z.string()).optional(),
  lifetime: z.array(z.string()).optional(),
  delta_pct: z.record(z.string(), z.number().nullable()).nullable().optional(),
});

export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;

export type DashboardKpiRange = {
  from?: string | null;
  to?: string | null;
};
