"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { RecoveryDetail } from "../schemas/recovery-window.schema";
import { useDeclineRecoveryChoice } from "../hooks/use-recovery-actions";

/** "We can't offer that": the customer is told why and can choose again. */
export function DeclineChoiceDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: RecoveryDetail;
}) {
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const decline = useDeclineRecoveryChoice();
  const choice = record.choices.at(-1);

  const submit = async () => {
    try {
      await decline.mutateAsync({ id: record.id, customer_note: note.trim(), internal_reason: reason.trim() });
      toast.success("The customer has been asked to choose again");
      onOpenChange(false);
      setNote("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Couldn't send that");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline their request</DialogTitle>
          <DialogDescription>
            {choice ? `${choice.asset_name} · ${choice.size_sqm} sqm.` : ""} They get an email asking them to choose
            another product. Their deadline doesn’t change. To offer something else instead, send a different option.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Note to the customer (shown in the email)</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Estate B’s 300 sqm plots have sold out."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Internal reason (at least 15 characters)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={decline.isPending || note.trim().length < 10 || reason.trim().length < 15}
          >
            {decline.isPending ? "Sending…" : "Ask them to choose again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
