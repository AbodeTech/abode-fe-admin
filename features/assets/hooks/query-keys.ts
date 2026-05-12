export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...assetKeys.lists(), params] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  inventory: () => [...assetKeys.all, 'inventory'] as const,
  byName: (assetName: string, assetType: string) =>
    [...assetKeys.all, 'byName', assetName, assetType] as const,
  optionsByName: (assetName: string, assetType: string) =>
    [...assetKeys.all, 'options', assetName, assetType] as const,
  subscribers: (assetName: string, assetType: string, filters?: object) =>
    [...assetKeys.all, 'subscribers', assetName, assetType, filters] as const,
  analytics: (assetId: string, filter: string, startDate?: string, endDate?: string) =>
    [...assetKeys.all, 'analytics', assetId, filter, startDate, endDate] as const,
};
