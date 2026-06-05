"use client";

import { AnalyticsFilters } from "@/features/analytics/components/AnalyticsFilters";
import { FinancialSummary } from "@/features/analytics/components/FinancialSummary";
import { AssetBreakdown } from "@/features/analytics/components/AssetBreakdown";
import { RevenueTimeline } from "@/features/analytics/components/RevenueTimeline";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SalesAnalyticsContent() {
  const searchParams = useSearchParams();

  const filters = {
    startDate: searchParams.get("start_date") || null,
    endDate: searchParams.get("end_date") || null,
    assetType: searchParams.get("assetType") || null,
    location: searchParams.get("location") || null,
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col bg-background px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-4 pt-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pt-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/sales"
            className="group flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors group-hover:bg-muted">
              <MoveLeft className="size-4" />
            </div>
            <span className="truncate">Back to Sales</span>
          </Link>
          <div className="mx-0 hidden h-4 w-px bg-border sm:mx-2 sm:block" />
          <h1 className="min-w-0 text-2xl font-bold tracking-tight">Sales Intelligence</h1>
        </div>
      </div>

      <div className="min-w-0">
        <AnalyticsFilters filters={filters} />
      </div>
      <FinancialSummary filters={filters} />

      <div className="min-w-0 flex-1 overflow-x-hidden">
        <RevenueTimeline filters={filters} />
        <AssetBreakdown filters={filters} />
      </div>
    </div>
  );
}

export default function SalesAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <SalesAnalyticsContent />
    </Suspense>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-8 px-3 py-8 sm:px-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}
