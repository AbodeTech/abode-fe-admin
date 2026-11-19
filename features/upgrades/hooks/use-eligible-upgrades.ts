'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { ELIGIBLE_UPGRADE_TIERS, toEligibleUpgrade, type EligibleUpgradeTier } from '../lib/eligible-upgrade';
import { EligibleUpgradeApiRowSchema } from '../schemas/upgrade.schema';
import { upgradeKeys } from './query-keys';

export type EligibleUpgradeFilters = {
  /** Required by the BE: it validates against `associate | associate-pro`. */
  to_tier: EligibleUpgradeTier;
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * `GET /admin/referrals/upgrades/eligible` (item 12): people who passed the
 * course configured for `to_tier`. Empty until an admin sets that course in the
 * academy settings. Keyed under `upgradeKeys.lists()`, so recording an upgrade
 * refreshes it too and the member drops off the list.
 */
export const useEligibleUpgrades = (filters: EligibleUpgradeFilters, enabled = true) =>
  useQuery({
    queryKey: [...upgradeKeys.lists(), 'eligible', filters] as const,
    queryFn: async () => {
      const { items, meta } = await apiGetPaged('/admin/referrals/upgrades/eligible', EligibleUpgradeApiRowSchema, {
        params: {
          to_tier: filters.to_tier,
          search: filters.search?.trim() || undefined,
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
        },
      });
      return { items: items.map((row) => toEligibleUpgrade(row, filters.to_tier)), meta };
    },
    enabled: enabled && (ELIGIBLE_UPGRADE_TIERS as readonly string[]).includes(filters.to_tier),
  });
