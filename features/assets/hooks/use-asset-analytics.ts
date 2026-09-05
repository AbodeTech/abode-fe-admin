'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  AssetAnalyticsResponseSchema,
  type AnalyticsFilter,
} from '../schemas/asset-analytics.schema';
import { assetKeys } from './query-keys';

export type AssetAnalyticsParams = {
  filter?: AnalyticsFilter;
  /** Required by the BE when `filter` is `custom`; ignored otherwise. */
  startDate?: string | null;
  endDate?: string | null;
  enabled?: boolean;
};

/**
 * GET /admin/assets/:id/analytics — one asset's performance plus the per-size
 * and per-tenor breakdown behind the detail page's Performance tab.
 * `view_asset_analytics`.
 *
 * A `custom` filter with only one end of the range is a 400, so the dates are
 * sent both-or-neither and the filter falls back to `all_time` without them.
 * The BE caches the aggregation, so this is safe at a 5-minute `staleTime` —
 * matching `usePortfolioAnalytics`.
 */
export const useAssetAnalytics = (assetId: string, params?: AssetAnalyticsParams) => {
  const startDate = params?.startDate?.trim() || undefined;
  const endDate = params?.endDate?.trim() || undefined;
  const hasRange = Boolean(startDate && endDate);
  const filter: AnalyticsFilter = params?.filter === 'custom' && hasRange ? 'custom' : 'all_time';

  return useQuery({
    queryKey: assetKeys.analytics(assetId, filter, startDate, endDate),
    enabled: Boolean(assetId) && (params?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      apiGet(`/admin/assets/${assetId}/analytics`, AssetAnalyticsResponseSchema, {
        params: {
          filter,
          ...(filter === 'custom' ? { start_date: startDate, end_date: endDate } : {}),
        },
      }),
  });
};
