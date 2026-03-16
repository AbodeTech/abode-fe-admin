"use client";

import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}

function Metric({ label, value, subValue, className }: MetricProps) {
  return (
    <div className={cn("flex flex-col gap-1 px-8 first:pl-0 border-r last:border-0 border-border/50", className)}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {subValue && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function InventoryHealthBar() {
  return (
    <div className="w-full bg-muted/30 rounded-xl border p-6 mb-8">
      <div className="flex flex-wrap gap-y-6">
        <Metric 
          label="Total Portfolio Value" 
          value="₦8.42B" 
          subValue="+12.4%" 
        />
        <Metric 
          label="Total Capacity" 
          value="2.1M SQM" 
        />
        <Metric 
          label="Active Customers" 
          value="3,450" 
          subValue="Healthy"
        />
        <Metric 
          label="Overall Efficiency" 
          value="88.2%" 
          className="pr-0"
        />
      </div>
    </div>
  );
}
