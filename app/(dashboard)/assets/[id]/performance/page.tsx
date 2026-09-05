"use client";

import { useParams } from "next/navigation";

import { AssetPerformance } from "@/features/assets";

export default function AssetPerformancePage() {
  const { id } = useParams<{ id: string }>();

  return <AssetPerformance assetId={id} />;
}
