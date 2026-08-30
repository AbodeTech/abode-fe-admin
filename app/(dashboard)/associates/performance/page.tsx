"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import type { ProGroup } from "@/features/associate-managers/schemas/manager-dashboard.schema";
import {
  RecruitmentSection,
  SalesRevenueSection,
  ActivitySection,
  MilestonesSection,
  SystemAssociatesTable,
  useSystemAssociatesDashboard,
  DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
  ProGroupDrawer,
} from "@/features/associate-managers";
import { buildManagerDashboardFilter, buildManagerDashboardPeriodFilter } from "@/features/associate-managers/lib/dashboard-filter";
import { DashboardPeriodFilter } from "@/features/associate-managers/components/DashboardPeriodFilter";
import { useAuthStore } from "@/store/auth-store";

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
  const router = useRouter();
  const { user } = useAuthStore();

  const openGroup = (group: ProGroup) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("open_group", group);
    params.set("group_page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const isSuperAdmin = user?.role === "admin";

  const period = searchParams.get("period");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const proGroup = searchParams.get("pro_group");
  const proSort = searchParams.get("pro_sort");

  const filter = buildManagerDashboardFilter({
    period,
    startDate,
    endDate,
    month,
    year,
    proGroup,
    proSort,
  });
  const periodFilter = buildManagerDashboardPeriodFilter({
    period,
    startDate,
    endDate,
    month,
    year,
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [period, startDate, endDate, month, year, proGroup, proSort]);

  const kpiQuery = useSystemAssociatesDashboard(periodFilter, { enabled: isSuperAdmin });
  const tableQuery = useSystemAssociatesDashboard(
    { ...filter, page, limit: DEFAULT_SYSTEM_ASSOCIATES_LIMIT },
    { enabled: isSuperAdmin, keepPreviousData: true }
  );

  if (!isSuperAdmin) return <NotAuthorized />;

  const dashboard = kpiQuery.data;
  const tableData = tableQuery.data;
  const isPageLoading = kpiQuery.isLoading && !kpiQuery.data;
  const tableLoading = tableQuery.isFetching;
  const error = kpiQuery.error || tableQuery.error;

  if (isPageLoading) {
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
            {dashboard.recruitment.total_assigned > 0
              ? ` · ${dashboard.recruitment.total_assigned.toLocaleString()} associates`
              : ""}
          </p>
        </div>
        <DashboardPeriodFilter />
      </div>

      <RecruitmentSection data={dashboard.recruitment} roster="associate" onOpenGroup={openGroup} />
      <SalesRevenueSection data={dashboard.sales_and_revenue} roster="associate" onOpenGroup={openGroup} />
      <ActivitySection data={dashboard.activity} roster="associate" onOpenGroup={openGroup} />
      <MilestonesSection data={dashboard.milestones} roster="associate" onOpenGroup={openGroup} />

      <ProGroupDrawer
        viewMode="system-associates"
        managerId={null}
        periodFilter={periodFilter}
        roster="associate"
      />

      <SystemAssociatesTable
          rows={tableData?.associate_pros ?? dashboard.associate_pros}
          totalCount={
            tableData?.associate_pros_group_total ?? dashboard.associate_pros_group_total
          }
          page={page}
          limit={DEFAULT_SYSTEM_ASSOCIATES_LIMIT}
          onPageChange={setPage}
          isLoading={tableLoading}
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
