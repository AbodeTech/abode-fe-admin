"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  PerformanceHeader,
  ManagerSnapshot,
  RecruitmentSection,
  SalesRevenueSection,
  ActivitySection,
  MilestonesSection,
  AssociateProsTable,
  MOCK_MANAGERS,
  getManagerMetrics,
  getProsForManager,
} from "@/features/associate-managers";

// Design-time only: `?view=manager` previews the Associate Manager role view.
// Remove this URL toggle when real role gating is wired (auth-store.user.role).
function AssociateManagersContent() {
  const searchParams = useSearchParams();

  const viewAs = searchParams.get("view") === "manager" ? "manager" : "super-admin";
  const managerId = searchParams.get("manager") ?? MOCK_MANAGERS[0].id;
  const activeManager = MOCK_MANAGERS.find((m) => m.id === managerId) ?? MOCK_MANAGERS[0];

  const metrics = getManagerMetrics(activeManager.id);
  const pros = getProsForManager(activeManager.id);

  return (
    <div className="space-y-6">
      <PerformanceHeader viewAs={viewAs} activeManager={activeManager} />

      <ManagerSnapshot viewAs={viewAs} manager={activeManager} metrics={metrics} />

      <RecruitmentSection metrics={metrics} />

      <SalesRevenueSection metrics={metrics} />

      <ActivitySection metrics={metrics} />

      <MilestonesSection metrics={metrics} />

      <AssociateProsTable pros={pros} sourceManager={activeManager} />
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
