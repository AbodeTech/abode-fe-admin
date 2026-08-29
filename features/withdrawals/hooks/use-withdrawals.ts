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
 * Filtering is all server-side: `search`, `admin_status`, `payment_provider`.
 * `search` resolves through `userRepo.findIdsBySearch`, a regex over the
 * requester's `firstName`, `lastName`, `email` and `userName` — confirmed
 * against the deployed spec on 2026-08-13. It matches the **requester only**,
 * never the destination account name.
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
          search: rest.search || undefined,
          admin_status: rest.admin_status,
          payment_provider: rest.payment_provider,
        },
      }),
  });
};
