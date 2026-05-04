"use client";

import { DateFilter } from "@/components/shared/DateFilter";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export function AssetDetailFilters() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between mb-6 bg-background p-4 rounded-xl border border-border/50 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Filter Period</span>
        <DateFilter />
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => router.push(pathname)}
        className="text-xs font-bold uppercase tracking-wider hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center gap-1.5"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="3">
          <path d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
          <path d="M12 8v4l3 2" />
        </svg>
        Reset View
      </Button>
    </div>
  );
}
