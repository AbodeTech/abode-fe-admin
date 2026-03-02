export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    searchQuery?: string | null;
    hasReferral?: boolean;
    hasAsset?: boolean;
    referralStatus?: string;
    howDidYouHearAboutUs?: string;
    startDate?: string;
    endDate?: string;
    list?: string;
    assetType?: string | null;
  }) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  overview: () => [...userKeys.all, 'overview'] as const,
  referrals: (userId: string) => [...userKeys.all, 'referrals', userId] as const,
};
