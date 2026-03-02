export const agencyKeys = {
  all: ['agency'] as const,
  dashboard: () => [...agencyKeys.all, 'dashboard'] as const,
  lists: () => [...agencyKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...agencyKeys.lists(), filters] as const,
  detail: (id: string) => [...agencyKeys.all, 'detail', id] as const,
  transactions: (id: string) => [...agencyKeys.all, 'transactions', id] as const,
};
