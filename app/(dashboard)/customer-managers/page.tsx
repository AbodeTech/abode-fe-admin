"use client";

import { Loader2 } from "lucide-react";
import {
  useCSManagerDashboard,
  CSManagerSnapshot,
  BacklogsSection,
  PortfolioHealthStrip,
  CustomersTable,
} from "@/features/cs-managers";

/**
 * CS Manager Performance Dashboard.
 *
 * TEMPORARY: renders a mocked manager while the BE ticket is in flight.
 * Once the CS-manager list endpoint ships, split this into:
 *   /customer-managers            → list of CS managers
 *   /customer-managers/[id]       → per-manager dashboard (this view)
 */
export default function CustomerManagersPage() {
  const { data, isLoading, isError, error } = useCSManagerDashboard({
    managerId: "adenike",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading CS manager dashboard…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn't load the CS manager dashboard.
        {error instanceof Error && (
          <div className="mt-1 text-xs text-red-800">{error.message}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Customer Success Manager
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Performance dashboard for the CS Manager, their workload backlogs
          and their assigned customers.
        </p>
      </div>

      <CSManagerSnapshot
        manager={data.manager}
        period={data.period}
        target={data.target}
        score={data.performanceScore}
        obligation={data.obligation}
        totalAssigned={data.portfolio.totalAssigned}
      />

      <BacklogsSection backlogs={data.backlogs} />

      <PortfolioHealthStrip portfolio={data.portfolio} />

      <CustomersTable
        plans={data.plans}
        totalAssigned={data.portfolio.totalAssigned}
      />
    </div>
  );
}
