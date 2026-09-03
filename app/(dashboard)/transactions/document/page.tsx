"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { useAuthStore } from "@/store/auth-store";
import {
  ASSET_TYPES,
  DEFAULT_DOCUMENT_PURCHASE_LIMIT,
  DocumentPurchaseExport,
  DocumentStatCards,
  PURCHASE_STATUSES,
  PurchaseFilters,
  PurchasesTable,
  useApprovePurchase,
  useDeclinePurchase,
  useDocumentPurchases,
  type AssetType,
  type PurchaseStatus,
} from "@/features/asset-transactions";

/* ============================================================
 * Document / development-levy transactions — GET /admin/transactions/documents.
 *
 * Its own BE endpoint rather than a filter on the asset list: v2 keeps document
 * fees in a separate ledger (`purchase_kind: 'dev_levy'`), which is why this
 * page exists at all. The rows are ordinary purchase Transactions, so they use
 * the same table and the same review pair as asset transactions.
 *
 * `fo_outright_doc` rows — the document half of an outright purchase — show no
 * Review action: the BE answers OUTRIGHT_SIBLING_REQUIRED there, because
 * approving the parent land row settles both.
 *
 * The old summary cards are gone with the GraphQL query behind them; v2 has no
 * transaction stats endpoint (the same gap the asset screen carries).
 * ============================================================ */

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function DocumentTransactionsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  // The gate this screen has always had. It is the only FE permission check in
  // the transactions area — the BE's own RBAC is what actually enforces it.
  const { user } = useAuthStore();
  const canReview =
    (user?.permissions ?? []).includes("asset_transactions") ||
    Boolean(user?.role?.is_super_admin);

  const filters = {
    search: searchParams.get("search") ?? undefined,
    status: parseEnum<PurchaseStatus>(searchParams.get("status"), PURCHASE_STATUSES),
    asset_type: parseEnum<AssetType>(searchParams.get("asset_type"), ASSET_TYPES),
    payment_method: searchParams.get("payment_method") ?? undefined,
    start_date: searchParams.get("start_date") ?? undefined,
    end_date: searchParams.get("end_date") ?? undefined,
    user: searchParams.get("user") ?? undefined,
  };

  const { data, isLoading, error } = useDocumentPurchases({ page, ...filters });

  const { mutateAsync: approvePurchase } = useApprovePurchase();
  const { mutateAsync: declinePurchase } = useDeclinePurchase();

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  const handleApprove = async (id: string) => {
    await approvePurchase({ id });
  };

  const handleDecline = async (id: string, message: string) => {
    await declinePurchase({ id, reason: message });
  };

  return (
    <>
      {/* Global figures — the endpoint takes a date range only, so these do
          NOT follow the filters below. */}
      <DocumentStatCards />

      <PurchaseFilters
        showSalesType={false}
        searchPlaceholder="Search for a payer or an asset by name, location..."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="font-sans text-xl font-semibold uppercase text-[#333333]">
          Document / Development Transactions
        </h3>
        <DocumentPurchaseExport filters={filters} />
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error.message ?? "Unable to load document transactions"}
        </div>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAEF] bg-white pb-10">
          <PurchasesTable
            rows={rows}
            isLoading={isLoading}
            onApprove={handleApprove}
            onDecline={handleDecline}
            canReview={canReview}
            emptyTitle="No document transactions found"
            emptyDescription="There are no document transactions to display at this time."
          />

          {!isLoading && total > 0 ? (
            <div className="mt-6 px-4">
              <Pagination
                count={total}
                currentIdx={page}
                limit={DEFAULT_DOCUMENT_PURCHASE_LIMIT}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export default function DocumentTransactionsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading document transactions…" />}>
        <DocumentTransactionsContent />
      </Suspense>
    </div>
  );
}
