export const adminLogKeys = {
  all: ['admin-logs'] as const,
  list: (filters?: Record<string, unknown>) => [...adminLogKeys.all, 'list', filters] as const,
};
