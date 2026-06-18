"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
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
  useAssociateManagers,
  useAdminManagerDashboard,
  useAllManagersDashboard,
  useManagerDashboard,
  useIsCurrentUserManager,
} from "@/features/associate-managers";
import { useAuthStore } from "@/store/auth-store";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { PeriodType } from "@/lib/gql/graphql";

/** Translate the URL filter state into a backend `ManagerDashboardFilterInput`. */
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
  const { user } = useAuthStore();

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

  const filter = buildDashboardFilter(period, startDate, endDate);

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
  const adminDashboardQuery = useAdminManagerDashboard(
    activeManagerId,
    filter,
    {
      enabled:
        isAuthorized && viewAs === "super-admin" && !isAllManagers,
    }
  );
  const allManagersDashboardQuery = useAllManagersDashboard({
    filter,
    enabled: isAuthorized && viewAs === "super-admin" && isAllManagers,
  });
  const selfDashboardQuery = useManagerDashboard(filter, {
    enabled: isAuthorized && viewAs === "manager",
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

  const dashboardQuery =
    viewAs === "super-admin"
      ? isAllManagers
        ? allManagersDashboardQuery
        : adminDashboardQuery
      : selfDashboardQuery;
  const dashboard = dashboardQuery.data;

  const isLoading = managersQuery.isLoading || dashboardQuery.isLoading;
  const error = managersQuery.error || dashboardQuery.error;

  if (isLoading) {
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

      <RecruitmentSection data={dashboard.recruitment} />
      <SalesRevenueSection data={dashboard.salesAndRevenue} />
      <ActivitySection data={dashboard.activity} />
      <MilestonesSection data={dashboard.milestones} />

      <AssociateProsTable
        pros={dashboard.associatePros}
        sourceManagerId={activeManagerId}
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
