"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CSPerformanceHeader,
  CSManagerSnapshot,
  BacklogsSection,
  PortfolioHealthStrip,
  CustomersTable,
  NoCSManagersEmptyState,
  ManageCSTargetsDialog,
  useCSManagerDashboard,
  useCSManagers,
  useIsCurrentCSManager,
  adminMinName,
  type PlanFilterKey,
  type PlanSortKey,
} from "@/features/cs-managers";
import { useAuthStore } from "@/store/auth-store";

/** Friendly empty state for admins who shouldn't be here. */
function NotAuthorized() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">CS Manager Performance is restricted</h2>
        <p className="text-sm text-gray-600">
          This page is for Super Admins and assigned CS Managers. Ask your admin if you need access.
        </p>
      </div>
    </div>
  );
}

/** Plans are paginated server-side; the dashboard returns plans_total for the page count. */
const PLANS_PER_PAGE = 20;

function CustomerManagersContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [targetsDialogOpen, setTargetsDialogOpen] = useState(false);

  // Role gating, mirroring the Associate Manager dashboard: Super Admins
  // (role === "admin") get the picker across every manager. Any other admin
  // who is also a CS Manager sees only their own book. `?view=manager` lets
  // a super admin preview the manager layout.
  const isSuperAdmin = user?.role === "admin";
  const { isCSManager, csManagerId, isLoading: csmCheckLoading } = useIsCurrentCSManager();
  const wantsManagerView = searchParams.get("view") === "manager";
  const isAuthorized = isSuperAdmin || isCSManager || wantsManagerView;

  const viewAs: "super-admin" | "manager" =
    wantsManagerView || (!isSuperAdmin && isCSManager) ? "manager" : "super-admin";

  const managerIdParam = searchParams.get("manager");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const month = monthParam ? Number(monthParam) : undefined;
  const year = yearParam ? Number(yearParam) : undefined;
  const page = Number(searchParams.get("page")) || 1;
  const filter = (searchParams.get("filter") as PlanFilterKey | null) ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const sort = (searchParams.get("sort") as PlanSortKey | null) ?? undefined;

  const managersQuery = useCSManagers();
  const managers = managersQuery.data ?? [];

  // Manager view is pinned to their own id — `?manager=` is ignored, so a CS
  // Manager can't peek at a colleague's book by editing the URL. This is a
  // UX guard, NOT a security boundary: the dashboard endpoint must reject a
  // non-owning caller BE-side.
  const activeManagerId =
    viewAs === "manager" ? csManagerId : managerIdParam ?? managers[0]?.manager?.id ?? null;

  const dashboardQuery = useCSManagerDashboard({
    managerId: activeManagerId ?? "",
    month,
    year,
    page,
    limit: PLANS_PER_PAGE,
    filter,
    search,
    sort,
    enabled: isAuthorized && !!activeManagerId,
  });

  // Wait for the CS-Manager check before deciding — otherwise a legitimate
  // non-super-admin manager would flash the NotAuthorized state.
  if (csmCheckLoading || managersQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <NotAuthorized />;
  }

  if (managersQuery.error || dashboardQuery.error) {
    const message = (managersQuery.error ?? dashboardQuery.error)?.message ?? "";
    return (
      <div className="p-4 rounded-md bg-red-50 text-[#AD1F2A] border border-red-200">
        <h3 className="font-bold">Error loading CS Manager performance</h3>
        <p>{message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  // No CS Managers exist yet — friendly state with a primary "Add" CTA
  // instead of an empty picker over an empty dashboard. Only a super admin
  // can land here; a CS Manager would always find at least themselves.
  if (viewAs === "super-admin" && managers.length === 0) {
    return <NoCSManagersEmptyState />;
  }

  const data = dashboardQuery.data;

  if (!data) {
    return (
      <div className="p-4 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        No dashboard data available for this CS Manager.
      </div>
    );
  }

  // BE returns manager: null when the role is unassigned or the admin id in
  // the URL didn't resolve. Keep the header mounted so a super admin still
  // has the picker to switch away from the bad selection.
  if (!data.manager) {
    return (
      <div className="space-y-6">
        <CSPerformanceHeader
          viewAs={viewAs}
          managers={managers}
          activeManagerId={activeManagerId}
          assignedCustomersCount={0}
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          This admin is not currently a CS Manager. They may have been removed, or the id in the URL
          doesn&apos;t match an active role.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CSPerformanceHeader
        viewAs={viewAs}
        managers={managers}
        activeManagerId={activeManagerId}
        assignedCustomersCount={data.portfolio.total_assigned}
      />

      {/* The previous dashboard stays on screen while the next one loads
          (keepPreviousData) — dim it so the switch is still legible. */}
      <div className={cn("space-y-6 transition-opacity", dashboardQuery.isFetching && "opacity-60")}>
        <CSManagerSnapshot
          manager={data.manager}
          period={data.period}
          target={data.target}
          score={data.performance_score}
          obligation={data.obligation}
          totalAssigned={data.portfolio.total_assigned}
          // Setting targets is super-admin only, so a CS Manager gets the
          // read-only snapshot with no CTA.
          onManageTargets={viewAs === "super-admin" ? () => setTargetsDialogOpen(true) : undefined}
        />

        <BacklogsSection backlogs={data.backlogs} />

        <PortfolioHealthStrip portfolio={data.portfolio} />

        <CustomersTable
          managerId={activeManagerId!}
          plans={data.plans}
          totalAssigned={data.portfolio.total_assigned}
          totalPlans={data.plans_total}
          filterCounts={data.filter_counts}
          page={page}
          limit={PLANS_PER_PAGE}
          isFetching={dashboardQuery.isFetching}
        />
      </div>

      {viewAs === "super-admin" && (
        <ManageCSTargetsDialog
          open={targetsDialogOpen}
          onOpenChange={setTargetsDialogOpen}
          managerId={data.manager.id}
          managerName={adminMinName(data.manager)}
        />
      )}
    </div>
  );
}

export default function CustomerManagersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CustomerManagersContent />
    </Suspense>
  );
}
