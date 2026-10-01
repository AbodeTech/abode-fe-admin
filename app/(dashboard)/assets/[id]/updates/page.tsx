"use client";

import { useParams } from "next/navigation";

import { AssetUpdates } from "@/features/assets";

export default function AssetUpdatesPage() {
  const { id } = useParams<{ id: string }>();

  return <AssetUpdates assetId={id} />;
}
