'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  WithdrawalStatsSchema,
  type WithdrawalStatsFilters,
} from '../schemas/withdrawal.schema';
import { withdrawalKeys } from './query-keys';

/**
 * GET /admin/withdrawals/stats — the queue's summary cards.
 *
 * Global by design: it takes a date range and nothing else, so these numbers
 * describe the whole queue rather than the filtered table beneath them.
 *
 * A failed aggregation returns 500 with a correlation id. The strip is hidden
 * on error rather than retried into a spinner — the table is the page's real
 * content and must not be blocked by a summary.
 */
export const useWithdrawalStats = (filters?: WithdrawalStatsFilters) =>
  useQuery({
    queryKey: [...withdrawalKeys.all, 'stats', filters ?? {}] as const,
    queryFn: () =>
      apiGet('/admin/withdrawals/stats', WithdrawalStatsSchema, {
        params: {
          start_date: filters?.start_date || undefined,
          end_date: filters?.end_date || undefined,
        },
      }),
    retry: false,
    staleTime: 60 * 1000,
  });
