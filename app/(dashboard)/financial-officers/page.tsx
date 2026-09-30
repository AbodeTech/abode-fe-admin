"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_OFFICERS,
  ApprovalsSection,
  AttentionBanner,
  FOPerformanceHeader,
  FOSnapshot,
  ManageFOTargetsDialog,
  NoFinancialOfficersEmptyState,
  RecoveryPlansTable,
  RecoveryStrip,
  TeamOverview,
  adminMinName,
  useFinancialOfficerDashboard,
  useFinancialOfficers,
  useFinancialOfficersTeamDashboard,
  useIsCurrentFinancialOfficer,
  type RecoveryFilterKey,
} from "@/features/financial-officers";
import { useAuthStore } from "@/store/auth-store";

function NotAuthorized() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Financial Officer Performance is restricted</h2>
        <p className="text-sm text-gray-600">
          This page is for Super Admins and Financial Officers. Ask your admin if you need access.
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-md bg-red-50 text-[#AD1F2A] border border-red-200">
      <h3 className="font-bold">Error loading Financial Officer performance</h3>
      <p>{message || "An unexpected error occurred."}</p>
    </div>
  );
}

const PLANS_PER_PAGE = 20;

function FinancialOfficersContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [targetsOpen, setTargetsOpen] = useState(false);

  // Super admins see every officer and the team view; an officer sees only
  // their own dashboard, whatever `?officer=` says. That pin is a UX guard,
  // not a security boundary — the BE must reject a non-owning caller.
  const isSuperAdmin = Boolean(user?.role?.is_super_admin);
  const { isOfficer, officerId: ownOfficerId, isLoading: officerCheckLoading } = useIsCurrentFinancialOfficer();
  const viewAs: "super-admin" | "officer" = isSuperAdmin ? "super-admin" : "officer";
  const isAuthorized = isSuperAdmin || isOfficer;

  const activeOfficerId =
    viewAs === "officer" ? ownOfficerId ?? "" : searchParams.get("officer") ?? ALL_OFFICERS;
  const isTeamView = viewAs === "super-admin" && activeOfficerId === ALL_OFFICERS;

  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const page = Number(searchParams.get("page")) || 1;
  const filter = (searchParams.get("filter") as RecoveryFilterKey | null) ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  // The full list needs the view permission, so only super admins fetch it.
  const officersQuery = useFinancialOfficers(isSuperAdmin);
  const officers = officersQuery.data ?? [];

  const teamQuery = useFinancialOfficersTeamDashboard({ month, year, enabled: isAuthorized && isTeamView });
  const dashboardQuery = useFinancialOfficerDashboard({
    officerId: isTeamView ? "" : activeOfficerId,
    month,
    year,
    page,
    limit: PLANS_PER_PAGE,
    filter,
    search,
    enabled: isAuthorized && !isTeamView,
  });

  if (officerCheckLoading || officersQuery.isLoading) return <Spinner />;
  if (!isAuthorized) return <NotAuthorized />;
  if (officersQuery.error) return <LoadError message={officersQuery.error.message} />;
  if (isSuperAdmin && officers.length === 0) return <NoFinancialOfficersEmptyState />;

  const header = <FOPerformanceHeader viewAs={viewAs} officers={officers} activeOfficerId={activeOfficerId} />;

  if (isTeamView) {
    if (teamQuery.isLoading) return <Spinner />;
    if (teamQuery.error || !teamQuery.data) return <LoadError message={teamQuery.error?.message ?? ""} />;
    return (
      <div className="space-y-6">
        {header}
        <div className={cn("transition-opacity", teamQuery.isFetching && "opacity-60")}>
          <TeamOverview team={teamQuery.data} />
        </div>
      </div>
    );
  }

  if (dashboardQuery.isLoading) return <Spinner />;
  if (dashboardQuery.error || !dashboardQuery.data) {
    return <LoadError message={dashboardQuery.error?.message ?? ""} />;
  }

  const data = dashboardQuery.data;
  const officer = data.officer;

  // The id in the URL isn't an active officer (removed, or mistyped). Keep the
  // header so a super admin can pick someone else.
  if (!officer) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          This admin is not currently a Financial Officer. They may have been removed, or the id in the URL
          doesn&apos;t match an active role.
        </div>
      </div>
    );
  }

  const firstName = officer.first_name ?? adminMinName(officer);

  return (
    <div className="space-y-6">
      {header}

      {/* The previous dashboard stays up while the next loads (keepPreviousData) — dim it. */}
      <div className={cn("space-y-6 transition-opacity", dashboardQuery.isFetching && "opacity-60")}>
        <AttentionBanner
          overdueApprovals={data.queue.over_24h}
          suspendingSoon={data.recovery.suspending_within_14_days}
          bookOwner={viewAs === "officer" ? "your" : `${firstName}'s`}
        />

        <FOSnapshot
          dashboard={{ ...data, officer }}
          onManageTargets={isSuperAdmin ? () => setTargetsOpen(true) : undefined}
        />

        <ApprovalsSection
          approvals={data.approvals}
          queue={data.queue}
          decisions={data.recent_decisions}
          targetHours={data.approval_target_hours}
          decisionsTitle={viewAs === "officer" ? "Your recent decisions" : `${firstName}'s recent decisions`}
        />

        <RecoveryStrip recovery={data.recovery} />

        <RecoveryPlansTable
          officerId={officer.id}
          plans={data.plans}
          totalPlans={data.plans_total}
          filterCounts={data.filter_counts}
          page={page}
          limit={PLANS_PER_PAGE}
          isFetching={dashboardQuery.isFetching}
          canReassign={isSuperAdmin}
        />
      </div>

      {isSuperAdmin && (
        <ManageFOTargetsDialog
          open={targetsOpen}
          onOpenChange={setTargetsOpen}
          officerId={officer.id}
          officerName={adminMinName(officer)}
        />
      )}
    </div>
  );
}

export default function FinancialOfficersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <FinancialOfficersContent />
    </Suspense>
  );
}
