export const allocationKeys = {
  all: ['allocation'] as const,
  list: (filters?: Record<string, unknown>) => [...allocationKeys.all, 'list', filters] as const,
  assets: ['allocation', 'assets'] as const,
  export: (filters?: Record<string, unknown>) => [...allocationKeys.all, 'export', filters] as const,
};
