"use client";

import { cn } from "@/lib/utils";

import { SampleDataChip } from "../analytics/SampleDataChip";
import type { AssetHealthStats } from "../analytics/sample-data";

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

interface MetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  subValueVariant?: "positive" | "warning" | "danger" | "neutral";
}

function Metric({ label, value, subValue, subValueVariant = "neutral" }: MetricProps) {
  const subValueStyles = {
    positive: "text-emerald-600 bg-emerald-500/10",
    warning: "text-amber-600 bg-amber-500/10",
    danger: "text-rose-600 bg-rose-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-lg font-bold tracking-tight tabular-nums wrap-break-word sm:text-xl">
          {value}
        </span>
        {subValue && (
          <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", subValueStyles[subValueVariant])}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  /** ⛔ ticket 17 — no per-asset analytics endpoint; this is `SAMPLE_ASSET_HEALTH`. */
  data: AssetHealthStats;
}

export function AssetHealthBar({ data }: Props) {
  const { defaulting, terminated } = data;

  const totalCustomers = data.activeCustomers + defaulting.customers + terminated.customers;
  const pct = (n: number) => (totalCustomers > 0 ? (n / totalCustomers) * 100 : 0);

  const activePct = pct(data.activeCustomers);
  const defaultedPct = pct(defaulting.customers);
  const terminatedPct = pct(terminated.customers);

  const soldPct =
    data.startingInventory > 0
      ? `${((data.totalRealised / data.startingInventory) * 100).toFixed(1)}% sold`
      : undefined;

  return (
    <div className="w-full overflow-hidden rounded-xl border">
      {/* Asset overview */}
      <div className="bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Asset Overview
          </p>
          <SampleDataChip />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Starting Inventory" value={formatNaira(data.startingInventory)} />
          <Metric
            label="Total Realized"
            value={formatNaira(data.totalRealised)}
            subValue={soldPct}
            subValueVariant="positive"
          />
          <Metric label="Remaining Value" value={formatNaira(data.remainingValue)} />
          <Metric label="Total SQM Sold" value={formatSqm(data.sqmSold)} />
          <Metric label="SQM Remaining" value={formatSqm(data.sqmRemaining)} />
          <Metric
            label="Collection Efficiency"
            value={`${data.efficiencyRate.toFixed(1)}%`}
            subValue="Collected"
            subValueVariant="neutral"
          />
        </div>
      </div>

      {/* Defaults + terminations */}
      <div className="grid grid-cols-1 border-t md:grid-cols-2">
        <div className="border-b border-rose-200/50 bg-rose-500/5 px-4 py-4 sm:px-6 sm:py-5 md:border-b-0 md:border-r">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-rose-600">
            Defaults
            <span className="ml-2 font-medium normal-case tracking-normal text-rose-500/80">
              ({defaulting.customers} customers)
            </span>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <Metric label="Defaulted Asset Value" value={formatNaira(defaulting.assetValue)} />
            <Metric
              label="Outstanding Balance"
              value={formatNaira(defaulting.outstanding)}
              subValue="Unrecovered"
              subValueVariant="danger"
            />
          </div>
        </div>

        <div className="bg-amber-500/5 px-4 py-4 sm:px-6 sm:py-5">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Terminations
            <span className="ml-2 font-medium normal-case tracking-normal text-amber-500/80">
              ({terminated.customers} customers)
            </span>
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <Metric label="Terminated Asset Value" value={formatNaira(terminated.assetValue)} />
            <Metric
              label="Outstanding Balance"
              value={formatNaira(terminated.outstanding)}
              subValue="Unrecovered"
              subValueVariant="warning"
            />
          </div>
        </div>
      </div>

      {/* Customer health */}
      <div className="border-t px-4 py-4 sm:px-6 sm:py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Customer Health
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-bold">
            <span className="text-emerald-600">Active: {data.activeCustomers}</span>
            <span className="text-rose-600">Defaulted: {defaulting.customers}</span>
            <span className="text-amber-600">Terminated: {terminated.customers}</span>
          </div>
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(activePct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Customer health breakdown"
          >
            <div className="h-full bg-emerald-500" style={{ width: `${activePct}%` }} />
            <div className="h-full bg-rose-500" style={{ width: `${defaultedPct}%` }} />
            <div className="h-full bg-amber-400" style={{ width: `${terminatedPct}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {[
              { dot: "bg-emerald-500", label: "Active", value: activePct },
              { dot: "bg-rose-500", label: "Defaulted", value: defaultedPct },
              { dot: "bg-amber-400", label: "Terminated", value: terminatedPct },
            ].map((legend) => (
              <div key={legend.label} className="flex items-center gap-1.5">
                <div className={cn("size-2 rounded-full", legend.dot)} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {legend.label} ({legend.value.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
