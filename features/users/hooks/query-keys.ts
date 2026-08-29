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
  suspendedPaymentPlansSummary: (filters?: Record<string, unknown>) =>
    [...userKeys.all, 'suspended-payment-plans-summary', filters] as const,
  overview: () => [...userKeys.all, 'overview'] as const,
  analytics: (filters?: Record<string, unknown>) =>
    [...userKeys.all, 'analytics', filters] as const,
  referrals: (userId: string) => [...userKeys.all, 'referrals', userId] as const,
};
