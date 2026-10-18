export const salesKeys = {
  all: ['sales'] as const,
  list: (filters?: Record<string, unknown>) => [...salesKeys.all, 'list', filters] as const,
  dashboard: (filters?: Record<string, unknown>) => [...salesKeys.all, 'dashboard', filters] as const,
  planStatusCounts: (filters?: Record<string, unknown>) =>
    [...salesKeys.all, 'plan-status-counts', filters] as const,
  export: () => [...salesKeys.all, 'export'] as const,
};
