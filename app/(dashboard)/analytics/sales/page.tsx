import { AnalyticsFilters } from "@/features/analytics/components/AnalyticsFilters";
import { FinancialSummary } from "@/features/analytics/components/FinancialSummary";
import { AssetBreakdown } from "@/features/analytics/components/AssetBreakdown";
import { RevenueTimeline } from "@/features/analytics/components/RevenueTimeline";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function SalesAnalyticsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <Link 
            href="/sales" 
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full border group-hover:bg-muted transition-colors">
              <MoveLeft className="size-4" />
            </div>
            Back to Sales
          </Link>
          <div className="h-4 w-px bg-border mx-2" />
          <h1 className="text-2xl font-bold tracking-tight">Sales Intelligence</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Mode</span>
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        {/* Filters Panel */}
        <AnalyticsFilters />

        {/* Financial Summary */}
        <FinancialSummary />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <RevenueTimeline />
          <AssetBreakdown />
        </div>
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}
