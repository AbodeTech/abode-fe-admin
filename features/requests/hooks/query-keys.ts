export const requestKeys = {
  all: ['requests'] as const,
  stats: (range?: Record<string, unknown>) => [...requestKeys.all, 'stats', range] as const,
  list: (filters?: Record<string, unknown>) => [...requestKeys.all, 'list', filters] as const,
};
