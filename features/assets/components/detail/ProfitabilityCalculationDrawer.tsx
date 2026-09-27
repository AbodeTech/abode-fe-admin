"use client";

import { AlertTriangle } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import { COST_GROUP_LABELS } from "../../schemas/asset-cost.schema";
import { useProfitabilityDrillDown } from "../../hooks/use-profitability-drilldown";

function formatMarginPercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

interface LineProps {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}

function Line({ label, value, sub, emphasis }: LineProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <span className={cn("text-sm", emphasis && "font-medium")}>{label}</span>
        {sub ? <span className="ml-2 text-xs text-muted-foreground">{sub}</span> : null}
      </div>
      <span className={cn("shrink-0 tabular-nums", emphasis ? "text-sm font-medium" : "text-sm")}>{value}</span>
    </div>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Show your work" for the estate profitability card — GET
 * .../profitability/drill-down's real per-cost-item breakdown, with the
 * backend's own plain-language formula strings shown verbatim rather than
 * this codebase re-deriving them.
 */
export function ProfitabilityCalculationDrawer({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading } = useProfitabilityDrillDown(assetId, undefined, { enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Profitability calculation</SheetTitle>
          <SheetDescription>How the estate profitability figures were derived.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <section className="rounded-lg border p-3">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue</h3>
                {data.revenue_rows.map((row, index) => (
                  <Line
                    key={`${row.offer_type}-${row.size_id}-${row.tenor_months}-${index}`}
                    label={`${row.offer_type}${row.tenor_months ? ` · ${row.tenor_months}mo` : ""}`}
                    value={formatNaira(row.sold_value)}
                    sub={`${row.units.toLocaleString()} unit(s)`}
                  />
                ))}
              </section>

              <section className="rounded-lg border p-3">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Costs</h3>
                {data.cost_rows.map((row) => (
                  <Line
                    key={row.cost_item_id}
                    label={row.name}
                    value={row.counted ? formatNaira(row.amount) : "Not counted"}
                    sub={row.warning ?? `${COST_GROUP_LABELS[row.group]}${row.basis ? ` · ${row.basis}` : ""}`}
                  />
                ))}
                <div className="mt-1 border-t pt-1.5">
                  <Line label="Direct cost + allocated OPEX" value={formatNaira(data.subtotals.direct_cost + data.subtotals.allocated_opex)} emphasis />
                </div>
              </section>

              <section className="rounded-lg border p-3">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Result</h3>
                <Line label="Gross profit" value={formatNaira(data.subtotals.gross_profit)} sub={data.formula.gross_profit} />
                <Line label="Net profit" value={formatNaira(data.subtotals.net_profit)} sub={data.formula.net_profit} emphasis />
                <Line label="Margin" value={formatMarginPercent(data.subtotals.margin_pct)} sub={data.formula.margin_pct} emphasis />
              </section>

              {data.warnings.length > 0 ? (
                <section className="space-y-1 rounded-lg border border-rose-200 bg-rose-500/5 p-3">
                  {data.warnings.map((warning) => (
                    <p key={warning} className="flex items-start gap-2 text-xs text-rose-600">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {warning}
                    </p>
                  ))}
                </section>
              ) : null}

              <section className="space-y-1 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider">Sources</h3>
                <p>{data.formula.cost_per_total_sqm}</p>
                <p>{data.formula.cost_per_saleable_sqm}</p>
                <p>Generated {new Date(data.as_of).toLocaleString("en-NG")}</p>
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
