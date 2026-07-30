/* Assets — on REST against the Asset → Offer → Size → Plan model.
 *
 * The v1 flex / full-ownership split is gone: one list, one create form, one
 * detail shell with sub-routes. Analytics is the only part still unbacked —
 * it runs on fixtures behind a banner (⛔ ticket 17).
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

export { useAssetDetail, useUpdateAsset } from './hooks/use-asset-detail';
export {
  useUpdateOffer,
  useAddSize,
  useUpdateSize,
  useDeleteSize,
  useUpdatePlan,
  useDeletePlan,
} from './hooks/use-offer-mutations';
export type { AssetDetail, Offer, Size, Plan } from './schemas/asset-detail.schema';

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
} from './schemas/asset.schema';
export type { Asset, OfferSummary, OfferType, Visibility } from './schemas/asset.schema';

// ── analytics: fixtures, no backend (⛔ ticket 17) ────────────────────────
// Portfolio-wide, on the list page:
export { InventoryHealthBar } from './components/InventoryHealthBar';
export { AssetCategoryHealth } from './components/AssetCategoryHealth';
// Per-asset, on the detail Performance tab:
export { AssetHealthBar } from './components/detail/AssetHealthBar';
export { PaymentPlanMatrix } from './components/detail/PaymentPlanMatrix';

export { SampleDataChip } from './components/analytics/SampleDataChip';
export {
  SAMPLE_PORTFOLIO,
  SAMPLE_CATEGORIES,
  SAMPLE_ASSET_HEALTH,
  SAMPLE_SIZE_PLANS,
} from './components/analytics/sample-data';
export type {
  PortfolioStats,
  CategoryStats,
  AssetHealthStats,
  PlanPerformance,
  SizePlanBreakdown,
} from './components/analytics/sample-data';
