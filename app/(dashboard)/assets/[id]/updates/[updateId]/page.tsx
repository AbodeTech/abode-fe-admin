"use client";

import { useParams } from "next/navigation";

import { EstateUpdateDetail } from "@/features/assets";

export default function AssetUpdateDetailPage() {
  const { id, updateId } = useParams<{ id: string; updateId: string }>();

  return <EstateUpdateDetail assetId={id} updateId={updateId} />;
}
