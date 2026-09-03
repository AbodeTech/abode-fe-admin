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
import { suspendPaymentPlan } from "@/lib/api/admin/user-assets.client";
import { userKeys } from "../../hooks/query-keys";
import { getErrorMessage } from "../../utils/error-message";

interface UserPaymentPlanSuspendProps {
  uniqueAssetId: string;
  userId?: string;
}

export function UserPaymentPlanSuspend({ uniqueAssetId, userId }: UserPaymentPlanSuspendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => suspendPaymentPlan({ uniqueAssetId }),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: userKeys.details() });
      }
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      toast.success("Asset transactions suspended");
      setIsOpen(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to suspend transactions"));
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button type="button" className="w-full text-left text-sm">
          Suspend Transactions on User Asset
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to suspend transactions for this user&apos;s asset?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Suspending transactions will disable all financial activities associated with this asset.
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
