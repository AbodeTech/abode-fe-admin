"use client";

import { useParams } from "next/navigation";

import {
  BlocksManager,
  CommercialStatusMatrix,
  InventoryReconciliationPanel,
  PhysicalStatusMatrix,
  PlotInventoryPanel,
  SqmInventoryPanel,
} from "@/features/assets";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * Both status matrices and `InventoryReconciliationPanel` call endpoints this
 * app invented — the real abode-be-v2 backend has no matching route for
 * either, so they stay hidden outside mock mode.
 *
 * `PlotInventoryPanel` is no longer one of them: rebuilt against the real,
 * verified `GET .../plots` field-ops shape (see plot-inventory.schema.ts's
 * header), it now renders in both modes. Its own internal ground-confirmation
 * badge is still mock-only-gated (a separate, unverified feature) — see the
 * panel's own doc comment.
 */
export default function AssetBlocksPage() {
  const { id } = useParams<{ id: string }>();
  const showMockOnly = isMockApiEnabled();

  return (
    <div className="space-y-6">
      <BlocksManager assetId={id} />
      <PlotInventoryPanel assetId={id} />
      <SqmInventoryPanel assetId={id} />
      {showMockOnly ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <PhysicalStatusMatrix assetId={id} />
          <CommercialStatusMatrix assetId={id} />
        </div>
      ) : null}
      {showMockOnly ? <InventoryReconciliationPanel assetId={id} /> : null}
    </div>
  );
}
