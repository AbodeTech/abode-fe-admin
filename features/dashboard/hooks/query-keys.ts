export const dashboardKeys = {
  all: ['dashboard'] as const,
  details: () => [...dashboardKeys.all, 'details'] as const,
  detail: (params?: { startDate?: string | null; endDate?: string | null }) =>
    [...dashboardKeys.details(), params] as const,
  kpis: (params?: { from?: string | null; to?: string | null }) =>
    [...dashboardKeys.all, 'kpis', params ?? {}] as const,
  topProducts: (limit?: number) =>
    [...dashboardKeys.all, 'top-products', limit ?? 5] as const,
  topAssociates: (limit?: number) =>
    [...dashboardKeys.all, 'top-associates', limit ?? 5] as const,
};
