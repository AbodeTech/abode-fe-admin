"use client";

import { cn } from "@/lib/utils";

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

export function InventoryHealthBar() {
  return (
    <div className="w-full rounded-xl border mb-8 overflow-hidden">
      {/* Portfolio overview */}
      <div className="bg-muted/30 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Portfolio Overview</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Total Portfolio Value" value="₦8.42B" subValue="+12.4%" subValueVariant="positive" />
          <Metric label="Total Capacity" value="2.1M SQM" />
          <Metric label="Active Customers" value="3,450" subValue="Healthy" subValueVariant="positive" />
          <Metric label="Overall Efficiency" value="88.2%" />
          <Metric label="Total Value Sold" value="₦5.18B" subValue="+8.7%" subValueVariant="positive" />
          <Metric label="Total SQM Sold" value="1.24M SQM" />
          <Metric label="Total Money Received" value="₦3.91B" />
          <Metric label="Total Balance Owed" value="₦1.27B" subValue="Outstanding" subValueVariant="warning" />
        </div>
      </div>

      {/* Defaults section */}
      <div className="bg-rose-500/5 border-t border-rose-200/50 px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4">Defaults</p>
        <div className="flex flex-wrap gap-y-5">
          <Metric label="Defaulting Customers" value="127" subValue="At Risk" subValueVariant="danger" />
          <Metric label="Value of Defaulted Assets" value="₦680M" subValueVariant="danger" />
          <Metric label="Amount Paid by Defaulters" value="₦294M" subValueVariant="neutral" />
          <Metric label="Amount Still Owing" value="₦386M" subValue="Unrecovered" subValueVariant="danger" className="pr-0" />
        </div>
      </div>
    </div>
  );
}
