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
  /** Land inventory. Plots hang off the block, not the asset — that is the id the BE takes. */
  blocks: (assetId: string) => [...assetKeys.detail(assetId), 'blocks'] as const,
  plots: (blockId: string) => [...assetKeys.all, 'plots', blockId] as const,
  byName: (assetName: string, assetType: string) =>
    [...assetKeys.all, 'byName', assetName, assetType] as const,
  optionsByName: (assetName: string, assetType: string) =>
    [...assetKeys.all, 'options', assetName, assetType] as const,
  subscribers: (assetName: string, assetType: string, filters?: object) =>
    [...assetKeys.all, 'subscribers', assetName, assetType, filters] as const,
  /** GET /admin/assets/:id/subscribers — keyed by id, unlike the legacy name/type key above. */
  assetSubscribers: (assetId: string, filters?: object) =>
    [...assetKeys.detail(assetId), 'subscribers', filters ?? {}] as const,
  /** GET /admin/assets/:id/updates — nested under detail so an asset-wide invalidate also refetches it. */
  estateUpdates: (assetId: string) => [...assetKeys.detail(assetId), 'estate-updates'] as const,
  estateUpdateList: (assetId: string, params?: object) =>
    [...assetKeys.estateUpdates(assetId), 'list', params ?? {}] as const,
  estateUpdate: (assetId: string, updateId: string) =>
    [...assetKeys.estateUpdates(assetId), 'detail', updateId] as const,
  analytics: (assetId: string, filter: string, startDate?: string, endDate?: string) =>
    [...assetKeys.all, 'analytics', assetId, filter, startDate, endDate] as const,
  portfolioAnalytics: () => [...assetKeys.all, 'portfolio-analytics'] as const,
};
