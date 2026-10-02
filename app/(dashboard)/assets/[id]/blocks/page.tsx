"use client";

import { useParams } from "next/navigation";

import { AssetBlocksAndPlots } from "@/features/assets";

export default function AssetBlocksPage() {
  const { id } = useParams<{ id: string }>();

  return <AssetBlocksAndPlots assetId={id} />;
}
