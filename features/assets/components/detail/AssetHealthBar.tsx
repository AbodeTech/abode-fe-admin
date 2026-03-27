"use client";

import { cn } from "@/lib/utils";
import { graphql, FragmentType, useFragment } from "@/lib/gql";

export const AssetHealthBarFragment = graphql(`
  fragment AssetHealthBar_statistics on AssetAnalyticsStatistics {
    totalInventory
    totalRealised
    remainingValue
    totalSqmSold
    totalSqmRemaining
    efficiencyRate
    totalActiveCustomers
    defaulting {
      totalDefaultingCustomers
      totalDefaultedAssetValue
      totalDefaultedOutstandingValue
    }
    terminated {
      totalTerminatedCustomers
      totalTerminatedAssetValue
      totalTerminatedBalance
    }
  }
`);

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
  trend?: "up" | "down" | "neutral";
}

function Metric({ label, value, subValue, subValueVariant = "neutral", trend }: MetricProps) {
  const subValueStyles = {
    positive: "text-emerald-600 bg-emerald-500/10",
    warning: "text-amber-600 bg-amber-500/10",
    danger: "text-rose-600 bg-rose-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <div className="flex flex-col gap-1 px-6 first:pl-0 border-r last:border-0 border-border/50 min-w-[160px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight leading-none">{value}</span>
        {subValue && (
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", subValueStyles[subValueVariant])}>
            {subValue}
          </span>
        )}
      </div>
      {trend && (
        <div className={cn(
          "h-1 w-8 mt-2 rounded-full",
          trend === "up" ? "bg-emerald-500" : trend === "down" ? "bg-rose-500" : "bg-slate-300"
        )} />
      )}
    </div>
  );
}

interface Props {
  data: FragmentType<typeof AssetHealthBarFragment> | null | undefined;
}

export function AssetHealthBar({ data }: Props) {
  const stats = useFragment(AssetHealthBarFragment, data);

  const totalCustomers = (stats?.totalActiveCustomers ?? 0) +
    (stats?.defaulting?.totalDefaultingCustomers ?? 0) +
    (stats?.terminated?.totalTerminatedCustomers ?? 0);

  const activeCustomers = stats?.totalActiveCustomers ?? 0;
  const defaultedCustomers = stats?.defaulting?.totalDefaultingCustomers ?? 0;
  const terminatedCustomers = stats?.terminated?.totalTerminatedCustomers ?? 0;

  const activePct = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
  const defaultedPct = totalCustomers > 0 ? (defaultedCustomers / totalCustomers) * 100 : 0;
  const terminatedPct = totalCustomers > 0 ? (terminatedCustomers / totalCustomers) * 100 : 0;

  const soldPct = stats?.totalInventory && stats.totalRealised
    ? `${((stats.totalRealised / stats.totalInventory) * 100).toFixed(1)}% sold`
    : undefined;

  return (
    <div className="mb-8 rounded-2xl border overflow-hidden">
      {/* Portfolio overview row */}
      <div className="bg-slate-50 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Portfolio Overview</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Starting Inventory" value={formatNaira(stats?.totalInventory)} />
          <Metric label="Total Realized" value={formatNaira(stats?.totalRealised)} subValue={soldPct} subValueVariant="positive" trend="up" />
          <Metric label="Remaining Value" value={formatNaira(stats?.remainingValue)} />
          <Metric label="Total SQM Sold" value={formatSqm(stats?.totalSqmSold)} subValueVariant="positive" />
          <Metric label="Total SQM Remaining" value={formatSqm(stats?.totalSqmRemaining)} />
          <Metric
            label="Portfolio Health"
            value={stats?.efficiencyRate != null ? `${stats.efficiencyRate.toFixed(1)}%` : "—"}
            subValue="Efficiency"
            subValueVariant="neutral"
            trend="neutral"
          />
        </div>
      </div>

      {/* Defaults + Terminations row */}
      <div className="border-t grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        {/* Defaults */}
        <div className="bg-rose-500/5 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4">
            Defaults
            <span className="ml-2 text-rose-400 font-medium normal-case tracking-normal">
              ({defaultedCustomers} customers)
            </span>
          </p>
          <div className="flex flex-wrap gap-y-4">
            <Metric
              label="Defaulted Asset Value"
              value={formatNaira(stats?.defaulting?.totalDefaultedAssetValue)}
              subValueVariant="danger"
            />
            <Metric
              label="Outstanding Balance"
              value={formatNaira(stats?.defaulting?.totalDefaultedOutstandingValue)}
              subValue="Unrecovered"
              subValueVariant="danger"
            />
          </div>
        </div>

        {/* Terminations */}
        <div className="bg-amber-500/5 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-4">
            Terminations
            <span className="ml-2 text-amber-500 font-medium normal-case tracking-normal">
              ({terminatedCustomers} customers)
            </span>
          </p>
          <div className="flex flex-wrap gap-y-4">
            <Metric
              label="Terminated Asset Value"
              value={formatNaira(stats?.terminated?.totalTerminatedAssetValue)}
              subValueVariant="warning"
            />
            <Metric
              label="Outstanding Balance"
              value={formatNaira(stats?.terminated?.totalTerminatedBalance)}
              subValue="Unrecovered"
              subValueVariant="warning"
            />
          </div>
        </div>
      </div>

      {/* Customer health bar */}
      <div className="border-t bg-white px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Customer Health</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-600">Active: {activeCustomers}</span>
            <span className="text-rose-600">Defaulted: {defaultedCustomers}</span>
            <span className="text-amber-600">Terminated: {terminatedCustomers}</span>
          </div>
          <div
            className="h-2 w-full bg-muted rounded-full overflow-hidden flex"
            role="progressbar"
            aria-valuenow={activePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Customer health breakdown"
          >
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${activePct}%` }} />
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${defaultedPct}%` }} />
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${terminatedPct}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active ({activePct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-rose-500" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Defaulted ({defaultedPct.toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Terminated ({terminatedPct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
