"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import {
  RecruitmentSection,
  SalesRevenueSection,
  ActivitySection,
  MilestonesSection,
  SystemAssociatesTable,
  useSystemAssociatesDashboard,
  DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
} from "@/features/associate-managers";
import { DateFilter } from "@/components/shared/DateFilter";
import { useAuthStore } from "@/store/auth-store";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { PeriodType } from "@/lib/gql/graphql";

const buildDashboardFilter = (
  period: string | null,
  startDate: string | null,
  endDate: string | null
): ManagerDashboardFilterInput | null => {
  if (startDate && endDate) {
    return { periodType: PeriodType.Custom, startDate, endDate };
  }
  const pt =
    period === "week"
      ? PeriodType.Week
      : period === "year"
        ? PeriodType.Year
        : PeriodType.Month;
  return { periodType: pt };
};

function NotAuthorized() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Associate Performance is restricted
        </h2>
        <p className="text-sm text-gray-600">
          Only Super Admins can view the system-wide associate dashboard.
        </p>
      </div>
    </div>
  );
}

function AssociatePerformanceContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role === "admin";

  const period = searchParams.get("period");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const filter = buildDashboardFilter(period, startDate, endDate);

  // Page-local pagination — uses internal state instead of URL `?page=` so it
  // doesn't collide with any other tables on the page in the future.
  const [page, setPage] = useState(1);

  const dashboardQuery = useSystemAssociatesDashboard({
    filter,
    page,
    limit: DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return <NotAuthorized />;

  const dashboard = dashboardQuery.data;
  const isLoading = dashboardQuery.isLoading;
  const error = dashboardQuery.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    const message = (error as Error).message ?? "";
    const isAuthError = /not authorized|only super admins/i.test(message);
    if (isAuthError) return <NotAuthorized />;
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading associate performance</h3>
        <p>{message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        No data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Associate Performance
          </h1>
          <p className="text-sm text-gray-500">
            System-wide view of every associate-tier user
            {dashboard.recruitment.totalAssigned > 0
              ? ` · ${dashboard.recruitment.totalAssigned.toLocaleString()} associates`
              : ""}
          </p>
        </div>
        <DateFilter />
      </div>

      <RecruitmentSection data={dashboard.recruitment} roster="associate" />
      <SalesRevenueSection data={dashboard.salesAndRevenue} roster="associate" />
      <ActivitySection data={dashboard.activity} roster="associate" />
      <MilestonesSection data={dashboard.milestones} roster="associate" />

      <SystemAssociatesTable
        rows={dashboard.associatePros}
        totalCount={dashboard.recruitment.totalAssigned}
        page={page}
        limit={DEFAULT_SYSTEM_ASSOCIATES_LIMIT}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function AssociatePerformancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AssociatePerformanceContent />
    </Suspense>
  );
}
