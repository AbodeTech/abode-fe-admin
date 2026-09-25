"use client";

import { useParams } from "next/navigation";

import { AssetEstateUpdates, BackendGapNotice } from "@/features/assets";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * `GET /admin/assets/:assetId/updates` — confirmed live against staging that
 * this doesn't exist. No estate-update/announcement module exists anywhere on
 * the real backend at all. See docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md.
 */
export default function AssetUpdatesPage() {
  const { id } = useParams<{ id: string }>();

  if (!isMockApiEnabled()) return <BackendGapNotice feature="Updates" />;

  return <AssetEstateUpdates assetId={id} />;
}
