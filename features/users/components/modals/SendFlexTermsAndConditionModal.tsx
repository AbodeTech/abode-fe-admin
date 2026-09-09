"use client";

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
import { useSendUserPlanFlexTerms } from "../../hooks/use-user-plan-mutations";
import { getErrorMessage } from "../../utils/error-message";

interface SendFlexTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  planId: string;
  email: string;
}

export function SendFlexTermsAndConditionModal({ isOpen, onClose, userId, planId, email }: SendFlexTermsModalProps) {
  const mutation = useSendUserPlanFlexTerms();

  const handleSend = async () => {
    try {
      await mutation.mutateAsync({ userId, planId, payload: {} });
      toast.success("Flex Terms and Conditions sent successfully");
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send Flex Terms and Conditions."));
    }
  };

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
          <Button onClick={handleSend} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
