"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { useCostCoverage } from "../../hooks/use-cost-coverage";
import { useEstateProfitability } from "../../hooks/use-estate-profitability";
import { DetailPanel } from "./DetailPanel";

function Metric({
  label,
  value,
  note,
  valueClass,
}: {
  label: string;
  value: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="py-3 sm:px-3.5 sm:first:pl-0">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className={cn("text-base font-semibold tabular-nums", valueClass)}>{value}</strong>
      <small className="mt-1 block text-[10px] text-muted-foreground">{note}</small>
    </div>
  );
}

function Line({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between py-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <b className={cn("font-semibold tabular-nums", valueClass)}>{value}</b>
    </div>
  );
}

/**
 * The Overview's money summary, from two real endpoints:
 *
 *  - GET .../profitability — `summary.revenue`, `received`, `direct_cost`,
 *    `allocated_opex`, `net_profit`, `margin_pct`. The backend's margin is
 *    net profit over revenue, so the third figure is Net profit (revenue
 *    minus direct cost minus allocated opex), not the design's "Gross
 *    profit" — pairing a gross figure with a net margin would not add up.
 *  - GET .../costs/coverage — how many cost items are still incomplete, the
 *    "Missing inputs" line. An incomplete item is unknown, never a zero.
 *
 * The backend recognises one cost number (approved incurred entries), so
 * there is no separate "cost paid" or "committed cost" total to show; the
 * lines below are the ones it does report.
 */
export function FinancialPositionCard({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_profitability");

  const { data, isLoading, error } = useEstateProfitability(assetId, undefined, { enabled: canView });
  const { data: coverage } = useCostCoverage(assetId, { enabled: permissions.has("view_asset_costs") });

  if (!canView) return null;

  const summary = data?.summary;
  const totalCost = summary ? summary.direct_cost + summary.allocated_opex : null;
  const missing = coverage?.totals.incomplete ?? null;

  return (
    <DetailPanel
      title="Financial position"
      description="Recognised figures to date, with unknowns visible"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={`/assets/${assetId}/performance`}>Open performance</Link>
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : error || !summary ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {error?.message ?? "No profitability figures for this asset yet."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 border-b sm:grid-cols-3 sm:divide-x">
            <Metric label="Revenue" value={formatNairaCompact(summary.revenue)} note="From the profitability calculation" />
            <Metric
              label="Total cost"
              value={formatNairaCompact(totalCost)}
              note={missing ? `Excludes ${missing} incomplete item${missing === 1 ? "" : "s"}` : "Direct cost + allocated opex"}
            />
            <Metric
              label="Net profit"
              value={formatNairaCompact(summary.net_profit)}
              valueClass={summary.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"}
              note={summary.margin_pct == null ? "No revenue yet" : `${summary.margin_pct.toFixed(1)}% margin`}
            />
          </div>
          <div className="pt-2.5">
            <Line label="Realized cash" value={formatNairaCompact(summary.received)} />
            <Line label="Direct cost" value={formatNairaCompact(summary.direct_cost)} />
            <Line label="Allocated opex" value={formatNairaCompact(summary.allocated_opex)} />
            <div className="mt-1 border-t pt-1">
              <Line
                label="Missing inputs"
                value={missing == null ? "—" : missing === 0 ? "None" : `${missing} cost item${missing === 1 ? "" : "s"}`}
                valueClass={missing ? "text-amber-600" : undefined}
              />
            </div>
          </div>
        </>
      )}
    </DetailPanel>
  );
}
