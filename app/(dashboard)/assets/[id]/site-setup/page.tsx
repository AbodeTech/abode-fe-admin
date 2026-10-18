"use client";

import { useParams } from "next/navigation";

import { SiteSetup } from "@/features/assets";

export default function AssetSiteSetupPage() {
  const { id } = useParams<{ id: string }>();

  return <SiteSetup assetId={id} />;
}
