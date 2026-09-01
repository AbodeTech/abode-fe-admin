"use client";

import { LegacyCampaignRedirect, PLOTS_LEGACY_NAME } from "@/features/campaigns";

export default function PlotsProjectLegacyPage() {
  return <LegacyCampaignRedirect legacyName={PLOTS_LEGACY_NAME} />;
}
