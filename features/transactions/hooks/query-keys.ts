export const transactionKeys = {
  all: ['transactions'] as const,

  // Topup transactions
  topup: () => [...transactionKeys.all, 'topup'] as const,
  topupList: (filters?: { page?: number; limit?: number }) =>
    [...transactionKeys.topup(), 'list', filters] as const,

  // Withdrawal transactions
  withdrawal: () => [...transactionKeys.all, 'withdrawal'] as const,
  withdrawalList: (filters?: { page?: number; limit?: number; status?: string | null; search?: string | null }) =>
    [...transactionKeys.withdrawal(), 'list', filters] as const,

  // Document transactions live under `purchaseKeys` in features/asset-transactions,
  // on GET /admin/transactions/documents.

  // Commission transactions — GET /admin/commission/transactions
  commission: () => [...transactionKeys.all, 'commission'] as const,
  commissionList: (filters?: {
    page?: number;
    limit?: number;
    from?: string | null;
    to?: string | null;
    source_type?: string | null;
    q?: string | null;
    sort_by?: string | null;
    sort_dir?: string | null;
  }) => [...transactionKeys.commission(), 'list', filters] as const,

  // Asset transactions
  asset: () => [...transactionKeys.all, 'asset'] as const,
  assetList: (filters?: {
    page?: number;
    limit?: number;
    transactionType?: string | null;
    assetType?: string | null;
    salesType?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    search?: string | null;
  }) => [...transactionKeys.asset(), 'list', filters] as const,
  assetStats: (filters?: {
    transactionType?: string | null;
    assetType?: string | null;
    salesType?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }) => [...transactionKeys.asset(), 'stats', filters] as const,

  // Data points (stats)
  dataPoints: (type: string) => [...transactionKeys.all, 'dataPoints', type] as const,
};
