"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequestStats, RequestStats, RequestTypeCards } from "@/features/requests";
import { DateFilter } from "@/components/shared/DateFilter";

function RequestsPageSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-20 sm:px-6 mt-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-80 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function RequestsDashboardContent() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("start_date") ?? undefined;
  const dateTo = searchParams.get("end_date") ?? undefined;

  const { data: stats, isLoading, error } = useRequestStats({ date_from: dateFrom, date_to: dateTo });

  if (isLoading) return <RequestsPageSkeleton />;

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 sm:px-6 mt-4 p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading request stats</h3>
        <p>{error.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-20 sm:px-6 mt-4">
      <div className="mb-6 flex flex-col gap-4 min-w-0 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:text-3xl">Manage Requests</h1>
          <p className="text-sm text-gray-600 sm:text-base">Overview of all client requests and their statuses</p>
        </div>
        <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
          <DateFilter />
        </div>
      </div>

      <div className="mb-6 min-w-0 sm:mb-8">
        <RequestStats stats={stats} />
      </div>

      <RequestTypeCards stats={stats} />
    </div>
  );
}

export default function RequestsDashboardPage() {
  return (
    <Suspense fallback={<RequestsPageSkeleton />}>
      <RequestsDashboardContent />
    </Suspense>
  );
}
