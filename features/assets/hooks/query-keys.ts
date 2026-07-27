import type { OfferType, Visibility } from '../schemas/asset.schema';

/** Mirrors `AssetFilterDto`. */
export type AssetListFilters = {
  search?: string;
  visibility?: Visibility;
  offer_type?: OfferType;
  sold?: boolean;
  include_deleted?: boolean;
  page?: number;
  limit?: number;
};

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (params?: AssetListFilters) => [...assetKeys.lists(), params ?? {}] as const,
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
