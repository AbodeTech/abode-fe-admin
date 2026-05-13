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
import { DateFilter } from "@/components/shared/DateFilter";
import { PeriodSelector } from "./PeriodSelector";
import { ManageManagersMenu } from "./ManageManagersMenu";
import { ChangeManagerDialog } from "./dialogs/ChangeManagerDialog";
import {
  MOCK_MANAGERS,
  MOCK_UNASSIGNED_PROS,
  type AssociateManager,
} from "../mock-data";

interface Props {
  viewAs: "super-admin" | "manager";
  activeManager: AssociateManager;
}

export function PerformanceHeader({ viewAs, activeManager }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unassignedDialogOpen, setUnassignedDialogOpen] = useState(false);

  const unassignedCount = MOCK_UNASSIGNED_PROS.length;

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
          <h1 className="text-2xl font-bold tracking-tight">Associate Manager Performance</h1>
          <p className="text-muted-foreground">
            {viewAs === "super-admin"
              ? "Performance and recruitment metrics scoped per manager."
              : `Your performance dashboard — ${activeManager.assignedPros} Associate Pros assigned.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {viewAs === "super-admin" && (
            <Select value={activeManager.id} onValueChange={handleManagerChange}>
              <SelectTrigger className="w-fit min-w-55 bg-white">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_MANAGERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <PeriodSelector />
          <DateFilter />

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
