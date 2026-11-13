'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { UpgradeStatsSchema } from '../schemas/upgrade.schema';
import { upgradeKeys, type UpgradeListFilters } from './query-keys';

/**
 * GET /admin/referrals/upgrades/stats — the queue's summary cards.
 *
 * Unlike the withdrawal stats, these follow the table: the same search, status,
 * payment method, tier and date range. Paging is the only filter left out.
 *
 * The strip is hidden on error rather than retried into a spinner — the table
 * is the page's real content and must not be blocked by a summary.
 */
export const useUpgradeStats = (filters?: Omit<UpgradeListFilters, 'page' | 'limit'>) => {
  const rest = filters ?? {};

  return useQuery({
    queryKey: upgradeKeys.stats(rest),
    queryFn: () =>
      apiGet('/admin/referrals/upgrades/stats', UpgradeStatsSchema, {
        params: {
          search: rest.search || undefined,
          status: rest.status,
          payment_method: rest.payment_method,
          to_tier: rest.to_tier,
          start_date: rest.start_date || undefined,
          end_date: rest.end_date || undefined,
        },
      }),
    retry: false,
    staleTime: 60 * 1000,
  });
};
