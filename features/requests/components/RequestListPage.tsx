"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";

import {
  PAYMENT_STATUSES,
  REQUEST_STATUSES,
  REQUEST_TYPE_LABELS,
  type PaymentStatus,
  type RequestStatus,
  type RequestType,
} from "../schemas/request.schema";
import { useClientRequests, DEFAULT_REQUESTS_LIMIT } from "../hooks/use-client-requests";
import { RequestsFilters } from "./RequestsFilters";
import { RequestsTable } from "./RequestsTable";
import { SubRequestStats } from "./SubRequestStats";

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/**
 * The per-type list page. Three routes share it — they differ only in the
 * `request_type` pinned on the query and the heading copy — so the filter
 * wiring, URL handling and pagination live once.
 */
function RequestListContent({ requestType, description }: { requestType: RequestType; description: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const status = parseEnum<RequestStatus>(searchParams.get("status"), REQUEST_STATUSES);
  const paymentStatus = parseEnum<PaymentStatus>(searchParams.get("payment_status"), PAYMENT_STATUSES);
  const search = searchParams.get("search") ?? "";
  const dateFrom = searchParams.get("start_date") ?? undefined;
  const dateTo = searchParams.get("end_date") ?? undefined;

  const { data, isLoading, error } = useClientRequests({
    page,
    limit: DEFAULT_REQUESTS_LIMIT,
    request_type: requestType,
    status: status ?? undefined,
    payment_status: paymentStatus ?? undefined,
    search: search || undefined,
    date_from: dateFrom,
    date_to: dateTo,
  });

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") params.delete(key);
        else params.set(key, String(value));
      });
      const qs = params.toString();
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading {REQUEST_TYPE_LABELS[requestType].toLowerCase()} requests</h3>
        <p>{error.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-4 pb-20 sm:space-y-6 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {REQUEST_TYPE_LABELS[requestType]} Requests
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
      </div>

      <SubRequestStats analytics={data?.analytics} />

      <RequestsFilters
        status={status}
        paymentStatus={paymentStatus}
        searchQuery={search}
        onStatusChange={(value) => updateParams({ status: value, page: 1 })}
        onPaymentStatusChange={(value) => updateParams({ payment_status: value, page: 1 })}
        onSearchChange={(value) => updateParams({ search: value || null, page: 1 })}
        // Custom requests carry no fee — a payment filter would only ever say "no fee".
        showPaymentStatus={requestType !== "custom_request"}
      />

      <RequestsTable requests={data?.requests} isLoading={isLoading} requestTypeFilter={requestType} />

      <Pagination count={data?.total ?? 0} currentIdx={page} limit={data?.limit ?? DEFAULT_REQUESTS_LIMIT} />
    </div>
  );
}

export function RequestListPage(props: { requestType: RequestType; description: string }) {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <RequestListContent {...props} />
    </Suspense>
  );
}
