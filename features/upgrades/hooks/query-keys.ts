import type {
  UpgradePaymentMethod,
  UpgradeStatus,
  UserTier,
} from '../schemas/upgrade.schema';

/** Mirrors `UpgradeQueryDto`. No `search` — see ticket 14. */
export type UpgradeListFilters = {
  status?: UpgradeStatus;
  payment_method?: UpgradePaymentMethod;
  to_tier?: UserTier;
  page?: number;
  limit?: number;
};

export const upgradeKeys = {
  all: ['upgrades'] as const,
  lists: () => [...upgradeKeys.all, 'list'] as const,
  list: (filters?: UpgradeListFilters) => [...upgradeKeys.lists(), filters ?? {}] as const,
};
