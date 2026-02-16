"use client";
import {
  useAssets,
  useAssetInventory,
  AssetPageHeader,
  AssetInventoryOverview,
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
    <div className="space-y-8">
      <AssetPageHeader />

      <section>
        <h2 className="text-2xl font-bold mb-4">Inventory Overview</h2>
        <AssetInventoryOverview data={inventoryData} />
      </section>

      <section>
        <AssetFlexTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
      </section>

      <section>
        <AssetFullOwnershipTable data={assetsData?.data?.filter((asset): asset is NonNullable<typeof asset> => asset !== null) || []} />
      </section>
    </div>
  );
}
