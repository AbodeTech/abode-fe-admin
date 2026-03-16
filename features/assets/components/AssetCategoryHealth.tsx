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
}

function CategoryCard({ title, count, sqm, revenue, efficiency, occupancy, accentColor }: CategoryProps) {
  return (
    <div className="flex-1 min-w-[300px] p-6 bg-background rounded-xl border shadow-sm group hover:border-primary/20 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="text-lg font-bold tracking-tight">{title}</h4>
          <span className="text-xs text-muted-foreground font-medium">{count} Active Assets</span>
        </div>
        <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold tracking-wider uppercase">
          Category View
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total SQM</span>
          <p className="text-xl font-bold">{sqm}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gross Revenue</span>
          <p className="text-xl font-bold">{revenue}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
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
      />
      <CategoryCard 
        title="Full Ownership"
        count={8}
        sqm="1.65M SQM"
        revenue="₦1.1B"
        efficiency={75}
        occupancy={81}
        accentColor="rgb(59 130 246)" // Blue
      />
    </div>
  );
}
