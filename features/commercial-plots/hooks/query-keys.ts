export type CommercialPlanListFilters = {
  page?: number;
  limit?: number;
  /** `true` = suspended only, `false` = active only, omit = all. */
  suspended?: boolean;
};

export const commercialKeys = {
  all: ['commercial-plots'] as const,
  lists: () => [...commercialKeys.all, 'list'] as const,
  list: (filters?: CommercialPlanListFilters) =>
    [...commercialKeys.lists(), filters ?? {}] as const,
  details: () => [...commercialKeys.all, 'detail'] as const,
  detail: (id: string) => [...commercialKeys.details(), id] as const,
};
