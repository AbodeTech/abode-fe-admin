"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  PaymentPlanTerminationStatus,
  suspendedToPaymentPlanTermination,
  useUpdatePaymentPlanTerminationStatus,
} from "../../hooks/use-payment-plan-termination";

interface PaymentPlanTerminationStatusSelectProps {
  uniqueAssetId?: string | null;
  userId?: string | null;
  isSuspended?: boolean | null;
  disabled?: boolean;
}

export function PaymentPlanTerminationStatusSelect({
  uniqueAssetId,
  userId,
  isSuspended,
  disabled,
}: PaymentPlanTerminationStatusSelectProps) {
  const currentStatus = suspendedToPaymentPlanTermination(isSuspended ?? true);
  const [pendingStatus, setPendingStatus] = useState<PaymentPlanTerminationStatus | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutateAsync, isPending } = useUpdatePaymentPlanTerminationStatus();

  const missingAssetId = !uniqueAssetId;
  const isDisabled = disabled || isPending || missingAssetId;

  const handleSelect = (value: PaymentPlanTerminationStatus) => {
    if (value === currentStatus || !uniqueAssetId) return;
    setPendingStatus(value);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!uniqueAssetId || !pendingStatus) return;
    try {
      await mutateAsync({ uniqueAssetId, userId, status: pendingStatus });
      setShowConfirm(false);
      setPendingStatus(null);
    } catch {
      // Toast handled in mutation onError
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingStatus(null);
  };

  const nextIsTerminated = pendingStatus === "terminated";

  return (
    <>
      <Select value={currentStatus} onValueChange={handleSelect} disabled={isDisabled}>
        <SelectTrigger
          className="h-9 w-full min-w-[140px] max-w-[180px]"
          title={missingAssetId ? "Missing asset id for this plan" : undefined}
        >
          {isPending ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          ) : (
            <SelectValue placeholder="Status" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="terminated">Terminated</SelectItem>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>

      <AlertDialog open={showConfirm} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextIsTerminated ? "Terminate payment plan?" : "Resume payment plan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextIsTerminated
                ? "Suspending this plan will disable financial activities linked to this asset, matching user asset actions."
                : "Resuming this plan will re-enable transactions for this asset. The row will leave the termination list once updated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nextIsTerminated ? "Terminate" : "Resume"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
