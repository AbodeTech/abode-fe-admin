"use client";

import { Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNaira, formatSqm } from "@/lib/utils/format";

import { useEstateProfitability } from "../../hooks/use-estate-profitability";

interface MetricProps {
  label: string;
  value: string;
  dot: string;
}

function Metric({ label, value, dot }: MetricProps) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot)} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function formatMarginPercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(1)}%`;
}

interface Props {
  assetId: string;
  onViewCalculation: () => void;
}

/**
 * The estate-level profitability calculation. The real backend recognises
 * exactly one number (no forecast/actual/budget/committed toggle) — an
 * approved incurred/reversal/adjustment event — so this card no longer
 * carries an accounting-basis switch.
 */
export function EstateProfitabilityCard({ assetId, onViewCalculation }: Props) {
  const { data, isLoading } = useEstateProfitability(assetId);

  if (isLoading || !data) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </section>
    );
  }

  const { summary } = data;

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Estate profitability</h2>
          <p className="text-xs text-muted-foreground">
            {data.asset.name} — reproduced from this estate&apos;s costs and revenue.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onViewCalculation}>
          <Calculator className="mr-1.5 h-3.5 w-3.5" />
          View calculation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-4 p-4 sm:grid-cols-3 sm:p-6">
        <Metric label="Revenue" value={formatNaira(summary.revenue)} dot="bg-emerald-500" />
        <Metric label="Received" value={formatNaira(summary.received)} dot="bg-emerald-500" />
        <Metric label="Direct cost" value={formatNaira(summary.direct_cost)} dot="bg-sky-500" />
        <Metric label="Allocated OPEX" value={formatNaira(summary.allocated_opex)} dot="bg-amber-400" />
        <Metric label="Cost per total sqm" value={formatNaira(summary.cost_per_total_sqm)} dot="bg-sky-500" />
        <Metric label="Cost per saleable sqm" value={formatNaira(summary.cost_per_saleable_sqm)} dot="bg-sky-500" />
        <Metric label="Gross profit" value={formatNaira(summary.gross_profit)} dot="bg-violet-500" />
        <Metric label="Net profit" value={formatNaira(summary.net_profit)} dot="bg-violet-500" />
        <Metric label="Margin" value={formatMarginPercent(summary.margin_pct)} dot="bg-violet-500" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span>
          Total land: {formatSqm(data.total_land_sqm)} · Saleable: {formatSqm(data.saleable_sqm)}
        </span>
        <span>{summary.units.toLocaleString()} unit(s) · {formatSqm(summary.sqm)}</span>
      </div>
      <div className="border-t px-4 py-2 text-xs text-muted-foreground sm:px-6">
        Figures as of {new Date(data.as_of).toLocaleString("en-NG")}
      </div>

      {data.warnings.length > 0 ? (
        <div className="space-y-1 border-t border-rose-200 bg-rose-500/5 px-4 py-3 text-xs text-rose-600 sm:px-6">
          {data.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
