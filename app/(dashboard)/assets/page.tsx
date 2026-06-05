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
      <div className="flex min-h-[40vh] items-center justify-center py-16">
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
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <AssetPageHeader />

      <InventoryHealthBar data={inventoryData} />

      <AssetCategoryHealth data={inventoryData} />

      <div className="space-y-8 sm:space-y-10 md:space-y-12">
        <section className="min-w-0">
          <div className="mb-3 flex min-w-0 flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">Flex Assets Inventory</h2>
          </div>
          <AssetFlexTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex min-w-0 flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">Full Ownership Inventory</h2>
          </div>
          <AssetFullOwnershipTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
        </section>
      </div>
    </div>
  );
}
