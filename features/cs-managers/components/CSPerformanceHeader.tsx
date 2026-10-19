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
import { MonthPeriodFilter } from "@/components/shared/MonthPeriodFilter";
import { ManageCSManagersMenu } from "./ManageCSManagersMenu";
import { UnassignedCustomersDialog } from "./UnassignedCustomersDialog";
import { useUnassignedCustomers } from "../hooks/use-cs-managers";
import { adminMinName, type CSManagerSummary } from "../schemas/cs-manager.schema";

interface Props {
  /**
   * `admin` holds view_cs_manager_tracker and picks any manager; `manager` is
   * a CS Manager without it, who only ever sees their own book.
   */
  viewAs: "admin" | "manager";
  /**
   * The combined view and adding/removing CS Managers are super-admin only on
   * the BE, so a moderator in the admin view doesn't get them.
   */
  isSuperAdmin: boolean;
  managers: CSManagerSummary[];
  activeManagerId: string | null;
  /** From the dashboard payload: portfolio.total_assigned. */
  assignedCustomersCount: number;
}

export function CSPerformanceHeader({
  viewAs,
  isSuperAdmin,
  managers,
  activeManagerId,
  assignedCustomersCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unassignedOpen, setUnassignedOpen] = useState(false);

  const isAdminView = viewAs === "admin";

  // Needs view_cs_manager_tracker — don't fire it in the manager view.
  const { data: unassignedResponse } = useUnassignedCustomers({ enabled: isAdminView });
  const unassignedCount = unassignedResponse?.count ?? 0;

  const activeManager = managers.find((m) => m.manager?.id === activeManagerId) ?? null;

  const handleManagerChange = (managerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("manager", managerId);
    // Different book, different length — page 5 of the last one is meaningless.
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CS Manager Performance</h1>
          <p className="text-muted-foreground">
            {!isAdminView
              ? `Your dashboard — ${assignedCustomersCount} customer${assignedCustomersCount === 1 ? "" : "s"} assigned.`
              : activeManagerId === "all"
                ? `${assignedCustomersCount} customers across all CS Managers.`
                : activeManager
                ? `${adminMinName(activeManager.manager)} — ${assignedCustomersCount} customer${assignedCustomersCount === 1 ? "" : "s"} assigned.`
                : "Onboarding, allocation and Deed of Assignment progress, scoped per manager."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdminView && (
            <Select value={activeManagerId ?? ""} onValueChange={handleManagerChange}>
              <SelectTrigger className="w-fit min-w-55 bg-white">
                <SelectValue placeholder="Select CS Manager" />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && <SelectItem value="all">All CS Managers</SelectItem>}
                {managers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">No CS Managers yet</div>
                ) : (
                  managers.map((m) => (
                    <SelectItem key={m.id} value={m.manager?.id ?? m.id}>
                      {adminMinName(m.manager)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          <MonthPeriodFilter />

          {isAdminView && (
            <>
              {unassignedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setUnassignedOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-medium border border-amber-200 transition-colors"
                  aria-label="View unassigned customers"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  {unassignedCount} unassigned
                </button>
              )}

              {isSuperAdmin && (
                <ManageCSManagersMenu activeManager={activeManager} managers={managers} />
              )}
            </>
          )}
        </div>
      </div>

      {isAdminView && (
        <UnassignedCustomersDialog open={unassignedOpen} onOpenChange={setUnassignedOpen} />
      )}
    </>
  );
}
