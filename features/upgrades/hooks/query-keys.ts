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
  /**
   * Inclusive Lagos dates, YYYY-MM-DD. Each upgrade is dated by when it reached
   * its status: approved/declined on the review date, pending on the request
   * date, cancelled on the cancellation date.
   */
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
};

export const upgradeKeys = {
  all: ['upgrades'] as const,
  lists: () => [...upgradeKeys.all, 'list'] as const,
  list: (filters?: UpgradeListFilters) => [...upgradeKeys.lists(), filters ?? {}] as const,
  stats: (filters?: UpgradeListFilters) => [...upgradeKeys.all, 'stats', filters ?? {}] as const,
};
