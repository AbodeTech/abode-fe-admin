import { AssetDetailHeader } from "@/features/assets";
import {
  AssetDetailFilters,
  AssetAnalyticsSection,
  BlocksManager,
  SubscribedCustomers
} from "@/features/assets/components/detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewFullOwnershipAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = id;

  const assetTypeForHeader = "fullownership";
  const assetTypeForData = "full-ownership";

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <AssetDetailHeader assetName={assetName} assetType={assetTypeForHeader} />
      <AssetDetailFilters />
      <AssetAnalyticsSection />
      <BlocksManager assetName={assetName} assetType={assetTypeForData} />
      <SubscribedCustomers assetName={assetName} assetType={assetTypeForData} />
    </div>
  );
}
