"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { SampleDataChip } from "./analytics/SampleDataChip";
import type { CategoryStats } from "./analytics/sample-data";

function formatNaira(value: number | null | undefined): string {
  if (value == null || value === 0) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSqm(value: number | null | undefined): string {
  if (value == null || value === 0) return "0 SQM";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M SQM`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k SQM`;
  return `${value.toFixed(0)} SQM`;
}

interface CategoryProps {
  title: string;
  count: number;
  sqm: string;
  revenue: string;
  efficiency: number;
  occupancy: number;
  accentColor: string;
  // Sales
  valueSold: string;
  sqmSold: string;
  moneyReceived: string;
  totalBalance: string;
  // Defaults
  defaultedAssetValue: string;
  defaultersPaid: string;
  defaultersOwing: string;
}

function StatRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 text-xs font-bold tabular-nums wrap-break-word", valueClassName)}>{value}</span>
    </div>
  );
}

function CategoryCard({
  title,
  count,
  sqm,
  revenue,
  efficiency,
  occupancy,
  accentColor,
  valueSold,
  sqmSold,
  moneyReceived,
  totalBalance,
  defaultedAssetValue,
  defaultersPaid,
  defaultersOwing,
}: CategoryProps) {
  return (
    <div className="group w-full min-w-0 flex-1 overflow-hidden rounded-xl border bg-background shadow-sm transition-all hover:border-primary/20">
      {/* Header */}
      <div className="p-4 pb-4 sm:p-6">
        <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-base font-bold tracking-tight wrap-break-word sm:text-lg">{title}</h4>
            <span className="text-xs text-muted-foreground font-medium">{count} Active Assets</span>
          </div>
          <Badge variant="secondary" className="shrink-0 bg-muted/50 text-[10px] font-bold uppercase tracking-wider">
            Category View
          </Badge>
        </div>

        {/* Performance bars */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-tighter">Collection Efficiency</span>
              <span style={{ color: accentColor }}>{efficiency.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${efficiency}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-tighter">Occupancy Rate</span>
              <span>{occupancy.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Portfolio stats */}
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 mb-2">
          <StatRow label="Total SQM" value={sqm} />
          <StatRow label="Gross Revenue" value={revenue} />
          <StatRow label="Value Sold" value={valueSold} />
          <StatRow label="SQM Sold" value={sqmSold} />
          <StatRow label="Money Received" value={moneyReceived} valueClassName="text-emerald-600" />
          <StatRow label="Total Balance" value={totalBalance} valueClassName="text-amber-600" />
        </div>
      </div>

      {/* Defaults section */}
      <div className="border-t border-rose-200/50 bg-rose-500/5 px-4 py-4 sm:px-6">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-rose-500">Defaults</p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <StatRow
            label="Defaulted Asset Value"
            value={defaultedAssetValue}
            valueClassName="text-rose-600"
          />
          <StatRow
            label="Amount Paid"
            value={defaultersPaid}
            valueClassName="text-muted-foreground"
          />
          <StatRow
            label="Amount Owing"
            value={defaultersOwing}
            valueClassName="text-rose-600"
          />
        </div>
      </div>
    </div>
  );
}

interface Props {
  /** ⛔ ticket 17 — no analytics endpoint exists; this is `SAMPLE_CATEGORIES`. */
  data: CategoryStats[];
}

const ACCENTS = ["oklch(var(--primary))", "rgb(59 130 246)"];

export function AssetCategoryHealth({ data }: Props) {
  return (
    <div className="mb-8 min-w-0 space-y-3 lg:mb-12">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Category health
        </p>
        <SampleDataChip />
      </div>

      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-stretch">
        {data.map((category, index) => (
          <CategoryCard
            key={category.title}
            title={category.title}
            count={category.count}
            sqm={formatSqm(category.sqm)}
            revenue={formatNaira(category.revenue)}
            efficiency={category.efficiency}
            occupancy={category.occupancy}
            accentColor={ACCENTS[index % ACCENTS.length]}
            valueSold={formatNaira(category.valueSold)}
            sqmSold={formatSqm(category.sqmSold)}
            moneyReceived={formatNaira(category.moneyReceived)}
            totalBalance={formatNaira(category.totalBalance)}
            defaultedAssetValue={formatNaira(category.defaulting.defaultedAssetValue)}
            defaultersPaid={formatNaira(category.defaulting.defaultersPaid)}
            defaultersOwing={formatNaira(category.defaulting.defaultersOwing)}
          />
        ))}
      </div>
    </div>
  );
}
