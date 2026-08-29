"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import {
  useDashboardKpis,
  useDashboardTopProducts,
  useDashboardTopAssociates,
  DashboardQuickOverview,
  TopSellingProducts,
  TopAssociates,
  InviteAdminDialog,
  DEFAULT_TOP_LIST_LIMIT,
} from "@/features/dashboard";
import { useAuthStore } from "@/store/auth-store";
import { SuspensePageFallback, PageContentLoader } from "@/components/shared/page-content-loader";
import { DateFilter } from "@/components/shared/DateFilter";

function DashboardContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const kpis = useDashboardKpis({ from: startDate, to: endDate });
  const topProducts = useDashboardTopProducts(DEFAULT_TOP_LIST_LIMIT);
  const topAssociates = useDashboardTopAssociates(DEFAULT_TOP_LIST_LIMIT);

  const isAdmin = user?.role === "admin";
  const isLoading = kpis.isLoading || topProducts.isLoading || topAssociates.isLoading;
  const error = kpis.error ?? topProducts.error ?? topAssociates.error;

  if (isLoading) {
    return <PageContentLoader label="Loading dashboard…" />;
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
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

      {kpis.data ? <DashboardQuickOverview data={kpis.data} /> : null}

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-2">
        <TopSellingProducts data={topProducts.data} />
        <TopAssociates data={topAssociates.data} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
