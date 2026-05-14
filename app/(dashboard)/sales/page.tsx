"use client";


import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SummaryCards,
  SalesTable,
  useSalesRecords,
  useSalesSummary,
  DEFAULT_SALES_LIMIT,
} from "@/features/sales";
import { SalesExport } from "@/features/sales/components/SalesExport";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

function SalesContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || null;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const assetType = searchParams.get("assettype") || null;

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useSalesSummary({
    startDate,
    endDate,
  });
  const {
    data: list,
    isLoading: listLoading,
    error: listError,
  } = useSalesRecords({
    page,
    limit: DEFAULT_SALES_LIMIT,
    search,
    startDate,
    endDate,
    assetType,
  });

  const totalCount = list?.count || 0;

  if (summaryLoading || listLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading sales</h3>
        <p>{(listError as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

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
        <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
          <SalesExport
            filters={{
              page,
              limit: DEFAULT_SALES_LIMIT,
              search,
              startDate,
              endDate,
              assetType,
            }}
          />
        </div>
      </div>

      {summaryError && (
        <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <h3 className="font-bold">Unable to load sales summary</h3>
          <p>{(summaryError as Error).message || "Sales cards could not be loaded."}</p>
        </div>
      )}
      {summary && <SummaryCards data={summary} />}

      <SalesTable records={list?.data?.filter((item): item is NonNullable<typeof item> => item !== null)} />

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
