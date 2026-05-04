"use client";

import { cn } from "@/lib/utils";
import { graphql, FragmentType, useFragment } from "@/lib/gql";

export const InventoryHealthBarFragment = graphql(`
  fragment InventoryHealthBar_statistics on AssetInventoryStatistics {
    portfolio {
      totalPortfolioValue
      totalCapacitySqm
      activeCustomers
      overallEfficiency
      totalValueSold
      totalSqmSold
      totalMoneyReceived
      totalBalanceOwed
      defaulting {
        defaultingCustomers
        defaultedAssetValue
        amountPaidByDefaulters
        amountStillOwing
      }
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
  className?: string;
}

function Metric({ label, value, subValue, subValueVariant = "positive", className }: MetricProps) {
  const subValueStyles = {
    positive: "text-emerald-600 bg-emerald-500/10",
    warning: "text-amber-600 bg-amber-500/10",
    danger: "text-rose-600 bg-rose-500/10",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <div className={cn("flex flex-col gap-1 px-6 first:pl-0 border-r last:border-0 border-border/50", className)}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold tracking-tight">{value}</span>
        {subValue && (
          <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", subValueStyles[subValueVariant])}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  data: FragmentType<typeof InventoryHealthBarFragment> | null | undefined;
}

export function InventoryHealthBar({ data }: Props) {
  const stats = useFragment(InventoryHealthBarFragment, data);
  const p = stats?.portfolio;
  const d = p?.defaulting;

  return (
    <div className="w-full rounded-xl border mb-8 overflow-hidden">
      {/* Portfolio overview */}
      <div className="bg-muted/30 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Portfolio Overview</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Total Portfolio Value" value={formatNaira(p?.totalPortfolioValue)} />
          <Metric label="Total Capacity" value={formatSqm(p?.totalCapacitySqm)} />
          <Metric label="Active Customers" value={p?.activeCustomers ?? 0} subValue="Healthy" subValueVariant="positive" />
          <Metric label="Overall Efficiency" value={p?.overallEfficiency != null ? `${p.overallEfficiency.toFixed(1)}%` : "—"} />
          <Metric label="Total Value Sold" value={formatNaira(p?.totalValueSold)} />
          <Metric label="Total SQM Sold" value={formatSqm(p?.totalSqmSold)} />
          <Metric label="Total Money Received" value={formatNaira(p?.totalMoneyReceived)} />
          <Metric label="Total Balance Owed" value={formatNaira(p?.totalBalanceOwed)} subValue="Outstanding" subValueVariant="warning" />
        </div>
      </div>

      {/* Defaults section */}
      <div className="bg-rose-500/5 border-t border-rose-200/50 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4">Defaults</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Defaulting Customers" value={d?.defaultingCustomers ?? 0} subValue="At Risk" subValueVariant="danger" />
          <Metric label="Value of Defaulted Assets" value={formatNaira(d?.defaultedAssetValue)} subValueVariant="danger" />
          <Metric label="Amount Paid by Defaulters" value={formatNaira(d?.amountPaidByDefaulters)} subValueVariant="neutral" />
          <Metric label="Amount Still Owing" value={formatNaira(d?.amountStillOwing)} subValue="Unrecovered" subValueVariant="danger" className="pr-0" />
        </div>
      </div>
    </div>
  );
}
