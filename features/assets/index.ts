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

// ── detail (sub-routes: overview · offers · blocks & plots · site setup ·
//    costs & profitability · performance · customers · updates) ──
export { AssetDetailShell } from './components/detail/AssetDetailShell';
export { AssetDetailNav } from './components/detail/AssetDetailNav';
export { AssetOverview } from './components/detail/AssetOverview';
export { AssetHistory, AssetUpdates } from './components/detail/AssetHistory';
export { useAssetAllocationEvents } from './hooks/use-asset-allocation-events';
export {
  ASSET_ALLOCATION_EVENT_STATUSES,
  AssetAllocationEventSchema,
} from './schemas/allocation-event.schema';
export type {
  AssetAllocationEventStatus,
  AssetAllocationEvent,
} from './schemas/allocation-event.schema';
export { AssetOffers } from './components/detail/AssetOffers';
export { OfferConfigHistorySheet } from './components/detail/OfferConfigHistorySheet';
export { useOfferConfigHistory } from './hooks/use-offer-config-history';
export {
  OFFER_CONFIG_ACTIONS,
  OFFER_CONFIG_ACTION_LABELS,
} from './schemas/offer-config-history.schema';
export type { OfferConfigAction, OfferConfigRevision } from './schemas/offer-config-history.schema';
export { SampleDataBanner } from './components/detail/SampleDataBanner';
export { EditablePanel } from './components/detail/EditablePanel';
export { OfferEditDialogs, NumberInput } from './components/detail/OfferEditDialogs';
export type { NumberFieldLike } from './components/detail/OfferEditDialogs';

export { AssetBlocksAndPlots } from './components/detail/AssetBlocksAndPlots';
export { BlocksManager } from './components/detail/BlocksManager';
export { PlotInventoryPanel } from './components/detail/PlotInventoryPanel';
export { CommercialStatusMatrix } from './components/detail/CommercialStatusMatrix';
export { PhysicalStatusMatrix } from './components/detail/PhysicalStatusMatrix';
export { InventoryReconciliationPanel } from './components/detail/InventoryReconciliationPanel';
export { useInventoryReconciliation } from './hooks/use-inventory-reconciliation';
export {
  AllocatedPlotHolderSchema,
  PhysicalSizeStatusSchema,
  CommercialSizeStatusSchema,
  SizeReconciliationRowSchema,
  InventoryReconciliationSchema,
  EstateReconciliationTotalsSchema,
  RECONCILIATION_EXCEPTION_CODES,
} from './schemas/inventory-reconciliation.schema';
export type {
  AllocatedPlotHolder,
  PhysicalSizeStatus,
  CommercialSizeStatus,
  SizeReconciliationRow,
  InventoryReconciliation,
  EstateReconciliationTotals,
  ReconciliationExceptionCode,
  ReconciliationException,
} from './schemas/inventory-reconciliation.schema';
export { usePlotInventory } from './hooks/use-plot-inventory';
export type { PlotInventoryFilters } from './hooks/use-plot-inventory';
export {
  PLOT_ALLOCATION_FILTERS,
  PLOT_FIELD_FILTERS,
  PlotInventoryRowSchema,
  PlotInventoryResponseSchema,
} from './schemas/plot-inventory.schema';
export type {
  PlotAllocationFilter,
  PlotFieldFilter,
  PlotInventoryRow,
  PlotInventoryTotals,
  PlotInventoryResponse,
} from './schemas/plot-inventory.schema';

// Ground confirmation — "Separate system allocation from ground confirmation", a real per-plot field submission:
export { GroundConfirmationBadge } from './components/detail/GroundConfirmationBadge';
export { useGroundConfirmationHistory } from './hooks/use-ground-confirmation';
export {
  useSubmitGroundConfirmation,
  useVerifyGroundConfirmation,
} from './hooks/use-ground-confirmation-mutations';
export {
  GroundConfirmationSchema,
  submitGroundConfirmationFormSchema,
  isGroundConfirmed as isGroundConfirmedFromHistory,
} from './schemas/ground-confirmation.schema';
export type {
  GroundConfirmation,
  SubmitGroundConfirmationFormValues,
} from './schemas/ground-confirmation.schema';

// ── land account — the physical-land account layered on Overview ──────────
export { LandAccountCard } from './components/detail/LandAccountCard';
export { LandAccountEditorDrawer } from './components/detail/LandAccountEditorDrawer';
export { LandConfigurationHistory } from './components/detail/LandConfigurationHistory';
export {
  useLandConfiguration,
  useLandConfigurationHistory,
  useLandConfigurationRevision,
} from './hooks/use-land-configuration';
export { useSaveLandConfiguration } from './hooks/use-land-configuration-mutations';
export {
  LAND_USE_CATEGORIES,
  LAND_USE_CATEGORY_LABELS,
  LAND_CONFIGURATION_ERROR_CODES,
  reconcileLand,
  productCapacity,
  totalAssignedSqm,
  unclassifiedSqm,
} from './schemas/land-configuration.schema';
export type {
  LandConfiguration,
  LandConfigurationProduct,
  LandConfigurationRevision,
  AssetLandUse,
  LandUseCategory,
  ProductPool,
  LandConfigurationErrorCode,
} from './schemas/land-configuration.schema';

// ── site setup — boundary + fencing progress, real (field-staff module) ───
// "Roads and services" is a DIFFERENT real feature (Land Account, above),
// not part of Site Setup.
export { SiteSetup } from './components/detail/SiteSetup';
export { EditBoundaryDialog } from './components/detail/EditBoundaryDialog';
export { BoundaryHistorySheet } from './components/detail/BoundaryHistorySheet';
export { useSiteSetup, useBoundaryHistory } from './hooks/use-site-setup';
export { useSetBoundary } from './hooks/use-site-setup-mutations';
export { FieldSubmissionsPanel } from './components/detail/FieldSubmissionsPanel';
export { FieldSubmissionSheet } from './components/detail/FieldSubmissionSheet';
export { FieldCostsPanel, FieldTeamPanel, GroundAllocationPanel } from './components/detail/FieldSitePanels';
export {
  useFieldSubmissions,
  useFieldSubmission,
  useVerifySubmission,
  useRejectSubmission,
  useCorrectSubmission,
  useReverseSubmission,
  useLinkSubmissionPlots,
  useFieldCosts,
  useAssetFieldStaff,
  useAssetFieldPerformance,
  useFieldAllocation,
  useAssignEventOwner,
  useRemoveEventOwner,
} from './hooks/use-field-operations';
export {
  FENCING_SIDES,
  FENCING_SIDE_LABELS,
  BOUNDARY_SOURCES,
  setBoundaryFormSchema,
  perimeterOf as boundaryPerimeterOf,
} from './schemas/site-setup.schema';
export type {
  FencingSide,
  BoundarySource,
  CurrentBoundary,
  BoundaryVersion,
  FencingSideRow,
  SiteSetup as SiteSetupData,
  SetBoundaryFormValues,
} from './schemas/site-setup.schema';

// ── sqm inventory — the real live ledger, on Blocks & Plots ────────────────
export { SqmInventoryPanel } from './components/detail/SqmInventoryPanel';
export { useSqmInventory, useSqmReconciliation } from './hooks/use-sqm-inventory';
export { useActivateSqmInventory } from './hooks/use-sqm-activation-mutations';
export type { SqmInventory, SqmPosition } from './schemas/sqm-inventory.schema';
export type { SqmReconciliation, SqmActivationResult } from './schemas/sqm-reconciliation.schema';

export { useAssetDetail, useUpdateAsset } from './hooks/use-asset-detail';
export { useSetPitchPack, useRemovePitchPack } from './hooks/use-pitch-pack';
export { useAssetBlocks, useCreateBlock, useUpdateBlock, useDeleteBlock } from './hooks/use-blocks';
export {
  useBlockPlots,
  useCreatePlots,
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
export type { AssetDetail, Offer, Size, Plan, PitchPack } from './schemas/asset-detail.schema';
export { totalSellingPrice } from './schemas/asset-detail.schema';

// ── selling charges — the real, asset-wide replacement for per-plan price safety, on the Offers tab ──
export { SellingChargesPanel } from './components/detail/SellingChargesPanel';
export { SellingChargesDialog } from './components/detail/SellingChargesDialog';
export { SellingChargesHistorySheet } from './components/detail/SellingChargesHistorySheet';
export { useSellingCharges, useSellingChargesHistory } from './hooks/use-selling-charges';
export { useSetSellingCharges } from './hooks/use-selling-charges-mutations';
export {
  SELLING_CHARGE_TYPES,
  SELLING_CHARGE_TYPE_LABELS,
  CHARGE_BASES,
  CHARGE_BASIS_LABELS,
  setSellingChargesFormSchema,
} from './schemas/selling-charges.schema';
export type {
  SellingCharges,
  SellingChargeLine,
  SellingChargesHistoryEntry,
  SetSellingChargesFormValues,
  SetSellingChargesFormOutput,
} from './schemas/selling-charges.schema';

export {
  PLOT_STATUSES,
  PLOT_STATUS_LABELS,
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

// Per-asset, on the detail Performance tab. `GET /admin/assets/:id/analytics`
// is FICTITIOUS — confirmed live against staging that this route doesn't
// exist; the real analytics endpoint (`GET /admin/assets/analytics/portfolio`)
// is portfolio-wide with no per-asset equivalent at all. The whole Performance
// tab is hidden outside mock mode because of this — see
// app/(dashboard)/assets/[id]/performance/page.tsx and
// docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md.
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

// Costs & Profitability, on the detail Costs tab — /admin/assets/:id/costs.
// Rewired to the real abode-be-v2 3-layer model (cost item -> obligation ->
// stage event) confirmed on staging (PR #82) — see AssetCosts.tsx's own doc
// comment. The old estate-wide "profitability basis" singleton is gone;
// allocation is per shared cost item now (AllocationRuleDialog).
export { AssetCosts } from './components/detail/AssetCosts';
export { AssetCostGroupTable } from './components/detail/AssetCostGroupTable';
export { AddCostDrawer } from './components/detail/AddCostDrawer';
export type { AddCostInitialValues } from './components/detail/AddCostDrawer';
export { AddCostItemDialog } from './components/detail/AddCostItemDialog';
export type { AddCostItemInitialValues } from './components/detail/AddCostItemDialog';
export { CostCoveragePanel } from './components/detail/CostCoveragePanel';
export { CostDetailSheet } from './components/detail/CostDetailSheet';
export { RecordStageAmountDialog } from './components/detail/RecordStageAmountDialog';
export { ReverseAdjustDialog } from './components/detail/ReverseAdjustDialog';
export { EditCostMetadataDialog } from './components/detail/EditCostMetadataDialog';
export { AllocationRuleDialog, AllocationBadge } from './components/detail/AllocationRuleDialog';
export { EstateProfitabilityCard } from './components/detail/EstateProfitabilityCard';
export { ProfitabilityCalculationDrawer } from './components/detail/ProfitabilityCalculationDrawer';
export { ProductProfitabilityComparison } from './components/detail/ProductProfitabilityComparison';
export {
  useCostItems,
  useAllocationRuleHistory,
  useCreateCostItem,
  useUpdateCostItem,
  useArchiveCostItem,
  useSetAllocationRule,
} from './hooks/use-cost-items';
export {
  useCostObligations,
  useCostObligation,
  useCreateObligation,
  useArchiveObligation,
  type ListObligationsFilters,
} from './hooks/use-cost-obligations';
export {
  useAddStage,
  useUpdateEvent,
  useApproveEvent,
  useReverseEvent,
  useAcceptClaim,
} from './hooks/use-cost-events';
export { useCostCoverage } from './hooks/use-cost-coverage';
export { useCostImpactPreview } from './hooks/use-cost-impact-preview';
export { useEstateProfitability } from './hooks/use-estate-profitability';
export { useProfitabilityMatrix } from './hooks/use-profitability-matrix';
export { useProfitabilityDrillDown } from './hooks/use-profitability-drilldown';
export {
  COST_GROUPS,
  COST_GROUP_LABELS,
  COST_ITEM_SUGGESTIONS,
  ALLOCATION_BASES,
  ALLOCATION_BASIS_LABELS,
  FINANCIAL_STAGES,
  FINANCIAL_STAGE_LABELS,
  RECOGNISED_STAGES,
  countsAsCost,
  OBLIGATION_STATUSES,
  COST_EVENT_STATUSES,
  COST_SOURCE_TYPES,
  COST_SOURCE_TYPE_LABELS,
  COST_ERROR_CODES,
  createCostItemFormSchema,
  updateCostItemFormSchema,
  setAllocationRuleFormSchema,
  createObligationFormSchema,
  archiveObligationFormSchema,
  addStageFormSchema,
  updateEventFormSchema,
  approveEventFormSchema,
  reverseEventFormSchema,
  acceptClaimFormSchema,
} from './schemas/asset-cost.schema';
export type {
  CostGroup,
  AllocationBasis,
  FinancialStage,
  ObligationStatus,
  CostEventStatus,
  CostSourceType,
  CostErrorCode,
  ManualShare,
  AssetCostItem,
  AllocationRule,
  AllocationRuleShare,
  AssetCostObligation,
  AssetCostEvent,
  EvidenceItem,
  ObligationDetail,
  CreateCostItemFormValues,
  CreateCostItemFormOutput,
  UpdateCostItemFormValues,
  SetAllocationRuleFormValues,
  SetAllocationRuleFormOutput,
  CreateObligationFormValues,
  CreateObligationFormOutput,
  ArchiveObligationFormValues,
  AddStageFormValues,
  AddStageFormOutput,
  UpdateEventFormValues,
  ApproveEventFormValues,
  ReverseEventFormValues,
  AcceptClaimFormValues,
} from './schemas/asset-cost.schema';
export {
  ScopeResultSchema,
  ProfitabilityByProductRowSchema,
  ProfitabilityBySizeRowSchema,
} from './schemas/estate-profitability.schema';
export type {
  ScopeResult,
  ProfitabilityByProductRow,
  ProfitabilityBySizeRow,
  CommissionSummary,
  EstateProfitability,
} from './schemas/estate-profitability.schema';
export type { ProfitabilityMatrix, ProfitabilityMatrixRow } from './schemas/profitability-matrix.schema';
export type { ProfitabilityDrillDown, DrillDownRevenueRow, DrillDownCostRow } from './schemas/profitability-drilldown.schema';
export type { CostCoverage, CostCoverageItem } from './schemas/cost-coverage.schema';
export { impactPreviewInputSchema } from './schemas/cost-impact-preview.schema';
export type { ImpactPreviewInput, CostImpactPreview } from './schemas/cost-impact-preview.schema';

