import { useQuery } from '@tanstack/react-query';

import { apiGet, apiGetPaged } from '@/lib/api-client';

import { SalesByAssetRowSchema, SalesKpisSchema, SalesTimelineBucketSchema } from '../schemas/sales-analytics.schema';
import { salesAnalyticsKeys } from './query-keys';

export interface SalesAnalyticsFilters {
  startDate?: string | null;
  endDate?: string | null;
  assetType?: string | null;
  /** Maps to the BE's `asset_location` param. */
  location?: string | null;
  sourceType?: string | null;
}

const toOptional = (value?: string | null) => {
  if (!value || value === 'all') return undefined;
  return value;
};

const buildParams = (filters?: SalesAnalyticsFilters) => ({
  start_date: toOptional(filters?.startDate),
  end_date: toOptional(filters?.endDate),
  asset_type: toOptional(filters?.assetType),
  asset_location: toOptional(filters?.location),
  source_type: toOptional(filters?.sourceType),
});

/**
 * GET /admin/sales/analytics/kpis — top-level KPI strip. `view_sales_analytics`.
 * Server-cached 15 minutes per (start_date × end_date × asset_type ×
 * asset_location × source_type).
 */
export const useSalesAnalyticsKpis = (filters?: SalesAnalyticsFilters) => {
  return useQuery({
    queryKey: salesAnalyticsKeys.kpis(filters),
    queryFn: () => apiGet('/admin/sales/analytics/kpis', SalesKpisSchema, { params: buildParams(filters) }),
  });
};

/** GET /admin/sales/analytics/by-asset — ranked by expected amount desc, capped at 500 rows. */
export const useSalesAssetBreakdown = (filters?: SalesAnalyticsFilters) => {
  return useQuery({
    queryKey: salesAnalyticsKeys.assetBreakdown(filters),
    queryFn: () =>
      apiGetPaged('/admin/sales/analytics/by-asset', SalesByAssetRowSchema, { params: buildParams(filters) }),
    select: (data) => data.items,
  });
};

/** GET /admin/sales/analytics/timeline — rolling 12-month (or explicit range) chart. */
export const useSalesMonthlyTimeline = (filters?: SalesAnalyticsFilters) => {
  return useQuery({
    queryKey: salesAnalyticsKeys.monthlyTimeline(filters),
    queryFn: () =>
      apiGetPaged('/admin/sales/analytics/timeline', SalesTimelineBucketSchema, { params: buildParams(filters) }),
    select: (data) => data.items,
  });
};
