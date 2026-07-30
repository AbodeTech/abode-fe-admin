"use client";

import {
  AssetHealthBar,
  PaymentPlanMatrix,
  SampleDataBanner,
  SAMPLE_ASSET_HEALTH,
  SAMPLE_SIZE_PLANS,
} from "@/features/assets";

export default function AssetPerformancePage() {
  return (
    <div className="space-y-6">
      {/*
        ⛔ ticket 17b — there is no asset analytics endpoint. The panels below
        are the v1 designs driven by fixtures, kept so the layout stays
        reviewable; every figure on this tab is invented. The banner states
        that once, and each panel carries a chip of its own.
      */}
      <SampleDataBanner>
        <strong className="font-medium text-foreground">Sample data.</strong> There&apos;s no asset
        analytics endpoint yet, so collection efficiency, occupancy and defaulting figures
        aren&apos;t available. These panels run on fixtures so the layout can be reviewed —
        don&apos;t read the numbers.
      </SampleDataBanner>

      <AssetHealthBar data={SAMPLE_ASSET_HEALTH} />
      <PaymentPlanMatrix data={SAMPLE_SIZE_PLANS} />
    </div>
  );
}
