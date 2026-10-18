"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CampaignDetailPage } from "@/features/campaigns";

export default function CampaignRewardsPage() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading rewards…" />}>
      <CampaignDetailPage tab="rewards" />
    </Suspense>
  );
}
