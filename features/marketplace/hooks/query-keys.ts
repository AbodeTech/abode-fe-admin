export const marketplaceKeys = {
  all: ['marketplace'] as const,
  lists: () => [...marketplaceKeys.all, 'list'] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    status?: string;
    asset_type?: string;
  }) => [...marketplaceKeys.lists(), filters] as const,
  details: () => [...marketplaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...marketplaceKeys.details(), id] as const,
  stats: () => [...marketplaceKeys.all, 'stats'] as const,
  pendingApprovalsList: () => [...marketplaceKeys.all, 'pending-approvals'] as const,
  pendingApprovals: (filters?: {
    page?: number;
    limit?: number;
  }) => [...marketplaceKeys.pendingApprovalsList(), filters] as const,
};
