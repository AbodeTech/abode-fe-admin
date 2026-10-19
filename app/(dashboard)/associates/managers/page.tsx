"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api-client";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import type { ProGroup } from "@/features/associate-managers/schemas/manager-dashboard.schema";
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

/**
 * Friendly empty state for users who shouldn't be here. `message` is the BE's
 * own reason when it refused (NOT_A_MANAGER, NOT_YOUR_TEAM, a missing
 * permission).
 */
function NotAuthorized({ message }: { message?: string }) {
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
          {message ||
            "This page is for Associate Managers and admins who can view the manager tracker. Ask your admin if you need access."}
        </p>
      </div>
    </div>
  );
}

function AssociateManagersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const permissions = useAdminPermissions();

  /** Opens the side drawer for a KPI cohort (does not change the main table filter). */
  const openGroup = (group: ProGroup) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("open_group", group);
    params.set("group_page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Being a manager is the manager record (GET /admin/managers/me), not a
  // permission: a manager on any role, viewer included, gets the Manager view
  // of their own team. view_manager_tracker opens the Admin view — the picker,
  // every other team, the combined and unassigned views. `?view=manager`
  // previews the Manager layout.
  const canViewAllTeams = permissions.has("view_manager_tracker");
  const canManageTeams = permissions.has("manage_manager_tracker");
  const canExportAnyTeam = permissions.has("export_manager_tracker");
  const {
    isManager,
    managerId: selfManagerId,
    isLoading: managerCheckLoading,
  } = useIsCurrentUserManager();
  const wantsManagerView = searchParams.get("view") === "manager";
  const isAuthorized = canViewAllTeams || isManager || wantsManagerView;

  const viewAs: "admin" | "manager" =
    wantsManagerView || (!canViewAllTeams && isManager) ? "manager" : "admin";

  const managerIdParam = searchParams.get("manager");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const proGroup = searchParams.get("pro_group");
  const proSort = searchParams.get("pro_sort");

  const filter = buildManagerDashboardFilter({
    startDate,
    endDate,
    month,
    year,
    proGroup,
    proSort,
  });
  const periodFilter = buildManagerDashboardPeriodFilter({
    startDate,
    endDate,
    month,
    year,
  });

  const { mutateAsync: exportPros, isPending: isExportingPros } =
    useExportManagerDashboardPros();

  // Admin view: list managers for the dropdown. Limit 100 covers most orgs;
  // bump to a server-side search if rosters grow beyond that. The list needs
  // view_manager_tracker, so the Manager view never asks for it.
  const managersQuery = useAssociateManagers(
    { page: 1, limit: 100 },
    { enabled: viewAs === "admin" }
  );
  const managers = managersQuery.data?.items ?? [];

  // Resolve the active manager id from URL, fall back to first.
  // Special sentinel "all" = combined view across every manager.
  const isAllManagers = managerIdParam === "all";
  const activeManagerId = isAllManagers
    ? null
    : (managerIdParam ?? managers[0]?.manager_id ?? null);

  const activeManager = isAllManagers
    ? null
    : managers.find((m) => m.manager_id === activeManagerId) ?? null;

  // A manager works their own team on any role: logging calls and exporting
  // it need no tracker permission. Another manager's team needs
  // manage_manager_tracker to log calls and export_manager_tracker to export;
  // the combined view exports only with the latter.
  const isOwnTeam =
    viewAs === "manager" ||
    (!isAllManagers && !!selfManagerId && activeManagerId === selfManagerId);
  const canLogCalls = isOwnTeam || canManageTeams;
  const canExportTeam = isAllManagers ? canExportAnyTeam : isOwnTeam || canExportAnyTeam;

  // Dashboard data — three admin endpoints + one self endpoint.
  // All gated on `isAuthorized` so unauthorized users skip the round-trip.
  // KPI sections use period/date only; roster group/sort refetch the table query.
  const adminKpiQuery = useAdminManagerDashboard(
    activeManagerId,
    periodFilter,
    {
      enabled:
        isAuthorized && viewAs === "admin" && !isAllManagers,
    }
  );
  const adminTableQuery = useAdminManagerDashboard(
    activeManagerId,
    filter,
    {
      enabled:
        isAuthorized && viewAs === "admin" && !isAllManagers,
      keepPreviousData: true,
    }
  );
  const allManagersKpiQuery = useAllManagersDashboard(periodFilter, { enabled: isAuthorized && viewAs === "admin" && isAllManagers });
  const allManagersTableQuery = useAllManagersDashboard(filter, { enabled: isAuthorized && viewAs === "admin" && isAllManagers, keepPreviousData: true });
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
    viewAs === "admin"
      ? isAllManagers
        ? allManagersKpiQuery
        : adminKpiQuery
      : selfKpiQuery;
  const tableQuery =
    viewAs === "admin"
      ? isAllManagers
        ? allManagersTableQuery
        : adminTableQuery
      : selfTableQuery;

  const dashboard = kpiQuery.data;
  const tableData = tableQuery.data;

  // The manager list only matters to the Admin view. Its cache entry is
  // shared with the reassign dialogs, so ignore it entirely otherwise.
  const listQuery = viewAs === "admin" ? managersQuery : null;
  const isPageLoading =
    Boolean(listQuery?.isLoading) || (kpiQuery.isLoading && !kpiQuery.data);
  const tableLoading = tableQuery.isFetching;
  const error = listQuery?.error || kpiQuery.error || tableQuery.error;

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    // BE refusals land here too: NOT_A_MANAGER for a non-manager who forced
    // ?view=manager, NOT_YOUR_TEAM for another manager's id in the URL, or a
    // missing tracker permission. Each says why in its message.
    const message = (error as Error).message ?? "";
    if (error instanceof ApiClientError && error.statusCode === 403) {
      return <NotAuthorized message={message} />;
    }

    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading manager performance</h3>
        <p>{message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  // No Associate Managers exist yet — show a friendly empty state with a
  // primary "Add" CTA instead of dead-ending on "No dashboard data". Only the
  // Admin view can land here (a manager would always have at least themselves).
  if (viewAs === "admin" && managers.length === 0) {
    return <NoManagersEmptyState />;
  }

  if (!dashboard) {
    return (
      <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        No dashboard data available for this manager.
      </div>
    );
  }

  const handleExportPros = async () => {
    try {
      await exportPros({
        scope: isAllManagers ? "combined" : "single",
        managerId: viewAs === "manager" ? selfManagerId : activeManagerId,
        params: filter,
      });
      toast.success("Roster exported successfully.");
    } catch (err) {
      const message = (err as Error).message || "";
      // BE caps the roster export at 50,000 rows.
      if (/EXPORT_TOO_LARGE|too many rows/i.test(message)) {
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
        canManage={canManageTeams}
        managers={managers}
        activeManagerId={activeManagerId}
        isAllManagers={isAllManagers}
        assignedProsCount={dashboard.recruitment.total_assigned}
      />

      <ManagerSnapshot
        viewAs={viewAs}
        canManageTargets={canManageTeams}
        manager={activeManager}
        dashboard={dashboard}
      />

      {/* Rating trend — only meaningful when a specific manager is in focus.
          Hidden in the combined "all managers" view (no single manager to
          series-plot). There is no self route: a manager viewing themselves
          names their own id, which the BE accepts on any role. */}
      {!isAllManagers && (
        <RatingTrendPanel
          managerId={viewAs === "manager" ? selfManagerId : activeManagerId}
        />
      )}

      <RecruitmentSection attributionMode={isAllManagers ? "combined" : "single"} data={dashboard.recruitment} onOpenGroup={openGroup} />
      <SalesRevenueSection attributionMode={isAllManagers ? "combined" : "single"} data={dashboard.sales_and_revenue} onOpenGroup={openGroup} />
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
        exportManagerId={viewAs === "manager" ? selfManagerId : activeManagerId}
        allowExport={canExportTeam}
      />

      <AssociateProsTable
        scope={isAllManagers ? "combined" : "single"}
        pros={tableData?.associate_pros ?? dashboard.associate_pros}
        sourceManagerId={activeManagerId}
        groupTotal={
          tableData?.associate_pros_group_total ?? dashboard.associate_pros_group_total
        }
        isLoading={tableLoading}
        onExport={isAllManagers || !canExportTeam ? undefined : handleExportPros}
        isExporting={isExportingPros}
        canLogCalls={canLogCalls}
        canReassign={canManageTeams}
      />

      {/* Team sales is scoped to a single manager's roster — skip it when the
          super admin is looking at the combined "all managers" view. */}
      {!isAllManagers && (
        <TeamSalesSection
          viewAs={viewAs}
          canExport={canExportTeam}
          activeManagerId={activeManagerId}
          selfManagerId={selfManagerId}
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
