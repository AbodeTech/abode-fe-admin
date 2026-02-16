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
import { sendFlexTermsAndConditionEmail } from "@/lib/api/admin/user-assets.client";
import { getErrorMessage } from "../../utils/error-message";

interface SendFlexTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueAssetId: string;
  email: string;
}

export function SendFlexTermsAndConditionModal({ isOpen, onClose, uniqueAssetId, email }: SendFlexTermsModalProps) {
  const mutation = useMutation({
    mutationFn: () => sendFlexTermsAndConditionEmail(email, uniqueAssetId),
    onSuccess: () => {
      toast.success("Flex Terms and Conditions sent successfully");
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to send Flex Terms and Conditions."));
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Flex Terms & Conditions</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send Flex Terms and Conditions to {email}?
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
