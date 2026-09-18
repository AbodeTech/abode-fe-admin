/* Assets — on REST against the Asset → Offer → Size → Plan model.
 *
 * The v1 flex / full-ownership split is gone: one list, one create form, one
 * detail shell with sub-routes (overview · offers · blocks & plots ·
 * performance · customers · updates). Portfolio analytics (ticket 17) is real, backed
 * by GET /admin/assets/analytics/portfolio; per-asset Performance analytics
 * still runs on fixtures (⛔ ticket 17b) — no per-asset endpoint yet.
 *
 * See docs/ASSETS-ADMIN-DESIGN.md.
 */

// ── list ─────────────────────────────────────────────────────────────────
export { AssetsTable } from './components/list/AssetsTable';
export { AssetFilters } from './components/list/AssetFilters';
export { AssetOffersCell } from './components/list/AssetOffersCell';
export { AssetStatusBadges } from './components/list/AssetStatusBadges';
export { DeleteAssetDialog } from './components/list/DeleteAssetDialog';

export { useAssetList, useDeleteAsset, DEFAULT_ASSET_LIMIT } from './hooks/use-asset-list';

// ── detail (sub-routes: overview · offers · blocks & plots · performance · customers · updates) ──
export { AssetDetailShell } from './components/detail/AssetDetailShell';
export { AssetDetailNav } from './components/detail/AssetDetailNav';
export { AssetOverview } from './components/detail/AssetOverview';
export { AssetOffers } from './components/detail/AssetOffers';
export { SampleDataBanner } from './components/detail/SampleDataBanner';
export { EditablePanel } from './components/detail/EditablePanel';
export { OfferEditDialogs } from './components/detail/OfferEditDialogs';

export { BlocksManager } from './components/detail/BlocksManager';

export { useAssetDetail, useUpdateAsset } from './hooks/use-asset-detail';
export { useAssetBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from './hooks/use-blocks';
export {
  useBlockPlots,
  useBulkCreatePlots,
  useUpdatePlot,
  useDeletePlot,
} from './hooks/use-plots';
export {
  useUpdateOffer,
  useAddSize,
  useUpdateSize,
  useDeleteSize,
  useUpdatePlan,
  useDeletePlan,
} from './hooks/use-offer-mutations';
export type { AssetDetail, Offer, Size, Plan } from './schemas/asset-detail.schema';
export {
  PLOT_STATUSES,
  blockStats,
  expandPlotRanges,
  isAllocated,
  plotName,
} from './schemas/block-plot.schema';
export type { Block, Plot, PlotRange, PlotStatus } from './schemas/block-plot.schema';

// ── create ───────────────────────────────────────────────────────────────
export { CreateAssetForm } from './components/create/CreateAssetForm';
export { useCreateAsset } from './hooks/use-create-asset-v2';
export { useAssetFormStore } from './store/asset-form-store';
export {
  createAssetFormSchema,
  createAssetFormToPayload,
  derivePlan,
} from './schemas/create-asset.schema';
export type { CreateAssetFormValues } from './schemas/create-asset.schema';
export type { AssetListFilters } from './hooks/query-keys';

export {
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  VISIBILITIES,
  VISIBILITY_LABELS,
  availableUnits,
  usesFoModel,
} from './schemas/asset.schema';
export type { Asset, OfferSummary, OfferType, Visibility } from './schemas/asset.schema';

// ── analytics: portfolio-wide and per-asset are both live (ticket 17) ──
// Portfolio-wide, on the list page — GET /admin/assets/analytics/portfolio:
export { InventoryHealthBar } from './components/InventoryHealthBar';
export { AssetCategoryHealth } from './components/AssetCategoryHealth';
export { usePortfolioAnalytics } from './hooks/use-portfolio-analytics';
export {
  ANALYTICS_CATEGORIES,
  ANALYTICS_CATEGORY_LABELS,
} from './schemas/portfolio-analytics.schema';
export type {
  AnalyticsCategory,
  PortfolioMetrics,
  AssetCategoryMetrics,
  AssetInventorySummary,
  AssetInventoryDetail,
  PortfolioAnalyticsResponse,
} from './schemas/portfolio-analytics.schema';

// Per-asset, on the detail Performance tab — GET /admin/assets/:id/analytics:
export { AssetPerformance } from './components/detail/AssetPerformance';
export { AssetHealthBar } from './components/detail/AssetHealthBar';
export { PaymentPlanMatrix } from './components/detail/PaymentPlanMatrix';
export { useAssetAnalytics } from './hooks/use-asset-analytics';
export { ANALYTICS_FILTERS, planTenorLabel } from './schemas/asset-analytics.schema';
export type {
  AnalyticsFilter,
  AssetAnalyticsResponse,
  AssetSizePlanGroup,
  AssetSizePlanBreakdown,
  LifecycleBucket,
} from './schemas/asset-analytics.schema';

// Subscribers, on the detail Customers tab — GET /admin/assets/:id/subscribers:
export { AssetSubscribers } from './components/detail/AssetSubscribers';
export {
  useAssetSubscribers,
  DEFAULT_SUBSCRIBERS_LIMIT,
} from './hooks/use-asset-subscribers';
export type { AssetSubscribersFilters } from './hooks/use-asset-subscribers';
export { useExportAssetSubscribers } from './hooks/use-export-asset-subscribers';
export {
  SUBSCRIBER_TYPES,
  SUBSCRIBER_TYPE_LABELS,
  SUBSCRIBER_SORT_FIELDS,
} from './schemas/asset-subscribers.schema';
export type {
  SubscriberRow,
  SubscriberType,
  SubscriberSortField,
} from './schemas/asset-subscribers.schema';

// Estate updates, on the detail Updates tab — /admin/assets/:id/updates:
export { AssetEstateUpdates } from './components/detail/AssetEstateUpdates';
export { EstateUpdatesTable } from './components/detail/EstateUpdatesTable';
export { EstateUpdateDetail } from './components/detail/EstateUpdateDetail';
export { EstateUpdateFormDialog } from './components/detail/EstateUpdateFormDialog';
export { EstateUpdateActions } from './components/detail/EstateUpdateActions';
export {
  useEstateUpdates,
  useEstateUpdate,
  DEFAULT_ESTATE_UPDATES_LIMIT,
} from './hooks/use-estate-updates';
export type { EstateUpdatesFilters } from './hooks/use-estate-updates';
export {
  useCreateEstateUpdate,
  useEditEstateUpdate,
  usePublishEstateUpdate,
  useArchiveEstateUpdate,
} from './hooks/use-estate-update-mutations';
export {
  ESTATE_UPDATE_CATEGORIES,
  ESTATE_UPDATE_CATEGORY_LABELS,
  ESTATE_UPDATE_AUDIENCES,
  ESTATE_UPDATE_AUDIENCE_LABELS,
  ESTATE_UPDATE_STATUSES,
  ESTATE_UPDATE_STATUS_LABELS,
} from './schemas/estate-update.schema';
export type {
  EstateUpdate,
  EstateUpdateCategory,
  EstateUpdateAudience,
  EstateUpdateStatus,
  EstateUpdatePayload,
} from './schemas/estate-update.schema';
