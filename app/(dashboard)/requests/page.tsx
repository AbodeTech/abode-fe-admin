"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequestStats, RequestStats, RequestTypeCards } from "@/features/requests";
import { DateFilter } from "@/components/shared/DateFilter";

function RequestsPageSkeleton() {
  return (
    <div className="mx-4 mt-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-80 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function RequestsDashboardContent() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data: stats, isLoading, error } = useRequestStats({ startDate, endDate });

  if (isLoading) return <RequestsPageSkeleton />;

  if (error) {
    return (
      <div className="mx-4 mt-4 p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading request stats</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Requests</h1>
          <p className="text-gray-600">Overview of all client requests and their statuses</p>
        </div>
        <DateFilter />
      </div>

      <div className="mb-8">
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
