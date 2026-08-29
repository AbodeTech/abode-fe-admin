'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { RequestStatisticsSchema } from '../schemas/request.schema';
import { requestKeys, type RequestStatsFilters } from './query-keys';

/**
 * GET /admin/requests/statistics — the dashboard's 19 aggregates.
 *
 * Cached 30s server-side; date_from/date_to narrow it. `submitted_requests`
 * is what the cards label "Pending".
 */
export const useRequestStats = (filters?: RequestStatsFilters) =>
  useQuery({
    queryKey: requestKeys.stats(filters),
    queryFn: () =>
      apiGet('/admin/requests/statistics', RequestStatisticsSchema, {
        params: { date_from: filters?.date_from, date_to: filters?.date_to },
      }),
  });
