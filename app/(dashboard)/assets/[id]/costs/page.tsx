"use client";

import { useParams } from "next/navigation";

import { AssetCosts } from "@/features/assets";

export default function AssetCostsPage() {
  const { id } = useParams<{ id: string }>();

  return <AssetCosts assetId={id} />;
}
