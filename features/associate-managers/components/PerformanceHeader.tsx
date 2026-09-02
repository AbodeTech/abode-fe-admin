"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";
import { ManageManagersMenu } from "./ManageManagersMenu";
import { ChangeManagerDialog } from "./dialogs/ChangeManagerDialog";
import { useUnassignedProsCount } from "../hooks/use-unassigned-pros";
import {
  managerDisplayName,
  type ManagerListItem,
} from "../schemas/associate-manager.schema";

interface Props {
  viewAs: "super-admin" | "manager";
  managers: ManagerListItem[];
  activeManagerId: string | null;
  /** True when the combined "all managers" view is active. */
  isAllManagers?: boolean;
  /** From the dashboard payload: total_assigned. Drives the manager-view subtitle. */
  assignedProsCount: number;
}

export function PerformanceHeader({
  viewAs,
  managers,
  activeManagerId,
  isAllManagers = false,
  assignedProsCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unassignedDialogOpen, setUnassignedDialogOpen] = useState(false);

  const unassignedCountQuery = useUnassignedProsCount(null);
  const unassignedCount = unassignedCountQuery.data ?? 0;

  const activeManager =
    managers.find((m) => m.manager_id === activeManagerId) ?? null;

  const handleManagerChange = (managerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("manager", managerId);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Associate Manager Performance
          </h1>
          <p className="text-muted-foreground">
            {viewAs === "super-admin"
              ? "Performance and recruitment metrics scoped per manager."
              : `Your performance dashboard — ${assignedProsCount} Associate Pros assigned.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {viewAs === "super-admin" && (
            <Select
              value={isAllManagers ? "all" : (activeManagerId ?? "")}
              onValueChange={handleManagerChange}
            >
              <SelectTrigger className="w-fit min-w-55 bg-white">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No managers yet
                  </div>
                ) : (
                  <>
                    <SelectItem value="all">All managers (combined)</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.manager_id} value={m.manager_id}>
                        {managerDisplayName(m)}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          )}

          <DashboardPeriodFilter />

          {viewAs === "super-admin" && (
            <>
              {unassignedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setUnassignedDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-medium border border-amber-200 transition-colors"
                  aria-label="View unassigned Pros"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  {unassignedCount} unassigned
                </button>
              )}

              <ManageManagersMenu activeManager={activeManager} />
            </>
          )}
        </div>
      </div>

      {/* Pre-targets the dialog at the Unassigned Pool */}
      <ChangeManagerDialog
        open={unassignedDialogOpen}
        onOpenChange={setUnassignedDialogOpen}
        startFromUnassigned
      />
    </>
  );
}
