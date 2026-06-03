"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClientRequests, DEFAULT_REQUESTS_LIMIT } from "@/features/requests";
import { RequestsFilters } from "@/features/requests";
import { RequestsTable } from "@/features/requests";
import { SubRequestStats } from "@/features/requests";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";

function LocationChangeRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentstatus");
  const assetType = searchParams.get("assettype");
  const search = searchParams.get("search") ?? "";
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data, isLoading, error } = useClientRequests({
    page,
    limit: DEFAULT_REQUESTS_LIMIT,
    requestType: "location_change",
    status,
    paymentStatus,
    assetType,
    searchQuery: search || null,
    startDate,
    endDate,
  });

  const requests = data?.requests ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? DEFAULT_REQUESTS_LIMIT;

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const qs = params.toString();
      router.push(qs ? `?${qs}` : "", { scroll: false });
    },
    [router, searchParams]
  );

  const handleStatusChange = (value: string | null) => updateParams({ status: value, page: 1 });
  const handlePaymentChange = (value: string | null) => updateParams({ paymentstatus: value, page: 1 });
  const handleAssetTypeChange = (value: string | null) => updateParams({ assettype: value, page: 1 });
  const handleSearchChange = (value: string) => updateParams({ search: value || null, page: 1 });

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading location change requests</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-4 pb-20 sm:space-y-6 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Location Change Requests</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Manage property location change requests.</p>
      </div>

      <SubRequestStats analytics={data?.analytics} />

      <RequestsFilters
        status={status}
        paymentStatus={paymentStatus}
        assetType={assetType}
        searchQuery={search}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentChange}
        onAssetTypeChange={handleAssetTypeChange}
        onSearchChange={handleSearchChange}
        assetTypeOptions={[
          { label: "Flex", value: "flex" },
          { label: "Full-Ownership", value: "full-ownership" },
        ]}
      />

      <RequestsTable requests={requests} isLoading={isLoading} requestTypeFilter="location_change" />

      <Pagination count={total} currentIdx={page} limit={limit} />
    </div>
  );
}

export default function LocationChangeRequestsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <LocationChangeRequestsContent />
    </Suspense>
  );
}
