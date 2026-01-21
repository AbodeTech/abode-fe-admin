import { AssetDetailHeader } from "@/components/features/assets/detail/AssetDetailHeader";
import { AssetInventory } from "@/components/features/assets/detail/AssetInventory";
import { SubscribedCustomers } from "@/components/features/assets/detail/SubscribedCustomers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewFlexAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = id;
  const assetType = "flex";

  return (
    <div>
      <AssetDetailHeader assetName={assetName} assetType={assetType} />
      <AssetInventory id={assetName} assetType={assetType} />
      <SubscribedCustomers assetName={assetName} assetType={assetType} />
    </div>
  );
}
