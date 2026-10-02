"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { useEstateProfitability } from "../../hooks/use-estate-profitability";
import { useProfitabilityDrillDown } from "../../hooks/use-profitability-drilldown";
import { costSplitByProduct } from "../../schemas/profitability-drilldown.schema";
import { DetailPanel } from "./DetailPanel";

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums";

/**
 * Profitability by product, with the design's columns.
 *
 * Two reads feed it:
 *  - GET .../profitability            `by_product` — revenue, profit, margin.
 *  - GET .../profitability/drill-down every cost item with the products it
 *    was charged to, which is what tells direct cost from shared cost.
 *
 * Column by column:
 *  - Forecast revenue  `revenue`: the sold value of the product's sales —
 *                      "forecast" because part of it is still to be paid.
 *  - Direct cost       costs charged to this product alone.
 *  - Shared cost       this product's slice of costs split across products.
 *                      (See `costSplitByProduct`.)
 *  - Gross profit      `net_profit`: revenue minus both cost columns. It is
 *                      labelled as the design labels it; the backend calls
 *                      this figure net profit, because operating costs are
 *                      already inside the two cost columns.
 *  - Margin            `margin_pct`: that profit over revenue. `null` (no
 *                      revenue yet) renders as an em-dash, never 0%.
 */
export function ProductProfitabilityComparison({
  assetId,
  onViewCalculation,
}: {
  assetId: string;
  onViewCalculation?: () => void;
}) {
  const { data, isLoading, error } = useEstateProfitability(assetId);
  const { data: drillDown } = useProfitabilityDrillDown(assetId);
  const costSplit = drillDown ? costSplitByProduct(drillDown.cost_rows) : null;

  return (
    <DetailPanel
      title="Profitability by product"
      description="Each product's revenue against its own costs and its share of costs split across products"
      flush
      action={
        onViewCalculation ? (
          <Button variant="outline" size="sm" onClick={onViewCalculation}>
            View calculation
          </Button>
        ) : null
      }
    >
      {error ? (
        <p className="p-6 text-center text-sm text-rose-600">Couldn&apos;t load profitability: {error.message}</p>
      ) : isLoading || !data ? (
        <div className="p-4">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : data.by_product.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">This estate has no offers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className={HEAD}>Product</th>
                <th className={HEAD}>Forecast revenue</th>
                <th className={HEAD}>Direct cost</th>
                <th className={HEAD}>Shared cost</th>
                <th className={HEAD}>Gross profit</th>
                <th className={HEAD}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.by_product.map((row) => {
                // No cost row names this product → it has no cost, a real zero.
                const costs = costSplit ? (costSplit.get(row.offer_type) ?? { direct: 0, shared: 0 }) : null;
                return (
                <tr key={row.offer_type} className="border-b last:border-b-0 hover:bg-muted/40">
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-semibold">
                    {OFFER_TYPE_LABELS[row.offer_type] ?? row.offer_type}
                  </td>
                  <td className={CELL}>{formatNairaCompact(row.revenue)}</td>
                  <td className={CELL}>{formatNairaCompact(costs?.direct)}</td>
                  <td className={CELL}>{formatNairaCompact(costs?.shared)}</td>
                  <td className={cn(CELL, "font-semibold", row.net_profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    {formatNairaCompact(row.net_profit)}
                  </td>
                  <td className={CELL}>{row.margin_pct == null ? "—" : `${row.margin_pct.toFixed(1)}%`}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DetailPanel>
  );
}
