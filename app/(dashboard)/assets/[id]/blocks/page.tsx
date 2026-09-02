"use client";

import { useParams } from "next/navigation";

import { BlocksManager } from "@/features/assets";

export default function AssetBlocksPage() {
  const { id } = useParams<{ id: string }>();

  return <BlocksManager assetId={id} />;
}
