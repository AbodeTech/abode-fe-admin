"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CampaignsListPage } from "@/features/campaigns";

export default function CampaignsPage() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading campaigns…" />}>
      <CampaignsListPage />
    </Suspense>
  );
}
