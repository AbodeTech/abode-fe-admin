import type { PurchaseStatus } from '../schemas/purchase.schema';

/**
 * Mirrors GET /admin/transactions' params. `type` is pinned to 'purchase' by
 * the hook; `user` is honoured from the URL for deep links even though the
 * page has no picker for it yet.
 */
export type PurchaseListFilters = {
  status?: PurchaseStatus;
  user?: string;
  page?: number;
  limit?: number;
};

export const purchaseKeys = {
  all: ['asset-transactions'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (filters?: PurchaseListFilters) => [...purchaseKeys.lists(), filters ?? {}] as const,
};
