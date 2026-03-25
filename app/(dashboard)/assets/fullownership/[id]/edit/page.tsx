import { EditFullOwnershipAssetPageClient } from "@/features/assets";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFullOwnershipAssetPage({ params }: PageProps) {
  const { id } = await params;
  const assetName = decodeURIComponent(id);

  return <EditFullOwnershipAssetPageClient assetName={assetName} />;
}
