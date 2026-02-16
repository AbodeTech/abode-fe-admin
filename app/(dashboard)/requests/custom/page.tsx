"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClientRequests, DEFAULT_REQUESTS_LIMIT } from "@/features/requests";
import { RequestsFilters } from "@/features/requests";
import { RequestsTable } from "@/features/requests";
import { Pagination } from "@/components/shared/Pagination";
import { Loader2 } from "lucide-react";

const customStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

function CustomRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data, isLoading, error } = useClientRequests({
    page,
    limit: DEFAULT_REQUESTS_LIMIT,
    requestType: "custom_request",
    status,
    paymentStatus: null,
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
      router.push(qs ? `?${qs}` : "");
    },
    [router, searchParams]
  );

  const handleStatusChange = (value: string | null) => updateParams({ status: value, page: 1 });
  const handleSearchChange = (value: string) => updateParams({ search: value || null, page: 1 });

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading custom requests</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Requests</h1>
        <p className="text-muted-foreground">Manage bespoke client requests.</p>
      </div>

      <RequestsFilters
        status={status}
        paymentStatus={null}
        searchQuery={search}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={() => { }}
        onSearchChange={handleSearchChange}
        showPaymentStatus={false}
        statusOptions={customStatusOptions}
      />

      <RequestsTable requests={requests} isLoading={isLoading} />

      <Pagination count={total} currentIdx={page} limit={limit} />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests...
        </div>
      )}
    </div>
  );
}

export default function CustomRequestsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CustomRequestsContent />
    </Suspense>
  );
}
