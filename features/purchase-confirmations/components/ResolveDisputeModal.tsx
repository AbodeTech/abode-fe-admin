"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { PurchaseConfirmationRow } from "../hooks/use-purchase-confirmations";
import { useResolveDispute } from "../hooks/use-confirmation-actions";

interface ResolveDisputeModalProps {
  open: boolean;
  row?: PurchaseConfirmationRow | null;
  onOpenChange: (open: boolean) => void;
}

export function ResolveDisputeModal({
  open,
  row,
  onOpenChange,
}: ResolveDisputeModalProps) {
  const resolve = useResolveDispute();
  const [note, setNote] = useState("");
  const [requestReconfirm, setRequestReconfirm] = useState(true);

  // Reset the form on each open transition (state adjustment during render —
  // see react.dev "You Might Not Need an Effect").
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setNote("");
      setRequestReconfirm(true);
    }
  }

  if (!row) return null;

  const handleResolve = async () => {
    try {
      await resolve.mutateAsync({
        planId: row.id,
        note: note.trim(),
        requestReconfirm,
      });
      toast.success(
        requestReconfirm
          ? "Dispute resolved. The buyer has been asked to confirm again."
          : "Dispute resolved."
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't resolve this dispute. Try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve dispute</DialogTitle>
          <DialogDescription>
            {row.buyerName} · {row.assetName}. Fix the underlying data first
            (Assets or Users), then close the loop here.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md bg-muted p-3">
          <p className="text-sm font-medium">The buyer reported:</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {row.disputeNote?.trim() || "No note was added."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolve-note" className="text-sm">
            What was done? (internal note)
          </Label>
          <Textarea
            id="resolve-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Corrected the name spelling on the document record."
          />
        </div>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={requestReconfirm}
            onCheckedChange={(checked) => setRequestReconfirm(checked === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-snug">
            Ask the buyer to confirm the corrected details again
            <span className="block text-xs text-muted-foreground">
              Re-sends the confirmation email. Only the buyer can mark a
              purchase confirmed.
            </span>
          </span>
        </label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={resolve.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={resolve.isPending || note.trim().length < 5}
          >
            {resolve.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resolving…
              </>
            ) : (
              "Resolve dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
