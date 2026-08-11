"use client";

import { useState } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCSManagersList } from "../hooks/use-cs-managers-list";
import { useAssignCustomersToCSM } from "../hooks/use-cs-manager-mutations";
import type { CSManagerSummary } from "./CSManagersListTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Customer ids the super admin is assigning — can be 1 (from the row
   * "Assign" button) or many (from the queue's "Assign N selected"). */
  customerIds: string[];
  onAssigned?: () => void;
}

// Base Admin type only ships userName + email — same shim as the snapshot.
const initialsOf = (m: CSManagerSummary["manager"]) => {
  const source = m.userName || m.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
};

const fullName = (m: CSManagerSummary["manager"]) => m.userName || m.email;

export function AssignCustomersDialog({
  open,
  onOpenChange,
  customerIds,
  onAssigned,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedManagerId, setPickedManagerId] = useState<string | null>(null);
  const { data: managers = [], isLoading } = useCSManagersList();
  const { mutateAsync, isPending } = useAssignCustomersToCSM();

  const filtered = managers.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = fullName(m.manager).toLowerCase();
    return name.includes(q) || m.manager.email.toLowerCase().includes(q);
  });

  const handleClose = () => {
    if (isPending) return;
    setQuery("");
    setPickedManagerId(null);
    onOpenChange(false);
  };

  const handleAssign = async () => {
    if (!pickedManagerId || customerIds.length === 0) return;
    try {
      await mutateAsync({
        customerIds,
        managerId: pickedManagerId,
      });
      toast.success(
        `Assigned ${customerIds.length} customer${customerIds.length === 1 ? "" : "s"}`
      );
      onAssigned?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign customers"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to a CS Manager</DialogTitle>
          <DialogDescription>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              {customerIds.length} customer{customerIds.length === 1 ? "" : "s"} selected
            </span>{" "}
            — pick the CS Manager who'll take over their journey.
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No CS Managers match. Promote an admin first.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((m) => {
                  const picked = pickedManagerId === m.manager._id;
                  return (
                    <li key={m._id}>
                      <button
                        type="button"
                        onClick={() => setPickedManagerId(m.manager._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          picked
                            ? "bg-[#E0F2F1] text-[#00695C]"
                            : "hover:bg-white"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(m.manager)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {fullName(m.manager)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {m.assignedCustomersCount} customer{m.assignedCustomersCount === 1 ? "" : "s"} ·{" "}
                            {m.assignedPlansCount} active plan{m.assignedPlansCount === 1 ? "" : "s"}
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

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!pickedManagerId || customerIds.length === 0 || isPending}
          >
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
