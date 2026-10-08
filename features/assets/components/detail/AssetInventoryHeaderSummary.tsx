"use client";

import { availableUnits, type Asset } from "../../schemas/asset.schema";
import { formatSqm, formatSqmExact } from "@/lib/utils/format";
import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { useSqmInventory } from "../../hooks/use-sqm-inventory";
import { ledgerTotals, productPositions } from "../../schemas/sqm-inventory.schema";

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
 *    activated (the Overview's "Activate sqm inventory" notice) and legacy
 *    counters are retired. This is the state the asset-detail design draws.
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

/**
 * The design's header bar, for an estate on the live sqm ledger: "X of Y
 * saleable sqm available", split into sold, selling and available. Figures
 * are the per-product roll-up of GET .../sqm-inventory.
 *
 * Defaulted-retained is shown as a separate callout but has no bar segment:
 * the backend reports it as a subset of selling/sold, not a separate bucket,
 * so drawing it as a fourth slice would make the bar add up to more than the
 * estate.
 */
function LedgerAvailabilityBar({ assetId }: { assetId: string }) {
  const { data } = useSqmInventory(assetId);
  if (!data) return null;

  const totals = ledgerTotals(productPositions(data.positions));
  // Active, but nothing on the ledger yet — fall back to the land account.
  if (totals.capacity_sqm <= 0) return <SqmSummaryBar assetId={assetId} />;

  const width = (value: number) => `${Math.min(100, Math.max(0, (value / totals.capacity_sqm) * 100))}%`;

  return (
    <section className="rounded-lg border px-4 py-3.5">
      <div className="flex flex-col gap-1 text-[13px] sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <strong className="font-semibold tabular-nums">
          {totals.available_sqm.toLocaleString()} of {totals.capacity_sqm.toLocaleString()} saleable sqm available
        </strong>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatSqmExact(totals.sold_sqm)} sold · {formatSqmExact(totals.selling_sqm)} selling
        </span>
      </div>
      <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Inventory position">
        <div className="h-full bg-muted-foreground/50" style={{ width: width(totals.sold_sqm) }} />
        <div className="h-full bg-amber-500" style={{ width: width(totals.selling_sqm) }} />
        <div className="h-full bg-foreground/75" style={{ width: width(totals.available_sqm) }} />
      </div>
      {totals.defaulted_sqm > 0 && (
        <div className="mt-2.5 inline-flex flex-wrap items-center gap-x-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-800">
          <span className="font-semibold tabular-nums">{formatSqmExact(totals.defaulted_sqm)}</span>
          <span>defaulted land retained</span>
          <span className="text-rose-700/80">· included in sold or selling above</span>
        </div>
      )}
    </section>
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
    return <LedgerAvailabilityBar assetId={asset._id} />;
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
