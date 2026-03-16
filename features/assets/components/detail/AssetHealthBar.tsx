"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

function Metric({ label, value, subValue, className, trend }: MetricProps) {
  return (
    <div className={cn("px-6 py-4 border-r last:border-r-0 border-border/50", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-medium text-muted-foreground">
            {subValue}
          </span>
        )}
      </div>
      {trend && (
        <div className={cn(
          "h-1 w-8 mt-3 rounded-full",
          trend === "up" ? "bg-emerald-500" : trend === "down" ? "bg-rose-500" : "bg-slate-300"
        )} />
      )}
    </div>
  );
}

export function AssetHealthBar() {
  // Mock data as per request focus on design
  const metrics = {
    startValue: "₦2.45B",
    soldValue: "₦1.12B",
    remaining: "₦1.33B",
    totalCustomers: 154,
    defaulted: 12,
    efficiency: "84.2%"
  };

  return (
    <Card className="mb-8 border-none bg-slate-50 shadow-none overflow-hidden rounded-2xl">
      <CardContent className="p-0 flex flex-wrap lg:flex-nowrap items-stretch divide-x divide-border/30">
        <Metric 
          label="Starting Inventory" 
          value={metrics.startValue} 
          className="flex-1 min-w-[200px]"
        />
        <Metric 
          label="Total Realized" 
          value={metrics.soldValue} 
          subValue="45.7% sold"
          trend="up"
          className="flex-1 min-w-[200px]"
        />
        <Metric 
          label="Remaining Value" 
          value={metrics.remaining} 
          className="flex-1 min-w-[200px]"
        />
        <Metric 
          label="Portfolio Health" 
          value={metrics.efficiency} 
          subValue="Efficiency"
          trend="neutral"
          className="flex-1 min-w-[200px]"
        />
        <div className="px-8 py-6 flex-[1.5] bg-white min-w-[300px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Customer Health
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>Active: {metrics.totalCustomers}</span>
              <span className="text-rose-600">Defaulted: {metrics.defaulted}</span>
            </div>
            <div 
              className="h-2 w-full bg-muted rounded-full overflow-hidden flex"
              role="progressbar"
              aria-valuenow={((metrics.totalCustomers - metrics.defaulted) / metrics.totalCustomers) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Active Account vs Defaulted Ratio"
            >
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${((metrics.totalCustomers - metrics.defaulted) / metrics.totalCustomers) * 100}%` }} 
              />
              <div 
                className="h-full bg-rose-500" 
                style={{ width: `${(metrics.defaulted / metrics.totalCustomers) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
