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



    assetsData = assetsRes.getAllAdminAssets.data;
    inventoryData = inventoryRes.getAssetInventoryData.statistics;
  } catch (error) {
    console.error("Error loading assets data:", error);
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
