"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
  useCSManagerDashboard,
  CSManagerSnapshot,
  BacklogsSection,
  PortfolioHealthStrip,
  CustomersTable,
  ManageCSTargetsDialog,
} from "@/features/cs-managers";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CustomerManagerDetailPage({ params }: Props) {
  const { id } = use(params);
  const [targetsDialogOpen, setTargetsDialogOpen] = useState(false);
  const { data, isLoading, isError, error } = useCSManagerDashboard({
    managerId: id,
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

  // BE returns manager: null when the role is unassigned or the admin id
  // in the URL didn't resolve. Guard so we never blow up further down.
  if (!data.manager) {
    return (
      <div className="space-y-4 py-2">
        <Link
          href="/customer-managers"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C]"
        >
          <ChevronLeft className="h-3 w-3" />
          All CS Managers
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          This admin is not currently a CS Manager. They may have been
          removed, or the id in the URL doesn't match an active role.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <Link
          href="/customer-managers"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C]"
        >
          <ChevronLeft className="h-3 w-3" />
          All CS Managers
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">
          Customer Success Manager
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Performance dashboard for this CS Manager, their workload backlogs
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
        onManageTargets={() => setTargetsDialogOpen(true)}
      />

      <BacklogsSection backlogs={data.backlogs} />

      <PortfolioHealthStrip portfolio={data.portfolio} />

      <CustomersTable
        plans={data.plans}
        totalAssigned={data.portfolio.totalAssigned}
      />

      <ManageCSTargetsDialog
        open={targetsDialogOpen}
        onOpenChange={setTargetsDialogOpen}
        managerId={data.manager._id}
        managerName={data.manager.userName || data.manager.email}
      />
    </div>
  );
}
