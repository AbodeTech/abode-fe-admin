"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AssetTransactionActionProps {
  status: string;
  assetId: string;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
}

export function AssetTransactionAction({ status, assetId, onApprove, onDecline }: AssetTransactionActionProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const reasons = [
    "Price Fluctuation",
    "Account Restrictions",
    "System Error",
    "Invalid Asset Details",
    "Wrong Payment Receipt",
    "Payment Receipt uploaded twice",
  ];

  const handleApprove = async () => {
    setApproveLoading(true);
    try {
      await onApprove(assetId);
      toast.success("Transaction Approved");
      setIsApproveOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred while approving";
      toast.error(message);
    } finally {
      setApproveLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason) {
      toast.error("Please provide a reason for transaction decline");
      return;
    }
    setDeclineLoading(true);
    try {
      await onDecline(assetId, declineReason);
      toast.success("Transaction Declined");
      setIsDeclineOpen(false);
      setDeclineReason("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred while declining";
      toast.error(message);
    } finally {
      setDeclineLoading(false);
    }
  };

  if (status?.toLowerCase() !== "pending") {
    return (
      <div
        className={`w-6 h-2 rounded-2xl ${
          status?.toLowerCase() === "approved" || status?.toLowerCase() === "completed"
            ? "bg-[#067647]"
            : "bg-[#B42318]"
        }`}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Approve Action */}
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogTrigger asChild>
          <button className="p-1 hover:bg-green-50 rounded-full transition-colors">
            <CheckCircle className="w-5 h-5 text-[#067647]" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to approve?</AlertDialogTitle>
            <AlertDialogDescription>
              Approving this payment will add the payment to the list of approved payments on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              disabled={approveLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveLoading}>
              {approveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Action */}
      <AlertDialog open={isDeclineOpen} onOpenChange={setIsDeclineOpen}>
        <AlertDialogTrigger asChild>
          <button className="p-1 hover:bg-red-50 rounded-full transition-colors">
            <XCircle className="w-5 h-5 text-[#B42318]" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to decline?</AlertDialogTitle>
            <AlertDialogDescription>
              Declining this asset transaction will remove the asset transaction from list of payments on the abode database.
            </AlertDialogDescription>
            <div className="mt-4">
              <div className="text-base font-semibold text-black mb-2">Select Reason for Decline</div>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeclineOpen(false)}
              disabled={declineLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineLoading}
            >
              {declineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
