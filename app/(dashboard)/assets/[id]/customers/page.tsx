"use client";

import { useParams } from "next/navigation";

import { AssetSubscribers } from "@/features/assets";

export default function AssetCustomersPage() {
  const { id } = useParams<{ id: string }>();

  return <AssetSubscribers assetId={id} />;
}
