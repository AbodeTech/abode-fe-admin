export const allocationKeys = {
  all: ['allocation'] as const,
  list: (filters?: Record<string, unknown>) => [...allocationKeys.all, 'list', filters] as const,
  assets: ['allocation', 'assets'] as const,
  export: (filters?: Record<string, unknown>) => [...allocationKeys.all, 'export', filters] as const,
  availablePlots: (assetId: string, size?: number) =>
    [...allocationKeys.all, 'availablePlots', assetId, size ?? null] as const,
  history: (planId: string, page?: number, limit?: number) =>
    [...allocationKeys.all, 'history', planId, page ?? 1, limit ?? 20] as const,
};
