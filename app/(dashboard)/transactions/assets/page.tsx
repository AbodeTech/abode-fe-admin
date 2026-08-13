"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import {
  ASSET_TYPES,
  DEFAULT_PURCHASE_LIMIT,
  PURCHASE_STATUSES,
  PurchaseFilters,
  PurchaseStatCards,
  PurchasesTable,
  ReviewPurchaseDialog,
  SALES_TYPES,
  usePurchases,
  type AssetType,
  type Purchase,
  type PurchaseStatus,
  type SalesType,
} from "@/features/asset-transactions";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function AssetTransactionsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") ?? undefined;
  const status = parseEnum<PurchaseStatus>(searchParams.get("status"), PURCHASE_STATUSES);
  const salesType = parseEnum<SalesType>(searchParams.get("sales_type"), SALES_TYPES);
  const assetType = parseEnum<AssetType>(searchParams.get("asset_type"), ASSET_TYPES);
  const paymentMethod = searchParams.get("payment_method") ?? undefined;
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;
  // Honoured from the URL for deep links (e.g. from a user detail page),
  // even though this page has no picker for it yet.
  const user = searchParams.get("user") ?? undefined;

  const [reviewing, setReviewing] = useState<Purchase | null>(null);

  const { data, isLoading, error } = usePurchases({
    page,
    search,
    status,
    sales_type: salesType,
    asset_type: assetType,
    payment_method: paymentMethod,
    start_date: startDate,
    end_date: endDate,
    user,
  });

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const filtered = Boolean(
    search || status || salesType || assetType || paymentMethod || startDate || endDate || user
  );

  return (
    <>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Asset transactions</h1>
        <p className="text-muted-foreground">
          Every purchase across the catalogue — new deals and installments, all offer types in one
          list. Transfer-paid rows wait here for review.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading asset transactions</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PurchaseStatCards />

          <PurchaseFilters />

          <PurchasesTable
            rows={rows}
            isLoading={isLoading}
            onReview={setReviewing}
            emptyState={
              filtered ? (
                <EmptyState
                  title="No transactions match these filters"
                  body={
                    salesType && assetType
                      ? "Sales type and asset type both narrow the same field, so some combinations have no rows by definition — full ownership has document fees, flex does not."
                      : "Clear or widen the filters to see the rest."
                  }
                />
              ) : (
                <EmptyState title="No asset transactions yet" body="Purchases appear here as they happen." />
              )
            }
          />

          {!isLoading && total > 0 ? (
            <Pagination count={total} currentIdx={page} limit={DEFAULT_PURCHASE_LIMIT} />
          ) : null}
        </div>
      )}

      <ReviewPurchaseDialog row={reviewing} onClose={() => setReviewing(null)} />
    </>
  );
}

export default function AssetTransactionsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading asset transactions…" />}>
        <AssetTransactionsContent />
      </Suspense>
    </div>
  );
}
