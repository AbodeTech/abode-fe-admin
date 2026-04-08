"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { sendUserContractOfSale } from "@/lib/api/admin/user-assets.client";
import { getErrorMessage } from "../../utils/error-message";

interface SendContractOfSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueAssetId: string;
}

export function SendContractOfSalesModal({ isOpen, onClose, uniqueAssetId }: SendContractOfSalesModalProps) {
  const mutation = useMutation({
    mutationFn: () => sendUserContractOfSale(uniqueAssetId),
  });

  const handleSend = async () => {
    try {
      await mutation.mutateAsync();
      toast.success("Contract of Sale sent successfully");
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send contract of sale."));
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Contract of Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send the contract of sale to this user? Please ensure that you have verified the user&apos;s details before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button onClick={handleSend} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
