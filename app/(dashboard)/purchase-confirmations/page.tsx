"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { Pagination } from "@/components/shared/Pagination";
import {
  ConfirmationStatsStrip,
  DEFAULT_CONFIRMATIONS_LIMIT,
  PurchaseConfirmationDetailModal,
  PurchaseConfirmationsFilters,
  PurchaseConfirmationsTable,
  ResolveDisputeModal,
  usePurchaseConfirmations,
  useResendConfirmationEmail,
  type PurchaseConfirmationRow,
} from "@/features/purchase-confirmations";

function PurchaseConfirmationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "disputed";
  const product = searchParams.get("product") || "all";
  const search = searchParams.get("q") || "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "status" && value === "disputed")) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // filters reset pagination
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading, error } = usePurchaseConfirmations({
    page,
    limit: DEFAULT_CONFIRMATIONS_LIMIT,
    status,
    product,
    search,
  });
  const resendEmail = useResendConfirmationEmail();

  const [detailRow, setDetailRow] = useState<PurchaseConfirmationRow | null>(null);
  const [resolveRow, setResolveRow] = useState<PurchaseConfirmationRow | null>(null);

  const handleResendEmail = async (row: PurchaseConfirmationRow) => {
    try {
      await resendEmail.mutateAsync({ planId: row.id });
      toast.success(`Confirmation email re-sent to ${row.buyerEmail}.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't resend the email. Try again."
      );
    }
  };

  const handleResolveFromDetail = (row: PurchaseConfirmationRow) => {
    setDetailRow(null);
    setResolveRow(row);
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading purchase confirmations</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Purchase Confirmations</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Who has verified their purchase details, who is still waiting, and
            who reported a problem.
          </p>
        </div>
      </div>

      <ConfirmationStatsStrip />

      <PurchaseConfirmationsFilters
        status={status}
        product={product}
        search={search}
        onStatusChange={(value) => setParam("status", value)}
        onProductChange={(value) => setParam("product", value)}
        onSearchChange={(value) => setParam("q", value)}
      />

      <div className="min-w-0 space-y-4">
        <PurchaseConfirmationsTable
          rows={rows}
          isLoading={isLoading}
          onView={setDetailRow}
          onResolve={setResolveRow}
          onResendEmail={handleResendEmail}
        />
        <Pagination count={count} currentIdx={page} limit={DEFAULT_CONFIRMATIONS_LIMIT} />
      </div>

      <PurchaseConfirmationDetailModal
        open={detailRow !== null}
        row={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onResolve={handleResolveFromDetail}
        onResendEmail={handleResendEmail}
      />

      <ResolveDisputeModal
        open={resolveRow !== null}
        row={resolveRow}
        onOpenChange={(open) => !open && setResolveRow(null)}
      />
    </div>
  );
}

export default function PurchaseConfirmationsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <PurchaseConfirmationsContent />
    </Suspense>
  );
}
