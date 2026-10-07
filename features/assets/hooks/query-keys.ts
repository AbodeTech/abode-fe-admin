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
  /**
   * GET /admin/assets/:assetId/land-configuration — nested under detail so
   * an asset-wide invalidate also refetches it. Note that this makes
   * `invalidateQueries({ queryKey: assetKeys.detail(id) })` anywhere else
   * (e.g. `useUpdateAsset`'s `onSuccess`) cascade to this key too — broad by
   * design, not a bug.
   */
  landConfiguration: (assetId: string) => [...assetKeys.detail(assetId), 'land-configuration'] as const,
  landConfigurationHistory: (assetId: string) =>
    [...assetKeys.landConfiguration(assetId), 'history'] as const,
  landConfigurationRevision: (assetId: string, version: number) =>
    [...assetKeys.landConfigurationHistory(assetId), version] as const,
  /**
   * GET /admin/assets/:assetId/offers/flex/sizes/:sizeId/pricing — nested under
   * detail so any offer write (and the pricing mutations themselves) refetch it
   * together with the tree and the history log.
   */
  flexPricing: (assetId: string, sizeId: string) => [...assetKeys.detail(assetId), 'flex-pricing', sizeId] as const,
  /** Cost items (the catalogue) — GET/POST/PATCH .../costs/items(/:itemId). */
  costItems: (assetId: string) => [...assetKeys.detail(assetId), 'cost-items'] as const,
  costItem: (assetId: string, itemId: string) => [...assetKeys.costItems(assetId), itemId] as const,
  costItemAllocationRule: (assetId: string, itemId: string) =>
    [...assetKeys.costItem(assetId, itemId), 'allocation-rule'] as const,
  /** Cost obligations (the records) — GET/POST .../costs, GET .../costs/:obligationId. */
  costObligations: (assetId: string) => [...assetKeys.detail(assetId), 'cost-obligations'] as const,
  costObligation: (assetId: string, obligationId: string) =>
    [...assetKeys.costObligations(assetId), obligationId] as const,
  /** GET /admin/assets/:assetId/costs/summary. */
  costSummary: (assetId: string) => [...assetKeys.detail(assetId), 'cost-summary'] as const,
  /** GET /admin/assets/:assetId/costs/coverage. */
  costCoverage: (assetId: string) => [...assetKeys.detail(assetId), 'cost-coverage'] as const,
  /** GET /admin/assets/:assetId/profitability(/matrix|/drill-down) — no accounting-basis toggle on the real model, just an optional `as_of`. */
  estateProfitability: (assetId: string, asOf?: string) =>
    [...assetKeys.detail(assetId), 'profitability', asOf ?? 'current'] as const,
  profitabilityMatrix: (assetId: string, asOf?: string) =>
    [...assetKeys.detail(assetId), 'profitability-matrix', asOf ?? 'current'] as const,
  profitabilityDrillDown: (assetId: string, asOf?: string) =>
    [...assetKeys.detail(assetId), 'profitability-drilldown', asOf ?? 'current'] as const,
  /** GET/PUT /admin/assets/:assetId/selling-charges(/history). */
  sellingCharges: (assetId: string) => [...assetKeys.detail(assetId), 'selling-charges'] as const,
  sellingChargesHistory: (assetId: string) => [...assetKeys.sellingCharges(assetId), 'history'] as const,
  /** GET /admin/assets/:assetId/sqm-inventory(/reconciliation) — the real ledger position + activation readiness. */
  sqmInventory: (assetId: string) => [...assetKeys.detail(assetId), 'sqm-inventory'] as const,
  sqmReconciliation: (assetId: string) => [...assetKeys.detail(assetId), 'sqm-reconciliation'] as const,
  inventoryReconciliation: (assetId: string) =>
    [...assetKeys.detail(assetId), 'inventory-reconciliation'] as const,
  /** GET /admin/assets/:id/updates — nested under detail so an asset-wide invalidate also refetches it. */
  estateUpdates: (assetId: string) => [...assetKeys.detail(assetId), 'estate-updates'] as const,
  estateUpdateList: (assetId: string, params?: object) =>
    [...assetKeys.estateUpdates(assetId), 'list', params ?? {}] as const,
  estateUpdate: (assetId: string, updateId: string) =>
    [...assetKeys.estateUpdates(assetId), 'detail', updateId] as const,
  analytics: (assetId: string, filter: string, startDate?: string, endDate?: string) =>
    [...assetKeys.all, 'analytics', assetId, filter, startDate, endDate] as const,
  portfolioAnalytics: () => [...assetKeys.all, 'portfolio-analytics'] as const,
  /**
   * GET /admin/assets/:assetId/plots — nested under detail so an asset-wide
   * invalidate also refetches it. One real endpoint returns the list AND its
   * totals together (see plot-inventory.schema.ts) — no separate totals key.
   */
  plotInventory: (assetId: string, filters?: object) =>
    [...assetKeys.detail(assetId), 'plot-inventory', filters ?? {}] as const,
  /** GET /admin/assets/:assetId/plots/summary — nested under detail, like the list it summarises. */
  plotSummary: (assetId: string, filters?: object) =>
    [...assetKeys.detail(assetId), 'plot-summary', filters ?? {}] as const,
  /** GET /admin/assets/:assetId/site-setup(/boundary) — real field-staff endpoints, not mocks. */
  siteSetup: (assetId: string) => [...assetKeys.detail(assetId), 'site-setup'] as const,
  boundaryHistory: (assetId: string) => [...assetKeys.detail(assetId), 'boundary-history'] as const,
  /**
   * Field operations on one estate (see field-operations.schema.ts). All nested
   * under detail, so reviewing a submission can refresh everything it moves
   * (site progress, plots, costs, scores) with one asset-wide invalidate.
   */
  fieldSubmissions: (assetId: string, filters?: object) =>
    [...assetKeys.detail(assetId), 'field-submissions', filters ?? {}] as const,
  fieldSubmission: (assetId: string, submissionId: string) =>
    [...assetKeys.detail(assetId), 'field-submission', submissionId] as const,
  fieldCosts: (assetId: string) => [...assetKeys.detail(assetId), 'field-costs'] as const,
  fieldStaff: (assetId: string, includeEnded: boolean) =>
    [...assetKeys.detail(assetId), 'field-staff', includeEnded] as const,
  fieldPerformance: (assetId: string, year: number, month: number) =>
    [...assetKeys.detail(assetId), 'field-performance', year, month] as const,
  fieldAllocation: (assetId: string) => [...assetKeys.detail(assetId), 'field-allocation'] as const,
  fieldAllocationEvent: (assetId: string, eventId: string) =>
    [...assetKeys.fieldAllocation(assetId), eventId] as const,
  /** The cost groups are shared across all estates. */
  costCatalogue: () => ['admin-cost-catalogue'] as const,
};
