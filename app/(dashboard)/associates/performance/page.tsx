"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { ProRosterGroup } from "@/lib/gql/graphql";
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
import { DateFilter } from "@/components/shared/DateFilter";
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

  const openGroup = (group: ProRosterGroup) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("open_group", group);
    params.set("group_page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const isSuperAdmin = user?.role === "admin";

  const period = searchParams.get("period");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const proGroup = searchParams.get("pro_group");
  const proSort = searchParams.get("pro_sort");

  const filter = buildManagerDashboardFilter({
    period,
    startDate,
    endDate,
    proGroup,
    proSort,
  });
  const periodFilter = buildManagerDashboardPeriodFilter({
    period,
    startDate,
    endDate,
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [period, startDate, endDate, proGroup, proSort]);

  const kpiQuery = useSystemAssociatesDashboard({
    filter: periodFilter,
    enabled: isSuperAdmin,
  });
  const tableQuery = useSystemAssociatesDashboard({
    filter,
    page,
    limit: DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
    enabled: isSuperAdmin,
    keepPreviousData: true,
  });

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
            {dashboard.recruitment.totalAssigned > 0
              ? ` · ${dashboard.recruitment.totalAssigned.toLocaleString()} associates`
              : ""}
          </p>
        </div>
        <DateFilter />
      </div>

      <RecruitmentSection data={dashboard.recruitment} roster="associate" onOpenGroup={openGroup} />
      <SalesRevenueSection data={dashboard.salesAndRevenue} roster="associate" onOpenGroup={openGroup} />
      <ActivitySection data={dashboard.activity} roster="associate" onOpenGroup={openGroup} />
      <MilestonesSection data={dashboard.milestones} roster="associate" onOpenGroup={openGroup} />

      <ProGroupDrawer
        viewMode="system-associates"
        managerId={null}
        periodFilter={periodFilter}
        roster="associate"
        exportFilenamePrefix="system-associates"
      />

      <SystemAssociatesTable
          rows={tableData?.associatePros ?? dashboard.associatePros}
          totalCount={
            tableData?.associateProsGroupTotal ?? dashboard.associateProsGroupTotal
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
