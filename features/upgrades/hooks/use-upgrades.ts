'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { UpgradeSchema } from '../schemas/upgrade.schema';
import { upgradeKeys, type UpgradeListFilters } from './query-keys';

export const DEFAULT_UPGRADE_LIMIT = 20;

/**
 * GET /admin/referrals/upgrades — the approval queue, newest first.
 *
 * Filters are server-side: `status`, `payment_method`, `to_tier`. There is no
 * search parameter (⛔ ticket 14), and none can be faked client-side because
 * the names aren't in the payload either (⛔ ticket 13).
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
          status: rest.status,
          payment_method: rest.payment_method,
          to_tier: rest.to_tier,
        },
      }),
  });
};
