/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TransactionActionProps {
  status: string;
  transactionId: string;
  tag: string;
  declineReasons: string[];
  onApprove: (id: string) => Promise<any>;
  onDecline: (id: string, message: string) => Promise<any>;
}

export function TransactionAction({
  status,
  transactionId,
  tag,
  declineReasons,
  onApprove,
  onDecline,
}: TransactionActionProps) {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus === "pending" || normalizedStatus === "auto-failed") {
    return (
      <div className="flex gap-3">
        <ApproveButton
          transactionId={transactionId}
          tag={tag}
          onApprove={onApprove}
        />
        <DeclineButton
          transactionId={transactionId}
          tag={tag}
          declineReasons={declineReasons}
          onDecline={onDecline}
        />
      </div>
    );
  }

  // Non-pending status: show colored bar
  return (
    <div
      className={`w-6 h-2 rounded-2xl ${
        normalizedStatus === "approved" || normalizedStatus === "completed" || normalizedStatus === "auto-approved"
          ? "bg-[#067647]"
          : "bg-[#B42318]"
        }`}
    />
  );
}

function ApproveButton({
  transactionId,
  tag,
  onApprove,
}: {
  transactionId: string;
  tag: string;
  onApprove: (id: string) => Promise<any>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => onApprove(transactionId),
    onSuccess: () => {
      toast.success("Transaction Approved");
      queryClient.invalidateQueries({ queryKey: [tag] });
      queryClient.invalidateQueries({ queryKey: ["transactionDataPoints"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve transaction");
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <CheckCircle className="w-5 h-5 text-[#067647]" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to approve?</AlertDialogTitle>
          <AlertDialogDescription>
            Approving this transaction will mark it as completed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeclineButton({
  transactionId,
  tag,
  declineReasons,
  onDecline,
}: {
  transactionId: string;
  tag: string;
  declineReasons: string[];
  onDecline: (id: string, message: string) => Promise<any>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => onDecline(transactionId, declineReason),
    onSuccess: () => {
      toast.success("Transaction Declined");
      queryClient.invalidateQueries({ queryKey: [tag] });
      queryClient.invalidateQueries({ queryKey: ["transactionDataPoints"] });
      setIsOpen(false);
      setDeclineReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to decline transaction");
    },
  });

  const handleContinue = () => {
    if (!declineReason) {
      toast.error("Please provide a reason for declining");
      return;
    }
    mutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <XCircle className="w-5 h-5 text-[#B42318]" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to decline?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>Declining this transaction will reject the request.</p>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Select Reason for Decline</p>
                <Select value={declineReason} onValueChange={setDeclineReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {declineReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
