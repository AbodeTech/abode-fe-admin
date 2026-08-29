export type ConfirmationListFilters = {
  page: number;
  limit: number;
  status: string;
  search: string;
  product: string;
};

export const purchaseConfirmationKeys = {
  all: ["purchase-confirmations"] as const,
  list: (filters: ConfirmationListFilters) =>
    [...purchaseConfirmationKeys.all, "list", filters] as const,
  counts: () => [...purchaseConfirmationKeys.all, "counts"] as const,
};
