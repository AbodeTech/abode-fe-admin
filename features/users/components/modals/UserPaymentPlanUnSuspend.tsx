"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { unSuspendPaymentPlan } from "@/lib/api/admin/user-assets.client";
import { userKeys } from "../../hooks/query-keys";
import { getErrorMessage } from "../../utils/error-message";

interface UserPaymentPlanUnSuspendProps {
  uniqueAssetId: string;
  userId?: string;
}

export function UserPaymentPlanUnSuspend({ uniqueAssetId, userId }: UserPaymentPlanUnSuspendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => unSuspendPaymentPlan({ uniqueAssetId }),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      }
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success("Asset transactions resumed");
      setIsOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to resume transactions"));
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="w-full text-left text-sm text-destructive">
          Resume Transactions on User Asset
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to resume transactions for this user&apos;s asset?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Resuming transactions will re-enable all financial activities linked to this asset. The
            user will be able to initiate new transactions once it is active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
