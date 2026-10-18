'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  DEFAULT_TOP_LIST_LIMIT,
  TopAssociatesSchema,
} from '../schemas/dashboard-top.schema';
import { dashboardKeys } from './query-keys';

/**
 * GET /admin/dashboard/top-associates?limit=
 *
 * Highest-earning associates by commission actually paid (lifetime).
 */
export function useDashboardTopAssociates(limit = DEFAULT_TOP_LIST_LIMIT) {
  return useQuery({
    queryKey: dashboardKeys.topAssociates(limit),
    queryFn: () =>
      apiGet('/admin/dashboard/top-associates', TopAssociatesSchema, {
        params: { limit },
      }),
  });
}
