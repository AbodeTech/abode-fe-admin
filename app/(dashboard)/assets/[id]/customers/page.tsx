"use client";

import { useParams } from "next/navigation";

import { AssetSubscribers, BackendGapNotice } from "@/features/assets";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * `GET /admin/assets/:assetId/subscribers` — confirmed live against staging
 * that this doesn't exist. There isn't even a permission-backed stub for it
 * on the real backend (only two unused permission keys,
 * `view_asset_subscribers`/`export_asset_subscribers`, never wired to any
 * controller) — this was never actually built. See
 * docs/ASSET-LAND-INVENTORY-BACKEND-GAPS.md.
 */
export default function AssetCustomersPage() {
  const { id } = useParams<{ id: string }>();

  if (!isMockApiEnabled()) return <BackendGapNotice feature="Customers" />;

  return <AssetSubscribers assetId={id} />;
}
