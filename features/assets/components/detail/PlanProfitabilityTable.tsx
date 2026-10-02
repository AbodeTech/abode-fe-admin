"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useProfitabilityMatrix } from "../../hooks/use-profitability-matrix";
import { planTenorLabel } from "../../schemas/asset-analytics.schema";
import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { planProfitRows } from "../../schemas/profitability-matrix.schema";
import { DetailPanel } from "./DetailPanel";

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums";

/**
 * Profit by payment plan — one row per product, size and tenor, from
 * GET /admin/assets/:assetId/profitability/matrix. It is the same calculation
 * as "Profitability by product" above, taken one level further down, so the
 * rows of a product add up to that product's line.
 *
 * The design has no table for this. It sits below the design's own table and
 * stays closed until asked for, so the design's layout is what opens.
 *
 *  - Gross profit      sold value less direct cost (the backend's
 *                      `forecast_gross_profit`)
 *  - Allocated OPEX    this row's part of the operating costs
 *  - Net contribution  gross profit less allocated OPEX
 *
 * These are the backend's own three figures and names. They are not the
 * direct / shared split shown in the table above, which is worked out from
 * the drill-down; the two tables agree on the net figure, not on how the cost
 * is divided.
 *  - Margin            net contribution as a share of sold value; a dash when
 *                      nothing has been sold on the row
 *
 * Like all profitability here it is current, and does not follow the date
 * range at the top of the tab.
 */
export function PlanProfitabilityTable({ assetId }: { assetId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useProfitabilityMatrix(assetId, undefined, { enabled: open });
  const { data: asset } = useAssetDetail(assetId);

  const rows = data && asset ? planProfitRows(data.rows, asset.offers) : [];

  return (
    <DetailPanel
      title="Profit by payment plan"
      description="The same calculation, for each product, size and tenor"
      flush
      action={
        <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </Button>
      }
    >
      {!open ? null : error ? (
        <p className="p-6 text-center text-sm text-rose-600">Couldn&apos;t load profit by plan: {error.message}</p>
      ) : isLoading || !data || !asset ? (
        <div className="p-4">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Nothing has been sold on this estate yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className={HEAD}>Product / Size / Plan</th>
                <th className={HEAD}>Units</th>
                <th className={HEAD}>Sold value</th>
                <th className={HEAD}>Received</th>
                <th className={HEAD}>Gross profit</th>
                <th className={HEAD}>Allocated OPEX</th>
                <th className={HEAD}>Net contribution</th>
                <th className={HEAD}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.offer_type}-${row.size_id ?? "none"}-${row.tenor_months ?? "none"}`}
                  className="border-b last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-2.5 py-2.5 text-left">
                    <span className="font-semibold">{OFFER_TYPE_LABELS[row.offer_type]}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {row.size_sqm == null ? "Size not on this asset" : `${row.size_sqm.toLocaleString()} sqm`} ·{" "}
                      {planTenorLabel(row.tenor_months ?? 0)}
                      {row.complete ? "" : " · provisional"}
                    </span>
                  </td>
                  <td className={CELL}>{row.units.toLocaleString()}</td>
                  <td className={CELL}>{formatNairaCompact(row.sold_value)}</td>
                  <td className={CELL}>
                    {formatNairaCompact(row.received)}
                    {row.collection_efficiency_pct != null ? (
                      <span className="block text-[10px] text-muted-foreground">
                        {row.collection_efficiency_pct.toFixed(0)}% collected
                      </span>
                    ) : null}
                  </td>
                  <td className={CELL}>{formatNairaCompact(row.forecast_gross_profit)}</td>
                  <td className={CELL}>{formatNairaCompact(row.allocated_opex)}</td>
                  <td
                    className={cn(
                      CELL,
                      "font-semibold",
                      row.forecast_net_contribution >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {formatNairaCompact(row.forecast_net_contribution)}
                  </td>
                  <td className={CELL}>{row.margin_pct == null ? "—" : `${row.margin_pct.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DetailPanel>
  );
}
