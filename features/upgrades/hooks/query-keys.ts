import type {
  UpgradePaymentMethod,
  UpgradeStatus,
  UserTier,
} from '../schemas/upgrade.schema';

/** Mirrors `UpgradeQueryDto`. */
export type UpgradeListFilters = {
  /** Matches the **applicant's** name, email or username — not the referrer's. */
  search?: string;
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
