import { AssetDetailHeader } from "@/features/assets";
import { 
  AssetDetailFilters, 
  AssetHealthBar, 
  PaymentPlanMatrix, 
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
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <AssetDetailHeader assetName={assetName} assetType={assetType} />
      <AssetDetailFilters />
      <AssetHealthBar />
      <PaymentPlanMatrix />
      <SubscribedCustomers assetName={assetName} assetType={assetType} />
    </div>
  );
}
