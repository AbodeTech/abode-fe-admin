"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import {
  useCompleteAssetTransactions,
  DEFAULT_COMPLETE_ASSET_LIMIT,
  CompleteAssetPaymentsTable,
} from "@/features/transactions";

function CompleteAssetPaymentsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const { data, isLoading, error } = useCompleteAssetTransactions(page, DEFAULT_COMPLETE_ASSET_LIMIT);

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading completed payments</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Completed Asset Payments</h1>
        <p className="text-muted-foreground">Clients who have completed full payment.</p>
      </div>

      <div className="min-w-0">
        <CompleteAssetPaymentsTable data={rows} />
      </div>
      <div className="min-w-0 px-0 sm:px-1">
        <Pagination count={count} currentIdx={page} limit={DEFAULT_COMPLETE_ASSET_LIMIT} />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading completed payments...
        </div>
      )}
    </div>
  );
}

export default function CompleteAssetPaymentsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CompleteAssetPaymentsContent />
    </Suspense>
  );
}
