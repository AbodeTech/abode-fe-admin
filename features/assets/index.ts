// Hooks
export { useAssets, useAssetInventory, useAssetByName, useAssetOptionsByName, useAssetDetails, useAssetAnalytics, useAssetIdByName } from './hooks/use-assets';
export type { AssetsData, AssetInventoryData } from './hooks/use-assets';
export { useAssetBlocks, useCreateBlock, useDeleteBlock, blockKeys } from './hooks/use-blocks';
export type { Block, CreateBlockInput } from './hooks/use-blocks';
export { useBlockPlots, useCreatePlots, useUpdatePlotSize, plotKeys, PlotStatus } from './hooks/use-plots';
export type { Plot, PlotRangeInput, UseBlockPlotsParams, CreatePlotsInput, UpdatePlotSizeInput } from './hooks/use-plots';
export { useAvailablePlotsForAsset, availablePlotsKeys } from './hooks/use-available-plots';
export type { UseAvailablePlotsParams } from './hooks/use-available-plots';
export { useAssetSubscribers } from './hooks/use-asset-subscribers';
export type { AssetSubscribersData } from './hooks/use-asset-subscribers';
export { useCreateFlexAsset, useCreateFullOwnershipAsset } from './hooks/use-create-asset';
export { useUpdateFlexAsset } from './hooks/use-update-asset';

// Components
// Components
export { FlexAssetsTable as AssetFlexTable } from './components/AssetFlexTable';
export { FullOwnershipAssetsTable as AssetFullOwnershipTable } from './components/AssetFullOwnershipTable';
export { AssetInventoryOverview } from './components/AssetInventoryOverview';
export { InventoryHealthBar } from './components/InventoryHealthBar';
export { AssetCategoryHealth } from './components/AssetCategoryHealth';
export { AssetPageHeader } from './components/AssetPageHeader';
export { CreateFlexAssetForm } from './components/CreateFlexAssetForm';
export { CreateFullOwnershipAssetForm } from './components/CreateFullOwnershipAssetForm';
export { EditFlexAssetForm } from './components/EditFlexAssetForm';
export { EditFullOwnershipAssetForm } from './components/EditFullOwnershipAssetForm';

// Detail components
export { AssetDetailHeader } from './components/detail/AssetDetailHeader';
export { SubscribedCustomers } from './components/detail/SubscribedCustomers';

// Page client components (used by app/ pages)
export { default as EditFlexAssetPageClient } from './components/EditFlexAssetPageClient';
export { default as EditFullOwnershipAssetPageClient } from './components/EditFullOwnershipAssetPageClient';
