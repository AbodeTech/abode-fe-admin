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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { PURCHASE_DECLINE_REASON_MIN } from "../schemas/purchase.schema";

const CUSTOM_REASON_VALUE = "Other";

interface AssetTransactionActionProps {
  status: string;
  assetId: string;
  onApprove: (id: string) => Promise<unknown>;
  onDecline: (id: string, message: string) => Promise<unknown>;
}

export function AssetTransactionAction({
  status,
  assetId,
  onApprove,
  onDecline,
}: AssetTransactionActionProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const reasons = [
    "Price fluctuation on this asset",
    "Account restrictions apply here",
    "System error during verification",
    "Invalid asset details submitted",
    "Wrong payment receipt uploaded",
    "Payment receipt uploaded twice",
  ];

  const isCustom = declineReason === CUSTOM_REASON_VALUE;
  const normalizedStatus = status?.toLowerCase() ?? "";

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
    if (isCustom && !customReason.trim()) {
      toast.error("Please enter a reason for transaction decline");
      return;
    }
    const message = isCustom ? customReason.trim() : declineReason;
    if (message.length < PURCHASE_DECLINE_REASON_MIN) {
      toast.error(`Reason must be at least ${PURCHASE_DECLINE_REASON_MIN} characters`);
      return;
    }
    setDeclineLoading(true);
    try {
      await onDecline(assetId, message);
      toast.success("Transaction Declined");
      setIsDeclineOpen(false);
      setDeclineReason("");
      setCustomReason("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while declining";
      toast.error(errorMessage);
    } finally {
      setDeclineLoading(false);
    }
  };

  const handleDeclineOpenChange = (open: boolean) => {
    setIsDeclineOpen(open);
    if (!open) {
      setDeclineReason("");
      setCustomReason("");
    }
  };

  if (normalizedStatus !== "pending") {
    return (
      <div
        className={`h-2 w-6 rounded-2xl ${
          normalizedStatus === "approved" ||
          normalizedStatus === "completed" ||
          normalizedStatus === "auto-approved"
            ? "bg-[#067647]"
            : "bg-[#B42318]"
        }`}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogTrigger asChild>
          <button type="button" className="rounded-full p-1 transition-colors hover:bg-green-50">
            <CheckCircle className="h-5 w-5 text-[#067647]" />
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
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={approveLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approveLoading}>
              {approveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeclineOpen} onOpenChange={handleDeclineOpenChange}>
        <AlertDialogTrigger asChild>
          <button type="button" className="rounded-full p-1 transition-colors hover:bg-red-50">
            <XCircle className="h-5 w-5 text-[#B42318]" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to decline?</AlertDialogTitle>
            <AlertDialogDescription>
              Declining this asset transaction will remove the asset transaction from list of payments on the abode database.
            </AlertDialogDescription>
            <div className="mt-4">
              <div className="mb-2 text-base font-semibold text-black">Select Reason for Decline</div>
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
                  <SelectItem value={CUSTOM_REASON_VALUE}>Other (custom reason)</SelectItem>
                </SelectContent>
              </Select>
              {isCustom ? (
                <div className="mt-3">
                  <Textarea
                    value={customReason}
                    onChange={(event) => setCustomReason(event.target.value)}
                    placeholder="Enter reason for declining"
                    maxLength={500}
                    rows={3}
                  />
                </div>
              ) : null}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDeclineOpenChange(false)}
              disabled={declineLoading}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={declineLoading}>
              {declineLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
