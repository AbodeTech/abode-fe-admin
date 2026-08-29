import { z } from 'zod';

/* ============================================================
 * GET /admin/dashboard/kpis — AdminDashboard KpiSnapshotDto
 *
 * Optional `from` / `to` (ISO dates). Omit both for lifetime figures.
 * Amounts are decimal naira.
 *
 * Every tile carries its own scope. Period-scoped tiles honour the date range
 * and carry `delta_pct`; lifetime tiles ignore it and have no delta field at
 * all — so a growth badge cannot be attached to an all-time figure.
 * ============================================================ */

/** A tile that honours the date filter. `delta_pct` is null when there is no
 *  comparable prior window (no range set, or the prior window was zero). */
export const PeriodScopedKpiSchema = z.object({
  value: z.number(),
  delta_pct: z.number().nullable(),
});

/** A tile that ignores the date filter. Has no delta by construction. */
export const LifetimeKpiSchema = z.object({
  value: z.number(),
});

export const RevenueByAssetTypeSchema = z.object({
  flex: z.number(),
  full_ownership: z.number(),
  commercial: z.number(),
  developer_plot: z.number(),
});

export const DashboardKpisSchema = z.looseObject({
  // Period-scoped
  period_revenue: PeriodScopedKpiSchema,
  inflow: PeriodScopedKpiSchema,
  outflow: PeriodScopedKpiSchema,
  period_new_users: PeriodScopedKpiSchema,
  period_new_payment_plans: PeriodScopedKpiSchema,
  admin_created_plans_in_period: PeriodScopedKpiSchema,

  // A breakdown, not a tile — honours the filter but carries no badge.
  revenue_by_asset_type: RevenueByAssetTypeSchema,

  // Lifetime
  total_users: LifetimeKpiSchema,
  associate_users: LifetimeKpiSchema,
  associate_pro_users: LifetimeKpiSchema,
  total_assets: LifetimeKpiSchema,
  default_users: LifetimeKpiSchema,
  suspended_users: LifetimeKpiSchema,
  suspended_payment_plans: LifetimeKpiSchema,
  wallet_balances_held_total: LifetimeKpiSchema,
  total_payment_plans: LifetimeKpiSchema,
  admin_created_plans_count: LifetimeKpiSchema,
  closed_plans_count: LifetimeKpiSchema,
});

export type PeriodScopedKpi = z.infer<typeof PeriodScopedKpiSchema>;
export type LifetimeKpi = z.infer<typeof LifetimeKpiSchema>;
export type DashboardKpis = z.infer<typeof DashboardKpisSchema>;

export type DashboardKpiRange = {
  from?: string | null;
  to?: string | null;
};
