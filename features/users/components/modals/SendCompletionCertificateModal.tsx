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
import { sendCertificateByEmail } from "@/lib/api/admin/user-assets.client";
import { getErrorMessage } from "../../utils/error-message";

interface SendCompletionCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueAssetId: string;
  email: string;
}

export function SendCompletionCertificateModal({ isOpen, onClose, uniqueAssetId, email }: SendCompletionCertificateModalProps) {
  const mutation = useMutation({
    mutationFn: () => sendCertificateByEmail(email, uniqueAssetId),
    onSuccess: () => {
      toast.success("Completion certificate sent successfully");
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to send completion certificate."));
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Completion Certificate</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send the completion certificate to the user&apos;s email ({email})? Please ensure that the payment plan is completed before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
