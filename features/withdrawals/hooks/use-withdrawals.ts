'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { WithdrawalSchema } from '../schemas/withdrawal.schema';
import { withdrawalKeys, type WithdrawalListFilters } from './query-keys';

/** The BE defaults to 20; kept explicit so the pagination maths agree. */
export const DEFAULT_WITHDRAWAL_LIMIT = 20;

/**
 * GET /admin/withdrawals — the review queue, newest first.
 *
 * No search (ticket 14-family). Refs may be bare ObjectIds or populated
 * objects (ticket 13); the schema accepts both.
 */
export const useWithdrawals = (filters?: WithdrawalListFilters) => {
  const { page = 1, limit = DEFAULT_WITHDRAWAL_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: withdrawalKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/withdrawals', WithdrawalSchema, {
        params: {
          page,
          limit,
          admin_status: rest.admin_status,
          payment_provider: rest.payment_provider,
        },
      }),
  });
};
