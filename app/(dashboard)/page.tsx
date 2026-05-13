"use client";

import { Suspense } from "react";
import {
  useAdminDashboard,
  DashboardQuickOverview,
  TopSellingProducts,
  TopAssociates,
  InviteAdminDialog,
} from "@/features/dashboard";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";
import { DateFilter } from "@/components/shared/DateFilter";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data, isLoading, error } = useAdminDashboard({
    startDate,
    endDate,
  });

  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Welcome back, {user?.firstName || "Admin"}. Here&apos;s an overview of your platform.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          <div className="min-w-0 flex-1 sm:flex-initial">
            <DateFilter />
          </div>
          {isAdmin && (
            <div className="shrink-0 [&_button]:w-full sm:[&_button]:w-auto">
              <InviteAdminDialog />
            </div>
          )}
        </div>
      </div>

      {data && (
        <>
          <DashboardQuickOverview data={data} />

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <TopSellingProducts data={data.top_selling_prop} />
            <TopAssociates data={data.top_associates} />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
