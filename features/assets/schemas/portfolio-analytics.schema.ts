import { z } from 'zod';

/* ============================================================
 * Portfolio analytics — GET /admin/assets/analytics/portfolio.
 *
 * Portfolio-wide health + a four-way category breakdown, backing the two
 * banners at the top of the assets list (ticket 17, portfolio half).
 * `developer_plot` is a real category with full metrics, but it is excluded
 * from every portfolio-wide roll-up — admin-arbitrary pricing on a handful of
 * manually-priced plots would otherwise skew numbers every other asset type's
 * real market pricing produces. `excluded_from_rollup` marks exactly that.
 * ============================================================ */

export const ANALYTICS_CATEGORIES = ['flex', 'full-ownership', 'commercial', 'developer_plot'] as const;
export const AnalyticsCategorySchema = z.enum(ANALYTICS_CATEGORIES);
export type AnalyticsCategory = z.infer<typeof AnalyticsCategorySchema>;

export const ANALYTICS_CATEGORY_LABELS: Record<AnalyticsCategory, string> = {
  flex: 'Flex',
  'full-ownership': 'Full ownership',
  commercial: 'Commercial',
  developer_plot: 'Developer plot',
};

export const PortfolioDefaultingSchema = z.object({
  customers: z.number(),
  value_of_defaulted_assets: z.number(),
  amount_paid_by_defaulters: z.number(),
  amount_still_owing: z.number(),
});

export const PortfolioMetricsSchema = z.object({
  total_portfolio_value: z.number(),
  gross_revenue: z.number(),
  total_capacity_sqm: z.number(),
  total_capacity_units: z.number(),
  total_assets: z.number(),
  total_active_assets: z.number(),
  active_plans: z.number(),
  active_customers: z.number(),
  total_money_received: z.number(),
  total_value_sold: z.number(),
  total_sqm_sold: z.number(),
  total_balance_owed: z.number(),
  overall_efficiency: z.number(),
  occupancy_rate: z.number(),
  defaulting: PortfolioDefaultingSchema,
});

export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;

export const AssetCategoryMetricsSchema = z.object({
  category: AnalyticsCategorySchema,
  excluded_from_rollup: z.boolean(),
  total_assets: z.number(),
  active_assets: z.number(),
  gross_revenue: z.number(),
  total_capacity_sqm: z.number(),
  total_capacity_units: z.number(),
  sqm_sold: z.number(),
  value_sold: z.number(),
  money_received: z.number(),
  balance_owed: z.number(),
  collection_efficiency: z.number(),
  occupancy_rate: z.number(),
  active_customers: z.number(),
  active_plans: z.number(),
  defaulting: PortfolioDefaultingSchema,
});

export type AssetCategoryMetrics = z.infer<typeof AssetCategoryMetricsSchema>;

export const AssetInventorySummarySchema = z.object({
  total_assets: z.number(),
  total_worth: z.number(),
  total_flex_assets: z.number(),
  total_flex_worth: z.number(),
  total_full_ownership_assets: z.number(),
  total_full_ownership_worth: z.number(),
  total_commercial_assets: z.number(),
  total_commercial_worth: z.number(),
  total_developer_plot_assets: z.number(),
  total_developer_plot_worth: z.number(),
});

export type AssetInventorySummary = z.infer<typeof AssetInventorySummarySchema>;

export const AssetInventoryDetailSchema = z.object({
  asset_id: z.string(),
  name: z.string().nullable(),
  location: z.string().nullable(),
  available_sizes: z.array(z.number()),
  total_units: z.number(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
});

export type AssetInventoryDetail = z.infer<typeof AssetInventoryDetailSchema>;

export const PortfolioAnalyticsResponseSchema = z.object({
  portfolio: PortfolioMetricsSchema,
  categories: z.array(AssetCategoryMetricsSchema),
  summary: AssetInventorySummarySchema,
  asset_details: z.array(AssetInventoryDetailSchema),
  as_of: z.string(),
});

export type PortfolioAnalyticsResponse = z.infer<typeof PortfolioAnalyticsResponseSchema>;
