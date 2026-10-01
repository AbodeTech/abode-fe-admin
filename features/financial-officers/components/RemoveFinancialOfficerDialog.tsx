"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { useRemoveFinancialOfficer } from "../hooks/use-financial-officer-mutations";
import {
  adminMinInitials,
  adminMinName,
  type FinancialOfficerSummary,
} from "../schemas/financial-officer.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officer: FinancialOfficerSummary | null;
}

/**
 * Demote an officer. Unlike CS Managers, nothing is left unowned: their open
 * recovery plans go back through auto-assignment to the remaining officers.
 */
export function RemoveFinancialOfficerDialog({ open, onOpenChange, officer }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const removeOfficer = useRemoveFinancialOfficer();

  const handleClose = () => {
    if (removeOfficer.isPending) return;
    onOpenChange(false);
  };

  const handleRemove = () => {
    if (!officer?.officer) return;
    const name = adminMinName(officer.officer);
    removeOfficer.mutate(officer.officer.id, {
      onSuccess: () => {
        toast.success(`${name} removed from the Financial Officer role`);
        onOpenChange(false);
        // Their dashboard no longer exists — land on the team view.
        const params = new URLSearchParams(searchParams.toString());
        params.delete("officer");
        router.push(`?${params.toString()}`);
      },
      onError: (error) => toast.error(error.message || "Failed to remove Financial Officer"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-[#AD1F2A]" />
            Remove Financial Officer
          </DialogTitle>
          <DialogDescription>
            This closes their Financial Officer role. They keep their admin account and any
            approve permission they already had.
          </DialogDescription>
        </DialogHeader>

        {officer && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5">
            <div className="h-9 w-9 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
              {adminMinInitials(officer.officer)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                {adminMinName(officer.officer)}
              </p>
              <p className="text-xs text-gray-500 leading-tight truncate">{officer.officer?.email}</p>
            </div>
          </div>
        )}

        {!!officer?.open_plans_count && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Their {officer.open_plans_count} open recovery plan
              {officer.open_plans_count === 1 ? "" : "s"} will be shared out to the remaining
              officers. Money they already recovered stays credited to them.
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={removeOfficer.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={!officer || removeOfficer.isPending}
            className="bg-[#AD1F2A] hover:bg-[#8f1922] text-white"
          >
            {removeOfficer.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Remove role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
