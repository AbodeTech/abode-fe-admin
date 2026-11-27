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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { PurchaseConfirmationRow } from "../hooks/use-purchase-confirmations";
import { useApprovePurchaseConfirmation } from "../hooks/use-confirmation-actions";

/** The BE's `ApprovePurchaseConfirmationDto.note` is 3 to 2000 characters when present. */
const NOTE_MIN = 3;
const NOTE_MAX = 2000;

interface ApproveConfirmationModalProps {
  open: boolean;
  row?: PurchaseConfirmationRow | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Approve a purchase confirmation on the buyer's behalf (Support Lead). The
 * decision records who approved it and when, and the buyer is told the team
 * confirmed it for them — so it asks for a reason and says plainly what it does.
 */
export function ApproveConfirmationModal({ open, row, onOpenChange }: ApproveConfirmationModalProps) {
  const approve = useApprovePurchaseConfirmation();
  const [note, setNote] = useState("");

  // Reset the form on each open transition (state adjustment during render).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setNote("");
  }

  if (!row) return null;

  const trimmed = note.trim();
  // The note is optional, but when given it must satisfy the BE's length rule.
  const noteTooShort = trimmed.length > 0 && trimmed.length < NOTE_MIN;

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ planId: row.id, note: trimmed || undefined });
      toast.success(`Approved for ${row.buyerName}. The buyer has been told.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't approve this purchase. Try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approve on the buyer&apos;s behalf</DialogTitle>
          <DialogDescription>
            {row.buyerName} · {row.assetName}. This marks the purchase confirmed and emails the
            buyer that the team confirmed it for them. Your name and the time are recorded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="approve-note" className="text-sm">
            Why are you approving it? (optional, internal)
          </Label>
          <Textarea
            id="approve-note"
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. The buyer confirmed the details by phone."
          />
          {noteTooShort && (
            <p className="text-xs text-red-600">A note needs at least {NOTE_MIN} characters.</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={approve.isPending}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={approve.isPending || noteTooShort}>
            {approve.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving…
              </>
            ) : (
              "Approve"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
