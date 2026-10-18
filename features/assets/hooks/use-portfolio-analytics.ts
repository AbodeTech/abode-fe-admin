'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { PortfolioAnalyticsResponseSchema } from '../schemas/portfolio-analytics.schema';
import { assetKeys } from './query-keys';

/**
 * GET /admin/assets/analytics/portfolio — portfolio-wide health plus the
 * flex/full-ownership/commercial/developer_plot breakdown behind the two
 * banners at the top of the assets list. No params; the backend caches the
 * aggregation for 5 minutes, so this is safe to keep at the default
 * `staleTime` without hammering it on every focus refetch.
 */
export const usePortfolioAnalytics = () =>
  useQuery({
    queryKey: assetKeys.portfolioAnalytics(),
    queryFn: () => apiGet('/admin/assets/analytics/portfolio', PortfolioAnalyticsResponseSchema),
    staleTime: 5 * 60 * 1000,
  });
