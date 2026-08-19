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
import { CSPeriodFilter } from "./CSPeriodFilter";
import { ManageCSManagersMenu } from "./ManageCSManagersMenu";
import { UnassignedCustomersDialog } from "./dialogs/UnassignedCustomersDialog";
import { useUnassignedCustomers } from "../hooks/use-cs-managers-list";
import { csManagerName, type CSManagerSummary } from "../lib/manager-display";

interface Props {
  /** Super admins pick any manager; a CS Manager only ever sees their own. */
  viewAs: "super-admin" | "manager";
  managers: CSManagerSummary[];
  activeManagerId: string | null;
  /** From the dashboard payload: portfolio.totalAssigned. */
  assignedCustomersCount: number;
}

export function CSPerformanceHeader({
  viewAs,
  managers,
  activeManagerId,
  assignedCustomersCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unassignedOpen, setUnassignedOpen] = useState(false);

  const isSuperAdmin = viewAs === "super-admin";

  // Super-admin only endpoint — don't fire it in the manager view.
  const { data: unassignedResponse } = useUnassignedCustomers({
    enabled: isSuperAdmin,
  });
  const unassignedCount = unassignedResponse?.count ?? 0;

  const activeManager =
    managers.find((m) => m.manager._id === activeManagerId) ?? null;

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
          <h1 className="text-2xl font-bold tracking-tight">
            CS Manager Performance
          </h1>
          <p className="text-muted-foreground">
            {!isSuperAdmin
              ? `Your dashboard — ${assignedCustomersCount} customer${assignedCustomersCount === 1 ? "" : "s"} assigned.`
              : activeManager
                ? `${csManagerName(activeManager.manager)} — ${assignedCustomersCount} customer${assignedCustomersCount === 1 ? "" : "s"} assigned.`
                : "Onboarding, allocation and Deed of Assignment progress, scoped per manager."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <Select
              value={activeManagerId ?? ""}
              onValueChange={handleManagerChange}
            >
              <SelectTrigger className="w-fit min-w-55 bg-white">
                <SelectValue placeholder="Select CS Manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No CS Managers yet
                  </div>
                ) : (
                  managers.map((m) => (
                    <SelectItem key={m.manager._id} value={m.manager._id}>
                      {csManagerName(m.manager)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          <CSPeriodFilter />

          {isSuperAdmin && (
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

              <ManageCSManagersMenu activeManager={activeManager} />
            </>
          )}
        </div>
      </div>

      {isSuperAdmin && (
        <UnassignedCustomersDialog
          open={unassignedOpen}
          onOpenChange={setUnassignedOpen}
        />
      )}
    </>
  );
}
