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
import { sendHamperNotificationEmail } from "@/lib/api/admin/user-assets.client";
import { getErrorMessage } from "../../utils/error-message";

interface SendHamperModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueAssetId: string;
  email: string;
}

export function SendHamperModal({ isOpen, onClose, uniqueAssetId, email }: SendHamperModalProps) {
  const mutation = useMutation({
    mutationFn: () => sendHamperNotificationEmail(email, uniqueAssetId),
  });

  const handleSend = async () => {
    try {
      await mutation.mutateAsync();
      toast.success("Hamper notification sent successfully");
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send hamper notification."));
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Hamper</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send a hamper to this user? This action will send a hamper notification email to {email}.
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
