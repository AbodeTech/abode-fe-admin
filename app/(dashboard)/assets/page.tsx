import React from 'react';
import { AssetPageHeader } from '@/components/features/assets/AssetPageHeader';
import { AssetInventoryOverview } from '@/components/features/assets/AssetInventoryOverview';
import { FlexAssetsTable } from '@/components/features/assets/AssetFlexTable';
import { FullOwnershipAssetsTable } from '@/components/features/assets/AssetFullOwnershipTable';
import { getAllAdminAssets, getAssetInventoryData } from '@/lib/api/admin/assets';

export const dynamic = 'force-dynamic'; // Ensure cookies are read on every request if needed, or rely on cache

export default async function AssetsPage() {
  let assetsData;
  let inventoryData;

  try {
    // Parallel data fetching
    const [assetsRes, inventoryRes] = await Promise.all([
      getAllAdminAssets(),
      getAssetInventoryData(),
    ]);


    console.log("assetsRes", assetsRes);
    console.log("inventoryRes", inventoryRes);

    assetsData = assetsRes.getAllAdminAssets.data;
    inventoryData = inventoryRes.getAssetInventoryData.statistics;
  } catch (error) {
    console.error("Error loading assets data:", error);
    // In a real app, you might want to throw to trigger error.tsxß
    // or return a partial state.
    // return <div>Error loading data: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-8">
      <AssetPageHeader />

      <section>
        <h2 className="text-2xl font-bold mb-4">Inventory Overview</h2>
        <AssetInventoryOverview data={inventoryData || null} />
      </section>

      <section>
        <FlexAssetsTable data={assetsData || []} />
      </section>

      <section>
        <FullOwnershipAssetsTable data={assetsData || []} />
      </section>
    </div>
  );
}
