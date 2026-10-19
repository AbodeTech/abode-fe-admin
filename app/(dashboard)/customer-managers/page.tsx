"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useHasPermission } from "@/hooks/use-admin-permission";
import { CSManagerTicketFlow } from "@/features/cs-managers/components/CSManagerTicketFlow";
import { AllocationModal, ALLOCATION_STATUSES, type AllocationModalClient } from "@/features/allocation";
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
  useRefreshCSManagerDashboards,
  adminMinName,
  effectivePlanSort,
  type PlanFilterKey,
  type PlanRow,
} from "@/features/cs-managers";
import { useAuthStore } from "@/store/auth-store";

/**
 * Friendly empty state for admins who shouldn't be here. `message` is the BE's
 * own reason when it refused (NOT_YOUR_BOOK, or a missing permission).
 */
function NotAuthorized({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">CS Manager Performance is restricted</h2>
        <p className="text-sm text-gray-600">
          {message ||
            "This page is for CS Managers and admins who can view the CS Manager tracker. Ask your admin if you need access."}
        </p>
      </div>
    </div>
  );
}

/** Plans are paginated server-side; the dashboard returns plans_total for the page count. */
const PLANS_PER_PAGE = 20;

/**
 * A plans-table row as the allocation window reads it. The row only offers
 * Allocate when it has an estate id and a size. A stored status the window
 * doesn't know counts as pending: the row is awaiting a plot, and anything
 * else would open it as a reassignment.
 */
const toAllocationClient = (plan: PlanRow): AllocationModalClient => ({
  payment_plan_id: plan.plan_id,
  name: [plan.customer.last_name, plan.customer.first_name].filter(Boolean).join(" "),
  email: plan.customer.email,
  asset_id: plan.asset_id ?? "",
  asset_name: plan.asset,
  size: plan.size ?? 0,
  no_of_units: plan.units,
  allocation_status: ALLOCATION_STATUSES.find((s) => s === plan.allocation_status) ?? "pending",
});

function CustomerManagersContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [targetsDialogOpen, setTargetsDialogOpen] = useState(false);
  const [allocatingPlan, setAllocatingPlan] = useState<PlanRow | null>(null);
  const refreshDashboards = useRefreshCSManagerDashboards();

  // The allocation window reads available plots (view_allocations) and writes
  // the allocation (allocate_land); the BE checks both.
  const canAllocateLand = useHasPermission("allocate_land");
  const canViewAllocations = useHasPermission("view_allocations");
  const canAllocate = canAllocateLand && canViewAllocations;

  // Gating, mirroring the Associate Manager dashboard. Being a CS Manager is
  // the assignment record, not a permission: a CS Manager on any role sees
  // their own book. view_cs_manager_tracker opens every other book and the
  // picker. `?view=manager` previews the manager layout.
  const isSuperAdmin = Boolean(user?.role?.is_super_admin);
  const canViewAllBooks = useHasPermission("view_cs_manager_tracker");
  const canExportAnyBook = useHasPermission("export_cs_manager_tracker");
  const { isCSManager, csManagerId, isLoading: csmCheckLoading } = useIsCurrentCSManager();
  const wantsManagerView = searchParams.get("view") === "manager";
  const isAuthorized = canViewAllBooks || isCSManager || wantsManagerView;

  const viewAs: "admin" | "manager" =
    wantsManagerView || (!canViewAllBooks && isCSManager) ? "manager" : "admin";

  const managerIdParam = searchParams.get("manager");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const month = monthParam ? Number(monthParam) : undefined;
  const year = yearParam ? Number(yearParam) : undefined;
  const page = Number(searchParams.get("page")) || 1;
  const filter = (searchParams.get("filter") as PlanFilterKey | null) ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const estate = searchParams.get("estate") ?? undefined;
  // Unsorted URLs take the queue's own default rather than the BE's — see
  // defaultPlanSort. CustomersTable derives the same value for its controls.
  const sort = effectivePlanSort(filter ?? "all", searchParams.get("sort"));

  // The list needs view_cs_manager_tracker; a CS Manager without it would 403.
  // Its cache entry is shared with other callers, so only the admin view
  // reads its loading and error state.
  const managersQuery = useCSManagers({ enabled: viewAs === "admin" });
  const listQuery = viewAs === "admin" ? managersQuery : null;
  const managers = managersQuery.data ?? [];

  // Manager view is pinned to their own id — `?manager=` is ignored, so a CS
  // Manager can't peek at a colleague's book by editing the URL. This is a
  // UX guard, NOT a security boundary: the BE rejects a non-owning caller
  // with NOT_YOUR_BOOK.
  const activeManagerId =
    viewAs === "manager" ? csManagerId : managerIdParam ?? managers[0]?.manager?.id ?? null;

  // A CS Manager works their own book on any role. Another book takes the
  // tracker export permission to export, and logging a call on it is open
  // only to super admins (the BE admits the assigned CS Manager or them).
  const isOwnBook = !!csManagerId && activeManagerId === csManagerId;
  const canExportBook = isOwnBook || canExportAnyBook;
  const canLogCalls = isOwnBook || isSuperAdmin;

  const dashboardQuery = useCSManagerDashboard({
    managerId: activeManagerId ?? "",
    month,
    year,
    page,
    limit: PLANS_PER_PAGE,
    filter,
    search,
    estate,
    sort,
    enabled: isAuthorized && !!activeManagerId,
  });

  // Wait for the CS-Manager check before deciding — otherwise a legitimate
  // non-super-admin manager would flash the NotAuthorized state.
  if (csmCheckLoading || listQuery?.isLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <NotAuthorized />;
  }

  if (listQuery?.error || dashboardQuery.error) {
    const error = listQuery?.error ?? dashboardQuery.error;
    const message = error?.message ?? "";
    // A refusal (NOT_YOUR_BOOK, a missing permission) says why in its message.
    if (error instanceof ApiClientError && error.statusCode === 403) {
      return <NotAuthorized message={message} />;
    }
    return (
      <div className="p-4 rounded-md bg-red-50 text-[#AD1F2A] border border-red-200">
        <h3 className="font-bold">Error loading CS Manager performance</h3>
        <p>{message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  // No CS Managers exist yet — friendly state with a primary "Add" CTA
  // instead of an empty picker over an empty dashboard. Only the admin view
  // can land here; a CS Manager would always find at least themselves.
  if (viewAs === "admin" && managers.length === 0) {
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
  if (!data.manager && activeManagerId !== "all") {
    return (
      <div className="space-y-6">
        <CSPerformanceHeader
          viewAs={viewAs}
          isSuperAdmin={isSuperAdmin}
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
        isSuperAdmin={isSuperAdmin}
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
          onboardingBacklog={data.backlogs.onboarding}
          totalAssigned={data.portfolio.total_assigned}
          // Setting targets is super-admin only on the BE, so everyone else
          // gets the read-only snapshot with no CTA.
          onManageTargets={isSuperAdmin && data.manager ? () => setTargetsDialogOpen(true) : undefined}
        />

        <CSManagerTicketFlow flow={data.target.ticket_flow} />

        <BacklogsSection backlogs={data.backlogs} period={data.period} />

        <PortfolioHealthStrip portfolio={data.portfolio} />

        <CustomersTable
          managerId={activeManagerId === "all" ? null : activeManagerId}
          canExport={canExportBook}
          canLogCalls={canLogCalls}
          plans={data.plans}
          totalAssigned={data.portfolio.total_assigned}
          totalPlans={data.plans_total}
          filterCounts={data.filter_counts}
          estates={data.estates}
          page={page}
          limit={PLANS_PER_PAGE}
          isFetching={dashboardQuery.isFetching}
          onAllocate={canAllocate ? setAllocatingPlan : undefined}
        />
      </div>

      {/* The same window the Allocation page opens. */}
      <AllocationModal
        open={!!allocatingPlan}
        mode="send"
        client={allocatingPlan ? toAllocationClient(allocatingPlan) : null}
        onOpenChange={(open) => {
          if (open) return;
          setAllocatingPlan(null);
          // The allocation hooks only refresh allocation data.
          refreshDashboards();
        }}
      />

      {isSuperAdmin && data.manager && (
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
