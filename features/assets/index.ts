/* Assets — on REST against the Asset → Offer → Size → Plan model.
 *
 * The v1 flex / full-ownership split is gone: one list, one create form, one
 * detail shell with sub-routes (overview · offers · blocks & plots ·
 * performance · customers). Portfolio analytics (ticket 17) is real, backed
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

// ── detail (sub-routes: overview · offers · performance · customers) ─────
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

// ── analytics: portfolio-wide is real (ticket 17); per-asset still fixtures ──
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

// Per-asset, on the detail Performance tab (⛔ still ticket 17b — no endpoint):
export { AssetHealthBar } from './components/detail/AssetHealthBar';
export { PaymentPlanMatrix } from './components/detail/PaymentPlanMatrix';

export { SampleDataChip } from './components/analytics/SampleDataChip';
export {
  SAMPLE_ASSET_HEALTH,
  SAMPLE_SIZE_PLANS,
} from './components/analytics/sample-data';
export type {
  AssetHealthStats,
  PlanPerformance,
  SizePlanBreakdown,
} from './components/analytics/sample-data';
