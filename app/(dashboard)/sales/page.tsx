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
import { Loader2 } from "lucide-react";

function SalesContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || null;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const assetType = searchParams.get("assettype") || null;

  const { data: summary, isLoading: summaryLoading } = useSalesSummary();
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
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

      {summary && <SummaryCards data={summary} />}

      <SalesTable records={list?.data?.filter((item): item is NonNullable<typeof item> => item !== null)} />

      <div className="px-4">
        <Pagination count={totalCount} currentIdx={page} limit={DEFAULT_SALES_LIMIT} />
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SalesContent />
    </Suspense>
  );
}
