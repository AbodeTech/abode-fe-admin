export interface MarketplaceListFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  lists: () => [...marketplaceKeys.all, 'list'] as const,
  list: (filters?: MarketplaceListFilters) => [...marketplaceKeys.lists(), filters] as const,
  pendingApprovalsList: () => [...marketplaceKeys.all, 'pending-approvals'] as const,
  pendingApprovals: (filters?: { page?: number; limit?: number }) =>
    [...marketplaceKeys.pendingApprovalsList(), filters] as const,
  stats: () => [...marketplaceKeys.all, 'stats'] as const,
};
