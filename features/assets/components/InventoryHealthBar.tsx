"use client";

import { cn } from "@/lib/utils";

import type { PortfolioMetrics } from "../schemas/portfolio-analytics.schema";

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
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-lg font-bold tracking-tight tabular-nums wrap-break-word sm:text-xl">{value}</span>
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
  data: PortfolioMetrics;
}

export function InventoryHealthBar({ data }: Props) {
  const p = data;
  const d = data.defaulting;

  return (
    <div className="mb-6 w-full overflow-hidden rounded-xl border sm:mb-8">
      {/* Portfolio overview */}
      <div className="bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Portfolio Overview
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="Total Portfolio Value" value={formatNaira(p?.total_portfolio_value)} />
          <Metric label="Total Capacity" value={formatSqm(p?.total_capacity_sqm)} />
          <Metric label="Active Customers" value={p?.active_customers ?? 0} subValue="Healthy" subValueVariant="positive" />
          <Metric label="Overall Efficiency" value={p?.overall_efficiency != null ? `${p.overall_efficiency.toFixed(1)}%` : "—"} />
          <Metric label="Total Value Sold" value={formatNaira(p?.total_value_sold)} />
          <Metric label="Total SQM Sold" value={formatSqm(p?.total_sqm_sold)} />
          <Metric label="Total Money Received" value={formatNaira(p?.total_money_received)} />
          <Metric label="Total Balance Owed" value={formatNaira(p?.total_balance_owed)} subValue="Outstanding" subValueVariant="warning" />
        </div>
      </div>

      {/* Defaults section */}
      <div className="border-t border-rose-200/50 bg-rose-500/5 px-4 py-4 sm:px-6 sm:py-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-rose-500">Defaults</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Defaulting Customers" value={d?.customers ?? 0} subValue="At Risk" subValueVariant="danger" />
          <Metric label="Value of Defaulted Assets" value={formatNaira(d?.value_of_defaulted_assets)} subValueVariant="danger" />
          <Metric label="Amount Paid by Defaulters" value={formatNaira(d?.amount_paid_by_defaulters)} subValueVariant="neutral" />
          <Metric label="Amount Still Owing" value={formatNaira(d?.amount_still_owing)} subValue="Unrecovered" subValueVariant="danger" />
        </div>
      </div>
    </div>
  );
}
