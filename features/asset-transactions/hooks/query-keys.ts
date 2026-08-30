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

/**
 * Mirrors `AdminDocumentTransactionQueryDto` — the asset filters minus
 * `sales_type`, which the BE drops because every row on this list is already a
 * document payment (`purchase_kind: 'dev_levy'`).
 */
export type DocumentPurchaseListFilters = Omit<PurchaseListFilters, 'sales_type'>;

export const purchaseKeys = {
  all: ['asset-transactions'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (filters?: PurchaseListFilters) => [...purchaseKeys.lists(), filters ?? {}] as const,
  /** Nested under `all`, so a review invalidates the document ledger too. */
  documents: () => [...purchaseKeys.all, 'documents'] as const,
  documentList: (filters?: DocumentPurchaseListFilters) =>
    [...purchaseKeys.documents(), 'list', filters ?? {}] as const,
  details: () => [...purchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseKeys.details(), id] as const,
  foPlans: () => [...purchaseKeys.all, 'fo-plan'] as const,
  foPlan: (id: string) => [...purchaseKeys.foPlans(), id] as const,
};
