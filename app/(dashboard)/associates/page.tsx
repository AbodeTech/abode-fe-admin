"use client";

import { Suspense } from "react";

import {
  DashboardTopAssociatesTable,
} from "@/features/associates";
import {
  MAX_TOP_LIST_LIMIT,
  useDashboardTopAssociates,
} from "@/features/dashboard";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";

function TopAssociatesContent() {
  const { data, isLoading, error } = useDashboardTopAssociates(MAX_TOP_LIST_LIMIT);

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading top associates</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#333333] sm:text-2xl">Top Associates</h1>
        <p className="mt-1 text-sm text-[#667085]">
          Highest-earning associates by commission paid (lifetime), up to{" "}
          {MAX_TOP_LIST_LIMIT}.
        </p>
      </div>

      <DashboardTopAssociatesTable data={data} isLoading={isLoading} />
    </div>
  );
}

export default function TopAssociatesPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <TopAssociatesContent />
    </Suspense>
  );
}
