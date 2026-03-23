"use client";

import { cn } from "@/lib/utils";

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

export function AssetHealthBar() {
  // Mock data — replace with real API data
  const metrics = {
    startValue: "₦2.45B",
    soldValue: "₦1.12B",
    soldPct: "45.7% sold",
    remainingValue: "₦1.33B",
    sqmSold: "84,500 SQM",
    sqmRemaining: "98,200 SQM",
    efficiency: "84.2%",
    totalCustomers: 154,
    defaultedCustomers: 12,
    terminatedCustomers: 7,
    // Defaults
    defaultedValue: "₦284M",
    defaultedBalance: "₦118M",
    // Terminations
    terminatedValue: "₦196M",
    terminatedBalance: "₦74M",
  };

  const activeCustomers = metrics.totalCustomers - metrics.defaultedCustomers - metrics.terminatedCustomers;
  const activePct = (activeCustomers / metrics.totalCustomers) * 100;
  const defaultedPct = (metrics.defaultedCustomers / metrics.totalCustomers) * 100;
  const terminatedPct = (metrics.terminatedCustomers / metrics.totalCustomers) * 100;

  return (
    <div className="mb-8 rounded-2xl border overflow-hidden">
      {/* Portfolio overview row */}
      <div className="bg-slate-50 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Portfolio Overview</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Starting Inventory" value={metrics.startValue} />
          <Metric label="Total Realized" value={metrics.soldValue} subValue={metrics.soldPct} subValueVariant="positive" trend="up" />
          <Metric label="Remaining Value" value={metrics.remainingValue} />
          <Metric label="Total SQM Sold" value={metrics.sqmSold} subValueVariant="positive" />
          <Metric label="Total SQM Remaining" value={metrics.sqmRemaining} />
          <Metric label="Portfolio Health" value={metrics.efficiency} subValue="Efficiency" subValueVariant="neutral" trend="neutral" />
        </div>
      </div>

      {/* Defaults + Terminations row */}
      <div className="border-t grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
        {/* Defaults */}
        <div className="bg-rose-500/5 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4">
            Defaults
            <span className="ml-2 text-rose-400 font-medium normal-case tracking-normal">
              ({metrics.defaultedCustomers} customers)
            </span>
          </p>
          <div className="flex flex-wrap gap-y-4">
            <Metric
              label="Defaulted Asset Value"
              value={metrics.defaultedValue}
              subValueVariant="danger"
            />
            <Metric
              label="Outstanding Balance"
              value={metrics.defaultedBalance}
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
              ({metrics.terminatedCustomers} customers)
            </span>
          </p>
          <div className="flex flex-wrap gap-y-4">
            <Metric
              label="Terminated Asset Value"
              value={metrics.terminatedValue}
              subValueVariant="warning"
            />
            <Metric
              label="Outstanding Balance"
              value={metrics.terminatedBalance}
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
            <span className="text-rose-600">Defaulted: {metrics.defaultedCustomers}</span>
            <span className="text-amber-600">Terminated: {metrics.terminatedCustomers}</span>
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
