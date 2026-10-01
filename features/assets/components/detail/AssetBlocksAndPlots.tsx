"use client";

import { useState } from "react";

import { BlocksManager } from "./BlocksManager";
import { PlotInventoryPanel } from "./PlotInventoryPanel";
import { PlotSummaryStrip } from "./PlotSummaryStrip";

/**
 * The Blocks & Plots tab, in the asset-detail design's order: the five-figure
 * summary strip, the block cards, then the plot table.
 *
 * The one piece of state here is which block's plot editor is open. Both
 * panels can open it — clicking a block card, or "Manage plots" on the plot
 * table — so it is held above them and there is only ever one editor.
 */
export function AssetBlocksAndPlots({ assetId }: { assetId: string }) {
  const [managingBlockId, setManagingBlockId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PlotSummaryStrip assetId={assetId} />
      <BlocksManager assetId={assetId} managingBlockId={managingBlockId} onManageBlock={setManagingBlockId} />
      <PlotInventoryPanel assetId={assetId} onManageBlock={setManagingBlockId} />
    </div>
  );
}
