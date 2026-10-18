"use client";

import { Suspense } from "react";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { CampaignCreateWizard } from "@/features/campaigns";

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<PageContentLoader label="Loading wizard…" />}>
      <CampaignCreateWizard />
    </Suspense>
  );
}
