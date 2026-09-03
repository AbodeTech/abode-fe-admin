'use client';

import { useQueries } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { AgencyListRowSchema, buildAgencyListParams } from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/* ============================================================
 * Headline agency counts.
 *
 * v2 has no agency dashboard endpoint, so these are counted rather than
 * aggregated: three `limit=1` list calls read `meta.total` off the envelope
 * without transferring any rows. Cheap, and the BE caches each for 30s.
 *
 * v1's other tiles — total sales volume, total commission paid, users under
 * agency — have no v2 source. Sales volume and commission-paid aggregates
 * don't exist on any endpoint, and a platform-wide member count would mean
 * paging every agency's roster. They are deliberately absent rather than
 * shown as zero.
 * ============================================================ */

const COUNT_ONLY = { page: 1, limit: 1 } as const;

export interface AgencyStats {
  total: number;
  active: number;
  suspended: number;
}

export const useAgencyStats = () => {
  const results = useQueries({
    queries: (['all', 'active', 'suspended'] as const).map((bucket) => {
      const filters =
        bucket === 'all' ? { ...COUNT_ONLY } : { ...COUNT_ONLY, status: bucket };

      return {
        queryKey: agencyKeys.list(filters),
        queryFn: () =>
          apiGetPaged('/admin/agencies', AgencyListRowSchema, {
            params: buildAgencyListParams(filters),
          }),
        staleTime: 30_000,
        select: (data: { meta: { total?: number } }) => data.meta.total ?? 0,
      };
    }),
  });

  const [total, active, suspended] = results;

  return {
    data: {
      total: total.data ?? 0,
      active: active.data ?? 0,
      suspended: suspended.data ?? 0,
    } satisfies AgencyStats,
    isLoading: results.some((r) => r.isLoading),
    error: results.find((r) => r.error)?.error ?? null,
  };
};
