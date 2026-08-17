import type {
  AssetType,
  PurchaseStatus,
  SalesType,
} from '../schemas/purchase.schema';

/**
 * Mirrors `AdminTransactionQueryDto`. `type` is pinned to 'purchase' by the
 * hook; `user` is honoured from the URL for deep links even though the page has
 * no picker for it.
 */
export type PurchaseListFilters = {
  /** Matches the asset's name or location, **or** the payer. */
  search?: string;
  status?: PurchaseStatus;
  payment_method?: string;
  sales_type?: SalesType;
  asset_type?: AssetType;
  /** Inclusive, `YYYY-MM-DD` — a date-only end covers the whole day. */
  start_date?: string;
  end_date?: string;
  user?: string;
  page?: number;
  limit?: number;
};

export const purchaseKeys = {
  all: ['asset-transactions'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (filters?: PurchaseListFilters) => [...purchaseKeys.lists(), filters ?? {}] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
};
