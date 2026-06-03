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

export default async function ViewFlexAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = id;
  const assetType = "flex";

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <AssetDetailHeader assetName={assetName} assetType={assetType} />
      <AssetDetailFilters />
      <AssetAnalyticsSection />
      <BlocksManager assetName={assetName} assetType={assetType} />
      <SubscribedCustomers assetName={assetName} assetType={assetType} />
    </div>
  );
}
