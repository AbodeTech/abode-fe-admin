"use client";

import { availableUnits, type Asset } from "../../schemas/asset.schema";
import { formatSqm } from "@/lib/utils/format";
import { useLandConfiguration } from "../../hooks/use-land-configuration";

/**
 * The header's inventory summary — one of three honest states, never a
 * figure blended across models:
 *
 *  - legacy-only: `land_inventory_state === 'not_configured'` — today's unit
 *    bar, unchanged.
 *  - mixed: a land account exists but `inventory_model_version` is still
 *    `'legacy_units'` (true for every asset throughout Phase 1) — both bars
 *    shown stacked, each clearly labelled, never combined into one
 *    percentage.
 *  - sqm-only: `inventory_model_version === 'sqm_v1'` — the live ledger has
 *    activated and legacy counters are retired. Unreachable in Phase 1 (the
 *    activation gate hasn't been built), kept here so the header is honest
 *    the moment it does.
 */

type HeaderAsset = Pick<
  Asset,
  | '_id'
  | 'sales_cap'
  | 'sold_units'
  | 'reserved_units'
  | 'available_units'
  | 'inventory_model_version'
  | 'land_inventory_state'
>;

function LegacyUnitBar({ asset }: { asset: HeaderAsset }) {
  const available = availableUnits(asset);
  const allocated = asset.sales_cap > 0 ? 1 - available / asset.sales_cap : 0;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium tabular-nums">
          {available.toLocaleString()}{" "}
          <span className="font-normal text-muted-foreground">
            of {asset.sales_cap.toLocaleString()} units available
          </span>
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {asset.sold_units.toLocaleString()} sold
          {asset.reserved_units > 0 ? ` · ${asset.reserved_units.toLocaleString()} reserved` : ""}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/60"
          style={{ width: `${Math.min(100, Math.max(0, allocated * 100))}%` }}
        />
      </div>
    </div>
  );
}

/** A condensed, header-scale version of the Land Account card's reconciliation. */
function SqmSummaryBar({ assetId }: { assetId: string }) {
  const { data } = useLandConfiguration(assetId);

  if (!data || data.state === "not_configured" || data.total_land_sqm == null) return null;

  const total = data.total_land_sqm;
  const assignedPct = total > 0 ? Math.min(100, (data.saleable_assigned_sqm / total) * 100) : 0;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium tabular-nums">
          {formatSqm(data.saleable_assigned_sqm)}{" "}
          <span className="font-normal text-muted-foreground">assigned of {formatSqm(total)} total</span>
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatSqm(data.non_saleable_sqm)} non-saleable
          {data.unclassified_sqm ? ` · ${formatSqm(data.unclassified_sqm)} unclassified` : ""}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${assignedPct}%` }} />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export function AssetInventoryHeaderSummary({ asset }: { asset: HeaderAsset }) {
  if (asset.inventory_model_version === "sqm_v1") {
    return <SqmSummaryBar assetId={asset._id} />;
  }

  if (asset.land_inventory_state === "not_configured") {
    return <LegacyUnitBar asset={asset} />;
  }

  return (
    <div className="space-y-3">
      <div>
        <SectionLabel>Legacy unit inventory</SectionLabel>
        <LegacyUnitBar asset={asset} />
      </div>
      <div>
        <SectionLabel>Land inventory (sqm)</SectionLabel>
        <SqmSummaryBar assetId={asset._id} />
      </div>
    </div>
  );
}
