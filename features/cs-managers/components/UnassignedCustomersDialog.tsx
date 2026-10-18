"use client";

import { useState } from "react";
import { ChevronLeft, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UnassignedCustomersTable } from "./UnassignedCustomersTable";
import { useCSManagers, useUnassignedCustomers } from "../hooks/use-cs-managers";
import { useAssignCustomersToCSM } from "../hooks/use-cs-manager-mutations";
import { adminMinInitials, adminMinName } from "../schemas/cs-manager.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Super-admin queue of customers with no CS Manager. Two steps in one
 * dialog — pick the customers, then pick who takes them — mirrors main's
 * `UnassignedCustomersDialog`.
 */
export function UnassignedCustomersDialog({ open, onOpenChange }: Props) {
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pickedManagerId, setPickedManagerId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useUnassignedCustomers();
  const { data: managers = [], isLoading: managersLoading } = useCSManagers();
  const assignCustomers = useAssignCustomersToCSM();

  const customers = data?.results ?? [];
  const step: "pick-customers" | "pick-manager" = pendingIds.length > 0 ? "pick-manager" : "pick-customers";

  const reset = () => {
    setPendingIds([]);
    setQuery("");
    setPickedManagerId(null);
  };

  const handleClose = () => {
    if (assignCustomers.isPending) return;
    reset();
    onOpenChange(false);
  };

  const backToCustomers = () => {
    if (assignCustomers.isPending) return;
    setPendingIds([]);
    setPickedManagerId(null);
    setQuery("");
  };

  const handleAssign = () => {
    if (!pickedManagerId || pendingIds.length === 0) return;
    const count = pendingIds.length;
    assignCustomers.mutate(
      { managerId: pickedManagerId, customerIds: pendingIds },
      {
        onSuccess: () => {
          toast.success(`Assigned ${count} customer${count === 1 ? "" : "s"}`);
          reset();
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message || "Failed to assign customers"),
      }
    );
  };

  const filteredManagers = managers.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return adminMinName(m.manager).toLowerCase().includes(q) || (m.manager?.email ?? "").toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-hidden flex flex-col",
          step === "pick-customers" ? "sm:max-w-4xl" : "sm:max-w-lg"
        )}
      >
        {step === "pick-customers" ? (
          <>
            <DialogHeader>
              <DialogTitle>Unassigned Customers</DialogTitle>
              <DialogDescription>
                Customers with at least one plan and no CS Manager yet. Oldest bubble to the top — a
                customer here for more than 7 days is overdue.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="py-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading unassigned customers…
                  </div>
                ) : isError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
                    Couldn&apos;t load the unassigned queue.
                    {error instanceof Error && <div className="mt-1 text-xs text-red-800">{error.message}</div>}
                  </div>
                ) : (
                  <UnassignedCustomersTable
                    customers={customers}
                    onBulkAssign={(ids) => ids.length > 0 && setPendingIds(ids)}
                    onAssignOne={(c) => setPendingIds([c.id])}
                  />
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Assign to a CS Manager</DialogTitle>
              <DialogDescription>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  {pendingIds.length} customer{pendingIds.length === 1 ? "" : "s"} selected
                </span>{" "}
                — pick the CS Manager who&apos;ll take over their journey.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search CS Managers…"
                  className="pl-8"
                  autoFocus
                />
              </div>

              <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60">
                {managersLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                ) : filteredManagers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No CS Managers match. Promote an admin first.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredManagers.map((m) => {
                      const picked = pickedManagerId === m.manager?.id;
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => m.manager && setPickedManagerId(m.manager.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                              picked ? "bg-[#E0F2F1] text-[#00695C]" : "hover:bg-white"
                            )}
                          >
                            <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                              {adminMinInitials(m.manager)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">{adminMinName(m.manager)}</p>
                              <p className="text-xs text-gray-500 leading-tight truncate">
                                {m.assigned_customers_count} customer{m.assigned_customers_count === 1 ? "" : "s"} ·{" "}
                                {m.assigned_plans_count} active plan{m.assigned_plans_count === 1 ? "" : "s"}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={backToCustomers} disabled={assignCustomers.isPending}>
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleClose} disabled={assignCustomers.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleAssign} disabled={!pickedManagerId || assignCustomers.isPending}>
                  {assignCustomers.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Assign
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
