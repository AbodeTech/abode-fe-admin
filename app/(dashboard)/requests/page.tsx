"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRequestStats } from "@/features/requests";
import { RequestStats } from "@/features/requests";
import { RequestTypeCards } from "@/features/requests";
import { Loader2 } from "lucide-react";

function RequestsDashboardContent() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data: stats, isLoading, error } = useRequestStats({
    startDate,
    endDate,
  });

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading request stats</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground">
          Monitor client requests and fees collected.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading statistics...
        </div>
      )}

      <RequestStats stats={stats ?? {}} />

      <RequestTypeCards stats={stats ?? {}} />
    </div>
  );
}

export default function RequestsDashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <RequestsDashboardContent />
    </Suspense>
  );
}
