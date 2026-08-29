'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  DEFAULT_TOP_LIST_LIMIT,
  TopProductsSchema,
} from '../schemas/dashboard-top.schema';
import { dashboardKeys } from './query-keys';

/**
 * GET /admin/dashboard/top-products?limit=
 *
 * Best-selling assets by lifetime plans sold / collected. Never date-filtered.
 */
export function useDashboardTopProducts(limit = DEFAULT_TOP_LIST_LIMIT) {
  return useQuery({
    queryKey: dashboardKeys.topProducts(limit),
    queryFn: () =>
      apiGet('/admin/dashboard/top-products', TopProductsSchema, {
        params: { limit },
      }),
  });
}
