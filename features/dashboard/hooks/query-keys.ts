export const dashboardKeys = {
  all: ['dashboard'] as const,
  details: () => [...dashboardKeys.all, 'details'] as const,
  detail: (params?: { startDate?: string | null; endDate?: string | null }) =>
    [...dashboardKeys.details(), params] as const,
};
