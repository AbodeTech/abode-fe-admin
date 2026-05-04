"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSuspendListing } from "../hooks/use-marketplace-mutations";

interface MarketplaceSuspendDialogProps {
  listingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarketplaceSuspendDialog({
  listingId,
  isOpen,
  onClose,
}: MarketplaceSuspendDialogProps) {
  const [reason, setReason] = useState("");
  const suspendMutation = useSuspendListing();

  const handleSuspend = async () => {
    if (!listingId) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    try {
      await suspendMutation.mutateAsync({ listingId, reason: reason.trim() });
      toast.success("Listing suspended");
      setReason("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to suspend listing");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Suspend Listing</DialogTitle>
          <DialogDescription>
            This will remove the listing from the marketplace. The seller will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason for Suspension</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for suspending this listing..."
            className="mt-2"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={suspendMutation.isPending}
          >
            {suspendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
