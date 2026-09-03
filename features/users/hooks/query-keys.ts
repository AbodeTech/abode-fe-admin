export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    search?: string | null;
    searchQuery?: string | null;
    hasReferral?: boolean;
    hasAsset?: boolean;
    tier?: string;
    referralStatus?: string;
    howYouHeard?: string;
    howDidYouHearAboutUs?: string;
    dateFrom?: string;
    dateTo?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    list?: string;
    assetType?: string | null;
  }) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  overview: () => [...userKeys.all, 'overview'] as const,
  analytics: (filters?: Record<string, unknown>) =>
    [...userKeys.all, 'analytics', filters] as const,
  referrals: (userId: string) => [...userKeys.all, 'referrals', userId] as const,
  stats: (id: string) => [...userKeys.details(), id, 'stats'] as const,
  kyc: (id: string) => [...userKeys.details(), id, 'kyc'] as const,
  bank: (id: string) => [...userKeys.details(), id, 'bank'] as const,
  assets: (id: string, filters?: Record<string, unknown>) =>
    [...userKeys.details(), id, 'assets', filters] as const,
  transactions: (id: string, filters?: Record<string, unknown>) =>
    [...userKeys.details(), id, 'transactions', filters] as const,
  associatePro: (id: string) => [...userKeys.details(), id, 'associate-pro'] as const,
  campaigns: (id: string) => [...userKeys.details(), id, 'campaigns'] as const,
};
