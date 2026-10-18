'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { UpgradeSchema } from '../schemas/upgrade.schema';
import { upgradeKeys, type UpgradeListFilters } from './query-keys';

export const DEFAULT_UPGRADE_LIMIT = 20;

/**
 * GET /admin/referrals/upgrades — the approval queue, newest first.
 *
 * All filtering is server-side: `search`, `status`, `payment_method`, `to_tier`.
 * `search` matches the applicant's name, email or username (ticket 14, landed
 * 2026-08-13); it does **not** match the referrer, which is why the input is
 * labelled for the applicant.
 */
export const useUpgrades = (filters?: UpgradeListFilters) => {
  const { page = 1, limit = DEFAULT_UPGRADE_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: upgradeKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/referrals/upgrades', UpgradeSchema, {
        params: {
          page,
          limit,
          search: rest.search || undefined,
          status: rest.status,
          payment_method: rest.payment_method,
          to_tier: rest.to_tier,
        },
      }),
  });
};
