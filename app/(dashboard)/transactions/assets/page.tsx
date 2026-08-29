"use client";

import { Suspense } from "react";
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
  SALES_TYPES,
  useApprovePurchase,
  useDeclinePurchase,
  usePurchases,
  type AssetType,
  type PurchaseStatus,
  type SalesType,
} from "@/features/asset-transactions";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
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
  const user = searchParams.get("user") ?? undefined;

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
      <h3 className="font-sans text-xl font-semibold uppercase text-[#333333]">
        Asset Transactions
      </h3>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error.message ?? "Unable to load asset transactions"}
        </div>
      ) : (
        <div className="space-y-4">
          <PurchaseStatCards />

          <PurchaseFilters />

          <div className="min-w-0 overflow-hidden rounded-md border border-[#E5EAEF] bg-white pb-10">
            <PurchasesTable
              rows={rows}
              isLoading={isLoading}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />

            {!isLoading && total > 0 ? (
              <div className="mt-6 px-4">
                <Pagination count={total} currentIdx={page} limit={DEFAULT_PURCHASE_LIMIT} />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default function AssetTransactionsPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={<PageContentLoader label="Loading asset transactions…" />}>
        <AssetTransactionsContent />
      </Suspense>
    </div>
  );
}
