"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  CommercialPlansFilters,
  CommercialPlansTable,
  DEFAULT_COMMERCIAL_PLANS_LIMIT,
  useCommercialPlans,
} from "@/features/commercial-plots";

function parseSuspended(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function CommercialPlotsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const suspended = parseSuspended(searchParams.get("suspended"));

  const { data, isLoading, error } = useCommercialPlans({
    page,
    limit: DEFAULT_COMMERCIAL_PLANS_LIMIT,
    suspended,
  });

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading commercial plot plans</h3>
          <p>{error.message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const count = data?.meta.total ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Commercial plots</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Payment plans for commercial offers. Create the offer on an asset; this list is
          the plans buyers already hold.
        </p>
      </div>

      <CommercialPlansFilters />
      <CommercialPlansTable rows={data?.items ?? []} isLoading={isLoading} />

      {count > DEFAULT_COMMERCIAL_PLANS_LIMIT ? (
        <Pagination count={count} currentIdx={page} limit={DEFAULT_COMMERCIAL_PLANS_LIMIT} />
      ) : null}
    </div>
  );
}

export default function CommercialPlotsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <CommercialPlotsContent />
    </Suspense>
  );
}
