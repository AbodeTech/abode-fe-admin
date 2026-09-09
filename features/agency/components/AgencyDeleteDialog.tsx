"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useDeleteAgency } from "../hooks/use-agency-actions";
import { getErrorMessage } from "../utils/error-message";

/**
 * DELETE /admin/agencies/:id — permanent, and refused while any member
 * remains (including the owner).
 *
 * `memberCount` gates the confirm button so the common failure is explained
 * up front rather than arriving as a 400.
 */
interface AgencyDeleteDialogProps {
  agencyId: string;
  agencyName: string;
  memberCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgencyDeleteDialog({
  agencyId,
  agencyName,
  memberCount,
  open,
  onOpenChange,
}: AgencyDeleteDialogProps) {
  const router = useRouter();
  const { mutateAsync: deleteAgency, isPending } = useDeleteAgency();

  const blocked = memberCount > 0;

  const handleConfirm = async () => {
    try {
      await deleteAgency(agencyId);
      toast.success(`${agencyName} deleted`);
      onOpenChange(false);
      router.push("/agency/lists");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete agency"));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agencyName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? `This agency still has ${memberCount} member${
                  memberCount === 1 ? "" : "s"
                }. Move everyone out — the owner included — before deleting it.`
              : "This cannot be undone. Commission already earned stays on the ledger, but the agency record and its code are removed for good."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={isPending || blocked}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete agency
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
