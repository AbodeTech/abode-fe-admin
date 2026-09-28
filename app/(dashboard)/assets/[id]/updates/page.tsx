"use client";

import { useParams } from "next/navigation";

import { AssetEstateUpdates } from "@/features/assets";

export default function AssetUpdatesPage() {
  const { id } = useParams<{ id: string }>();

  return <AssetEstateUpdates assetId={id} />;
}
