export type FlexLeadListFilters = {
  page: number;
  limit: number;
  status: string;
  type: string;
  search: string;
};

export const flexLeadKeys = {
  all: ["flex-leads"] as const,
  list: (filters: FlexLeadListFilters) =>
    [...flexLeadKeys.all, "list", filters] as const,
  counts: () => [...flexLeadKeys.all, "counts"] as const,
};
