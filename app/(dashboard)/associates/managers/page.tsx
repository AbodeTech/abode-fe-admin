"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProRosterGroup } from "@/lib/gql/graphql";
import {
  PerformanceHeader,
  ManagerSnapshot,
  RecruitmentSection,
  SalesRevenueSection,
  ActivitySection,
  MilestonesSection,
  AssociateProsTable,
  NoManagersEmptyState,
  TeamSalesSection,
  RatingTrendPanel,
  useAssociateManagers,
  useAdminManagerDashboard,
  useAllManagersDashboard,
  useManagerDashboard,
  useIsCurrentUserManager,
  useExportManagerDashboardPros,
  ProGroupDrawer,
} from "@/features/associate-managers";
import { buildManagerDashboardFilter, buildManagerDashboardPeriodFilter } from "@/features/associate-managers/lib/dashboard-filter";
import { useAuthStore } from "@/store/auth-store";

/** Friendly empty state for users who shouldn't be here. */
function NotAuthorized() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Manager Performance is restricted
        </h2>
        <p className="text-sm text-gray-600">
          This page is for Super Admins and assigned Associate Managers. Ask
          your admin if you need access.
        </p>
      </div>
    </div>
  );
}

function AssociateManagersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  /** Opens the side drawer for a KPI cohort (does not change the main table filter). */
  const openGroup = (group: ProRosterGroup) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("open_group", group);
    params.set("group_page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Real role gating: Super Admins (admin.role === "admin") get the Super
  // Admin view. Any other admin who is also an Associate Manager (regardless
  // of their base role — subadmin / moderator / viewer) gets the Manager
  // view. `?view=manager` lets super admins preview the Manager layout.
  const isSuperAdmin = user?.role === "admin";
  const { isManager, isLoading: managerCheckLoading } = useIsCurrentUserManager();
  const wantsManagerView = searchParams.get("view") === "manager";
  const isAuthorized = isSuperAdmin || isManager || wantsManagerView;

  const viewAs: "super-admin" | "manager" =
    wantsManagerView || (!isSuperAdmin && isManager)
      ? "manager"
      : "super-admin";

  const managerIdParam = searchParams.get("manager");
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

  const { mutateAsync: exportPros, isPending: isExportingPros } =
    useExportManagerDashboardPros();

  // Super Admin: list managers for the dropdown. Limit 200 covers most orgs;
  // bump to a server-side search if rosters grow beyond that.
  const managersQuery = useAssociateManagers({ page: 1, limit: 200 });
  const managers = managersQuery.data?.results ?? [];

  // Resolve the active manager id from URL, fall back to first.
  // Special sentinel "all" = combined view across every manager.
  const isAllManagers = managerIdParam === "all";
  const activeManagerId = isAllManagers
    ? null
    : (managerIdParam ?? managers[0]?.manager?._id ?? null);

  const activeManager = isAllManagers
    ? null
    : managers.find((m) => m.manager?._id === activeManagerId) ?? null;

  // Dashboard data — three super-admin endpoints + one self endpoint.
  // All gated on `isAuthorized` so unauthorized users skip the round-trip.
  // KPI sections use period/date only; roster group/sort refetch the table query.
  const adminKpiQuery = useAdminManagerDashboard(
    activeManagerId,
    periodFilter,
    {
      enabled:
        isAuthorized && viewAs === "super-admin" && !isAllManagers,
    }
  );
  const adminTableQuery = useAdminManagerDashboard(
    activeManagerId,
    filter,
    {
      enabled:
        isAuthorized && viewAs === "super-admin" && !isAllManagers,
      keepPreviousData: true,
    }
  );
  const allManagersKpiQuery = useAllManagersDashboard({
    filter: periodFilter,
    enabled: isAuthorized && viewAs === "super-admin" && isAllManagers,
  });
  const allManagersTableQuery = useAllManagersDashboard({
    filter,
    enabled: isAuthorized && viewAs === "super-admin" && isAllManagers,
    keepPreviousData: true,
  });
  const selfKpiQuery = useManagerDashboard(periodFilter, {
    enabled: isAuthorized && viewAs === "manager",
  });
  const selfTableQuery = useManagerDashboard(filter, {
    enabled: isAuthorized && viewAs === "manager",
    keepPreviousData: true,
  });

  // Wait for the manager-check to resolve before deciding — otherwise a
  // legitimate non-super-admin manager would flash the NotAuthorized state.
  if (managerCheckLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Unauthorized — bail with the friendly state AFTER all hooks have been
  // declared, to keep the hook call order stable across renders.
  if (!isAuthorized) {
    return <NotAuthorized />;
  }

  const kpiQuery =
    viewAs === "super-admin"
      ? isAllManagers
        ? allManagersKpiQuery
        : adminKpiQuery
      : selfKpiQuery;
  const tableQuery =
    viewAs === "super-admin"
      ? isAllManagers
        ? allManagersTableQuery
        : adminTableQuery
      : selfTableQuery;

  const dashboard = kpiQuery.data;
  const tableData = tableQuery.data;

  const isPageLoading =
    managersQuery.isLoading || (kpiQuery.isLoading && !kpiQuery.data);
  const tableLoading = tableQuery.isFetching;
  const error = managersQuery.error || kpiQuery.error || tableQuery.error;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    // BE auth errors land here too (e.g. a non-manager forced ?view=manager
    // through, or a non-admin reached the super-admin endpoint via URL).
    const message = (error as Error).message ?? "";
    const isAuthError =
      /not authorized|only assigned managers|only super admins/i.test(message);

    if (isAuthError) return <NotAuthorized />;

    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading manager performance</h3>
        <p>{message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  // No Associate Managers exist yet — show a friendly empty state with a
  // primary "Add" CTA instead of dead-ending on "No dashboard data". Only
  // Super Admin can land here (a manager would always have at least themselves).
  if (viewAs === "super-admin" && managers.length === 0) {
    return <NoManagersEmptyState />;
  }

  if (!dashboard) {
    return (
      <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        No dashboard data available for this manager.
      </div>
    );
  }

  const activeManagerSlug = (() => {
    const m = activeManager?.manager;
    if (!m) return "my-roster";
    const full = `${m.lastName ?? ""} ${m.firstName ?? ""}`.trim() || m.userName || "manager";
    return full.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  })();

  const handleExportPros = async () => {
    try {
      await exportPros({
        managerId: viewAs === "manager" ? null : activeManagerId,
        filter,
        filenamePrefix: `manager-pros-${activeManagerSlug}`,
      });
      toast.success("Roster exported successfully.");
    } catch (err) {
      const message = (err as Error).message || "";
      // BE caps export at 5,000 rows; surface that clearly when it fires.
      if (/Export limit exceeded|EXPORT_LIMIT_EXCEEDED/i.test(message)) {
        toast.error("Too many rows to export — narrow your date range or apply a group filter.");
      } else {
        toast.error(message || "Failed to export roster.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PerformanceHeader
        viewAs={viewAs}
        managers={managers}
        activeManagerId={activeManagerId}
        isAllManagers={isAllManagers}
        assignedProsCount={dashboard.recruitment.totalAssigned}
      />

      <ManagerSnapshot
        viewAs={viewAs}
        manager={activeManager}
        dashboard={dashboard}
      />

      {/* Rating trend — only meaningful when a specific manager is in focus.
          Hidden in the combined "all managers" view (no single manager to
          series-plot). Manager viewing themselves passes null → the BE service
          resolves to the caller's own admin id. */}
      {!isAllManagers && (
        <RatingTrendPanel
          managerId={viewAs === "manager" ? null : activeManagerId}
          enabled={viewAs === "manager" || Boolean(activeManagerId)}
        />
      )}

      <RecruitmentSection
        data={dashboard.recruitment}
        onOpenGroup={openGroup}
        attributionMode={isAllManagers ? "combined" : "single"}
      />
      <SalesRevenueSection
        data={dashboard.salesAndRevenue}
        onOpenGroup={openGroup}
        attributionMode={isAllManagers ? "combined" : "single"}
      />
      <ActivitySection data={dashboard.activity} onOpenGroup={openGroup} />
      <MilestonesSection data={dashboard.milestones} onOpenGroup={openGroup} />

      <ProGroupDrawer
        viewMode={
          viewAs === "manager"
            ? "self"
            : isAllManagers
              ? "all-managers"
              : "admin"
        }
        managerId={activeManagerId}
        periodFilter={periodFilter}
        exportFilenamePrefix={`manager-pros-${activeManagerSlug}`}
        exportManagerId={viewAs === "manager" ? null : activeManagerId}
      />

      <AssociateProsTable
        pros={tableData?.associatePros ?? dashboard.associatePros}
        sourceManagerId={activeManagerId}
        groupTotal={
          tableData?.associateProsGroupTotal ?? dashboard.associateProsGroupTotal
        }
        isLoading={tableLoading}
        onExport={isAllManagers ? undefined : handleExportPros}
        isExporting={isExportingPros}
      />

      {/* Team sales is scoped to a single manager's roster — skip it when the
          super admin is looking at the combined "all managers" view. */}
      {!isAllManagers && (
        <TeamSalesSection
          viewAs={viewAs}
          activeManagerId={activeManagerId}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
}

export default function AssociateManagersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AssociateManagersContent />
    </Suspense>
  );
}
