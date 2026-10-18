'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  DashboardKpisSchema,
  type DashboardKpiRange,
} from '../schemas/dashboard-kpi.schema';
import { dashboardKeys } from './query-keys';

/**
 * GET /admin/dashboard/kpis?from=&to=
 *
 * Requires `view_dashboard`. Pass both `from` and `to`, or neither.
 * Maps from the page's `start_date` / `end_date` query params.
 */
export function useDashboardKpis(range?: DashboardKpiRange) {
  const from = range?.from ?? undefined;
  const to = range?.to ?? undefined;

  return useQuery({
    queryKey: dashboardKeys.kpis({ from, to }),
    queryFn: () =>
      apiGet('/admin/dashboard/kpis', DashboardKpisSchema, {
        params: { from, to },
      }),
  });
}
