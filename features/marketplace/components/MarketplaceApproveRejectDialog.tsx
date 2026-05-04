"use client";

import { useState } from "react";
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
import {
  useApproveMarketplacePurchase,
  useRejectMarketplacePurchase,
} from "../hooks/use-marketplace-mutations";
import type { MarketplaceListingAdmin } from "../hooks/use-marketplace-listings";

// ─── Approve Dialog ───

interface ApproveDialogProps {
  listing: MarketplaceListingAdmin | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarketplaceApproveDialog({ listing, isOpen, onClose }: ApproveDialogProps) {
  const approveMutation = useApproveMarketplacePurchase();

  const handleApprove = async () => {
    if (!listing?._id) return;

    try {
      await approveMutation.mutateAsync(listing._id);
      toast.success("Purchase approved. Ownership transfer completed.");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve purchase");
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Purchase</AlertDialogTitle>
          <AlertDialogDescription>
            This will complete the ownership transfer from seller to buyer. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {listing && (
          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Asset:</span>
              <span className="font-medium">{listing.asset?.asset_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Buyer:</span>
              <span className="font-medium">
                {listing.buyer?.firstName} {listing.buyer?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seller:</span>
              <span className="font-medium">
                {listing.seller?.firstName} {listing.seller?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Listing Price:</span>
              <span className="font-bold">{formatCurrency(listing.listing_price)}</span>
            </div>
            {listing.receipt_amount && (
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt Amount:</span>
                <span className="font-medium">{formatCurrency(listing.receipt_amount)}</span>
              </div>
            )}
            {listing.receipt_reference && (
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt Ref:</span>
                <span className="font-mono text-xs">{listing.receipt_reference}</span>
              </div>
            )}
            {listing.receipt_image && (
              <div className="pt-2">
                <a
                  href={listing.receipt_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Receipt Image
                </a>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Reject Dialog ───

interface RejectDialogProps {
  listing: MarketplaceListingAdmin | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarketplaceRejectDialog({ listing, isOpen, onClose }: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectMarketplacePurchase();

  const handleReject = async () => {
    if (!listing?._id) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await rejectMutation.mutateAsync({ listingId: listing._id, reason: reason.trim() });
      toast.success("Purchase rejected. Listing returned to active.");
      setReason("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject purchase");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Purchase</DialogTitle>
          <DialogDescription>
            The listing will be returned to active status. The buyer will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reject-reason">Reason for Rejection</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for rejecting this purchase..."
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
            onClick={handleReject}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
