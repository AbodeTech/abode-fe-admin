"use client";

import { HAMPER_LEGACY_NAME, LegacyCampaignRedirect } from "@/features/campaigns";

export default function HamperCampaignLegacyPage() {
  return <LegacyCampaignRedirect legacyName={HAMPER_LEGACY_NAME} />;
}
