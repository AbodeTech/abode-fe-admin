'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { EligibleUpgradeSchema, type UserTier } from '../schemas/upgrade.schema';
import { upgradeKeys } from './query-keys';

export type EligibleUpgradeFilters = {
  to_tier?: UserTier;
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * Proposed `GET /admin/referrals/upgrades/eligible` (item 12). Keyed under
 * `upgradeKeys.lists()`, so recording an upgrade refreshes it too and the
 * member drops off the list.
 */
export const useEligibleUpgrades = (filters: EligibleUpgradeFilters, enabled = true) =>
  useQuery({
    queryKey: [...upgradeKeys.lists(), 'eligible', filters] as const,
    queryFn: () =>
      apiGetPaged('/admin/referrals/upgrades/eligible', EligibleUpgradeSchema, {
        params: {
          to_tier: filters.to_tier || undefined,
          search: filters.search?.trim() || undefined,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
        },
      }),
    enabled,
  });
