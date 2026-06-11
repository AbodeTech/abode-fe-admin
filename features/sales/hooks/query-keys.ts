export const salesKeys = {
  all: ['sales'] as const,
  list: (filters?: Record<string, unknown>) => [...salesKeys.all, 'list', filters] as const,
  summary: (filters?: Record<string, unknown>) => [...salesKeys.all, 'summary', filters] as const,
  statusCounts: (filters?: Record<string, unknown>) => [...salesKeys.all, 'status-counts', filters] as const,
};
