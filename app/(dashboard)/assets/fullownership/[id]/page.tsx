import { AssetDetailHeader } from "@/components/features/assets/detail/AssetDetailHeader";
import { AssetInventory } from "@/components/features/assets/detail/AssetInventory";
import { SubscribedCustomers } from "@/components/features/assets/detail/SubscribedCustomers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewFullOwnershipAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = id;

  const assetTypeForHeader = "fullownership";
  const assetTypeForData = "full-ownership";

  return (
    <div>
      <AssetDetailHeader assetName={assetName} assetType={assetTypeForHeader} />
      <AssetInventory id={assetName} assetType={assetTypeForData} />
      <SubscribedCustomers assetName={assetName} assetType={assetTypeForData} />
    </div>
  );
}
