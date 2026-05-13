"use client";

import { useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClientRequests, DEFAULT_REQUESTS_LIMIT } from "@/features/requests";
import { RequestsFilters, SubRequestStats } from "@/features/requests";
import { RequestsTable } from "@/features/requests";
import { Pagination } from "@/components/shared/Pagination";
import { Loader2 } from "lucide-react";

const customStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const customCategoryOptions = [
  { label: "Payment Related", value: "payment" },
  { label: "Documentation", value: "documentation" },
  { label: "Property Issue", value: "property" },
  { label: "Technical Support", value: "technical" },
  { label: "General Inquiry", value: "general" },
  { label: "Other", value: "other" },
];

const customHasAssetOptions = [
  { label: "With Asset", value: "with_asset" },
  { label: "Without Asset", value: "without_asset" },
];

function CustomRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const hasAsset = searchParams.get("has_asset");
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
    category: category || null,
    hasAsset: hasAsset ? hasAsset === "with_asset" : null,
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
  const handleCategoryChange = (value: string | null) => updateParams({ category: value, page: 1 });
  const handleHasAssetChange = (value: string | null) => updateParams({ has_asset: value, page: 1 });
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
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-4 pb-20 sm:space-y-6 sm:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Custom Requests</h1>
        <p className="text-sm text-muted-foreground sm:text-base">Manage bespoke client requests.</p>
      </div>

      <SubRequestStats analytics={data?.analytics} />

      <RequestsFilters
        status={status}
        paymentStatus={null}
        searchQuery={search}
        category={category}
        hasAsset={hasAsset}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={() => { }}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onHasAssetChange={handleHasAssetChange}
        showPaymentStatus={false}
        statusOptions={customStatusOptions}
        categoryOptions={customCategoryOptions}
        hasAssetOptions={customHasAssetOptions}
      />

      <RequestsTable
        requests={requests}
        isLoading={isLoading}
        requestTypeFilter="custom_request"
      />

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
