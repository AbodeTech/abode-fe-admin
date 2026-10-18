"use client";

import { AlertTriangle, Loader2, UserMinus } from "lucide-react";
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
import { useRemoveCSManager } from "../hooks/use-cs-manager-mutations";
import { adminMinInitials, adminMinName, type CSManagerSummary } from "../schemas/cs-manager.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: CSManagerSummary | null;
}

/**
 * Demote a CS Manager. No transfer step — removal closes the role row and
 * deliberately leaves customer assignments intact, so they resurface in the
 * unassigned queue for an explicit reassignment rather than silently moving
 * to someone else's book (mirrors `RemoveCSManagerDialog` on main).
 */
export function RemoveCSManagerDialog({ open, onOpenChange, manager }: Props) {
  const removeManager = useRemoveCSManager();

  const handleClose = () => {
    if (removeManager.isPending) return;
    onOpenChange(false);
  };

  const handleRemove = () => {
    if (!manager?.manager) return;
    const name = adminMinName(manager.manager);
    removeManager.mutate(manager.manager.id, {
      onSuccess: () => {
        toast.success(`${name} removed from the CS Manager role`);
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message || "Failed to remove CS Manager"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-[#AD1F2A]" />
            Remove CS Manager
          </DialogTitle>
          <DialogDescription>
            This closes their CS Manager role. They keep their admin account.
          </DialogDescription>
        </DialogHeader>

        {manager && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
              {adminMinInitials(manager.manager)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                {adminMinName(manager.manager)}
              </p>
              <p className="text-xs text-gray-500 leading-tight truncate">
                {manager.manager?.email}
              </p>
            </div>
          </div>
        )}

        {!!manager?.assigned_customers_count && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Their {manager.assigned_customers_count} assigned customer
              {manager.assigned_customers_count === 1 ? "" : "s"} will return to the unassigned
              queue. Reassign them to another CS Manager so nobody is left without an owner.
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={removeManager.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={!manager || removeManager.isPending}
            className="bg-[#AD1F2A] hover:bg-[#8f1922] text-white"
          >
            {removeManager.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Remove role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
