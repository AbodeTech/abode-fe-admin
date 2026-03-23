"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  defaultingCustomers: number;
  defaultedAssetValue: string;
  defaultersPaid: string;
  defaultersOwing: string;
}

function StatRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={cn("text-xs font-bold tabular-nums", valueClassName)}>{value}</span>
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
  defaultingCustomers,
  defaultedAssetValue,
  defaultersPaid,
  defaultersOwing,
}: CategoryProps) {
  return (
    <div className="flex-1 min-w-[320px] bg-background rounded-xl border shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-lg font-bold tracking-tight">{title}</h4>
            <span className="text-xs text-muted-foreground font-medium">{count} Active Assets</span>
          </div>
          <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold tracking-wider uppercase">
            Category View
          </Badge>
        </div>

        {/* Performance bars */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-tighter">Collection Efficiency</span>
              <span style={{ color: accentColor }}>{efficiency}%</span>
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
              <span>{occupancy}%</span>
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-2">
          <StatRow label="Total SQM" value={sqm} />
          <StatRow label="Gross Revenue" value={revenue} />
          <StatRow label="Value Sold" value={valueSold} />
          <StatRow label="SQM Sold" value={sqmSold} />
          <StatRow label="Money Received" value={moneyReceived} valueClassName="text-emerald-600" />
          <StatRow label="Total Balance" value={totalBalance} valueClassName="text-amber-600" />
        </div>
      </div>

      {/* Defaults section */}
      <div className="bg-rose-500/5 border-t border-rose-200/50 px-6 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-3">Defaults</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <StatRow
            label="Defaulting Customers"
            value={String(defaultingCustomers)}
            valueClassName="text-rose-600"
          />
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

export function AssetCategoryHealth() {
  return (
    <div className="flex flex-wrap gap-6 mb-12">
      <CategoryCard
        title="Flex Assets"
        count={12}
        sqm="450k SQM"
        revenue="₦320M"
        efficiency={88}
        occupancy={92}
        accentColor="oklch(var(--primary))"
        valueSold="₦2.94B"
        sqmSold="720k SQM"
        moneyReceived="₦2.31B"
        totalBalance="₦630M"
        defaultingCustomers={84}
        defaultedAssetValue="₦412M"
        defaultersPaid="₦178M"
        defaultersOwing="₦234M"
      />
      <CategoryCard
        title="Full Ownership"
        count={8}
        sqm="1.65M SQM"
        revenue="₦1.1B"
        efficiency={75}
        occupancy={81}
        accentColor="rgb(59 130 246)"
        valueSold="₦2.24B"
        sqmSold="520k SQM"
        moneyReceived="₦1.60B"
        totalBalance="₦640M"
        defaultingCustomers={43}
        defaultedAssetValue="₦268M"
        defaultersPaid="₦116M"
        defaultersOwing="₦152M"
      />
    </div>
  );
}
