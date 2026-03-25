"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import {
  useCompleteAssetTransactions,
  DEFAULT_COMPLETE_ASSET_LIMIT,
  CompleteAssetPaymentsTable,
  useExportCompleteAssetPayments,
} from "@/features/transactions";

function CompletedAssetPaymentsUsersContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const { data, isLoading, error } = useCompleteAssetTransactions(page, DEFAULT_COMPLETE_ASSET_LIMIT);
  const exportMutation = useExportCompleteAssetPayments();

  const handleExport = async () => {
    await exportMutation.mutateAsync();
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading completed payments</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data?.filter((item): item is NonNullable<typeof item> => item !== null && item !== undefined) ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users With Completed Asset Payments</h1>
          <p className="text-muted-foreground">Clients who have completed full payment.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
          {exportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Completed Asset Payments
            </>
          )}
        </Button>
      </div>

      <CompleteAssetPaymentsTable data={rows} />
      <Pagination count={count} currentIdx={page} limit={DEFAULT_COMPLETE_ASSET_LIMIT} />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading completed payments...
        </div>
      )}
    </div>
  );
}

export default function CompletedAssetPaymentsUsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CompletedAssetPaymentsUsersContent />
    </Suspense>
  );
}
