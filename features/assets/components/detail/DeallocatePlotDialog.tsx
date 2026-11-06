"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDeallocateLand } from "@/features/allocation/hooks/use-deallocate-land";
import { assetKeys } from "../../hooks/query-keys";

const REASON_MIN_LENGTH = 15;

export function DeallocatePlotDialog({
  assetId,
  plotLabel,
  customerName,
  paymentPlanId,
  onClose,
}: {
  assetId: string;
  plotLabel: string;
  customerName: string | null;
  paymentPlanId: string | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const deallocate = useDeallocateLand();
  const open = Boolean(paymentPlanId);

  async function submit() {
    if (!paymentPlanId || reason.trim().length < REASON_MIN_LENGTH) return;
    try {
      await deallocate.mutateAsync({ paymentPlanId, reason: reason.trim() });
      await queryClient.invalidateQueries({ queryKey: assetKeys.all });
      toast.success("Allocation removed");
      setReason("");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove allocation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !deallocate.isPending) { setReason(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deallocate {plotLabel}?</DialogTitle>
          <DialogDescription>
            {customerName ? `${customerName}'s` : "This customer's"} entire plan allocation will be removed. If the plan holds other plots, those plots will also become available.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="asset-plot-deallocation-reason">Reason for deallocation</Label>
          <Textarea
            id="asset-plot-deallocation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this allocation is being removed"
            disabled={deallocate.isPending}
          />
          <p className="text-xs text-muted-foreground">{reason.trim().length}/{REASON_MIN_LENGTH} characters minimum</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deallocate.isPending}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={deallocate.isPending || reason.trim().length < REASON_MIN_LENGTH}>
            {deallocate.isPending ? "Removing…" : "Deallocate plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
