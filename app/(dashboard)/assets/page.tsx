"use client";
import {
  useAssets,
  useAssetInventory,
  AssetPageHeader,
  InventoryHealthBar,
  AssetCategoryHealth,
  AssetFlexTable,
  AssetFullOwnershipTable,
} from "@/features/assets";
import { Loader2 } from "lucide-react";

export default function AssetsPage() {
  const { data: assetsData, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: inventoryData, isLoading: inventoryLoading } = useAssetInventory();

  const isLoading = assetsLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (assetsError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading assets</h3>
        <p>{assetsError.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AssetPageHeader />

      <InventoryHealthBar />
      
      <AssetCategoryHealth />

      <div className="space-y-12">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Flex Assets Inventory</h2>
            <span className="text-sm text-muted-foreground font-medium">12 Assets Active</span>
          </div>
          <AssetFlexTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Full Ownership Inventory</h2>
            <span className="text-sm text-muted-foreground font-medium">8 Assets Active</span>
          </div>
          <AssetFullOwnershipTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
        </section>
      </div>
    </div>
  );
}
