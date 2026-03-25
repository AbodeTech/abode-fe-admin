import { EditFlexAssetPageClient } from "@/features/assets";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFlexAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = decodeURIComponent(id);

  return <EditFlexAssetPageClient assetName={assetName} />;
}
