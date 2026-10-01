"use client";

import { useParams } from "next/navigation";

import { AssetPerformance, BackendGapNotice } from "@/features/assets";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * The whole tab is built on `GET /admin/assets/:assetId/analytics` — confirmed
 * live against staging that this route doesn't exist at all (the real,
 * portfolio-wide analytics endpoint is `GET /admin/assets/analytics/portfolio`,
 * a different resource entirely, with no per-asset equivalent). Nothing here
 * can render without it, including the profitability-merged payment plan
 * matrix, so the whole tab is hidden rather than shown half-broken — see
 * docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md.
 */
export default function AssetPerformancePage() {
  const { id } = useParams<{ id: string }>();

  if (!isMockApiEnabled()) return <BackendGapNotice feature="Performance" />;

  return <AssetPerformance assetId={id} />;
}
