"use client";


import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SummaryCards,
  SalesTable,
  SalesStatusChips,
  SalesFilters,
  YesterdaySalesCard,
  useSalesList,
  useSalesDashboard,
  DEFAULT_SALES_LIMIT,
} from "@/features/sales";
import type { SalesPlanStatus } from "@/features/sales/schemas/sales.schema";
import { useAuthStore } from "@/store/auth-store";
import { SalesExport } from "@/features/sales/components/SalesExport";
import { SalesCsvExport } from "@/features/sales/components/SalesCsvExport";
import { Pagination } from "@/components/shared/Pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

function SalesContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const q = searchParams.get("q") || null;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const assetType = searchParams.get("assettype") || null;
  const planStatus = (searchParams.get("status") as SalesPlanStatus | null) || null;
  const sourceType = searchParams.get("source") || null;
  const isSuperAdmin = Boolean(useAuthStore((state) => state.user?.role?.is_super_admin));

  const filters = {
    page,
    limit: DEFAULT_SALES_LIMIT,
    q,
    createdStartDate: startDate,
    createdEndDate: endDate,
    assetType,
    planStatus,
    sourceType,
  };

  // The page stays mounted when a filter changes: the previous rows and cards
  // stay on screen while the new ones load, so the filter bar is never torn down.
  const { data: dashboard, error: dashboardError } = useSalesDashboard(
    { startDate, endDate },
    { keepPreviousData: true }
  );
  const {
    data: list,
    isLoading: listLoading,
    isPlaceholderData: listIsStale,
    error: listError,
  } = useSalesList(filters, { keepPreviousData: true });

  const totalCount = list?.meta.total || 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Sales</h1>
          <Link
            href="/analytics/sales"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline group"
          >
            View Analytics
            <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:mb-3 sm:mt-5 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap sm:justify-end">
          <SalesCsvExport filters={filters} />
          <SalesExport filters={filters} />
        </div>
      </div>

      {dashboardError && (
        <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <h3 className="font-bold">Unable to load sales summary</h3>
          <p>{(dashboardError as Error).message || "Sales cards could not be loaded."}</p>
        </div>
      )}
      {isSuperAdmin && <YesterdaySalesCard />}

      {dashboard ? (
        <SummaryCards data={dashboard} />
      ) : (
        !dashboardError && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )
      )}

      <SalesFilters />

      <SalesStatusChips filters={{ q, createdStartDate: startDate, createdEndDate: endDate, assetType, sourceType }} />

      {listError ? (
        <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
          <h3 className="font-bold">Error loading sales</h3>
          <p>{(listError as Error).message || "An unexpected error occurred."}</p>
        </div>
      ) : listLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div
          aria-busy={listIsStale}
          className={cn("transition-opacity", listIsStale && "pointer-events-none opacity-60")}
        >
          <SalesTable records={list?.items} />
        </div>
      )}

      <div className="min-w-0 px-0 sm:px-2">
        <Pagination count={totalCount} currentIdx={page} limit={DEFAULT_SALES_LIMIT} />
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <SalesContent />
    </Suspense>
  );
}
