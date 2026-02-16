"use client";

import React from "react";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { AllocationTableRowFragment } from "./AllocationTable";
import { useAllocateLand } from "../hooks/use-allocate-land";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RotateCcw, Send } from "lucide-react";

interface AllocationModalProps {
  open: boolean;
  mode: "send" | "resend";
  client?: FragmentType<typeof AllocationTableRowFragment> | null;
  onOpenChange: (open: boolean) => void;
}

export function AllocationModal({ open, mode, client, onOpenChange }: AllocationModalProps) {
  const allocationClient = getFragmentData(AllocationTableRowFragment, client);
  const { mutateAsync: allocateLand, isPending } = useAllocateLand();
  const initialAllocationParts =
    mode === "resend" && allocationClient?.allocation
      ? allocationClient.allocation.split(",").map((part) => part.trim())
      : [];
  const initialBlock = initialAllocationParts[0] || "";
  const initialPlot = initialAllocationParts[1] || "";
  const formKey = `${mode}-${allocationClient?.paymentPlan || "no-plan"}-${allocationClient?.allocation || "none"}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allocationClient?.paymentPlan) return;
    const formData = new FormData(event.currentTarget);
    const block = String(formData.get("block") || "").trim();
    const plot = String(formData.get("plot") || "").trim();
    if (!block || !plot) return;

    try {
      await allocateLand({
        paymentPlanId: allocationClient.paymentPlan,
        block,
        plot,
      });
      toast.success(mode === "resend" ? "Allocation resent" : "Allocation sent");
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to allocate land");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "resend" ? "Resend Land Allocation" : "Send Land Allocation"}
          </DialogTitle>
          <DialogDescription>
            {allocationClient
              ? `Assign allocation for ${allocationClient.firstName} ${allocationClient.lastName}`
              : "Select a client to send allocation."}
          </DialogDescription>
        </DialogHeader>

        {allocationClient && (
          <form key={formKey} className="space-y-3" onSubmit={handleSubmit}>
            <div className="rounded-md border p-3 bg-muted/40">
              <p className="text-sm font-medium">
                {allocationClient.firstName} {allocationClient.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{allocationClient.email}</p>
              <Separator className="my-2" />
              <div className="text-xs space-y-1">
                <p>Asset: {allocationClient.assetName}</p>
                <p>
                  Payment plan: <span className="font-medium">{allocationClient.paymentPlan || "—"}</span>
                </p>
                {allocationClient.allocation && (
                  <p className="text-amber-600">
                    Current allocation: {allocationClient.allocation}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block">Block</Label>
              <Input
                id="block"
                name="block"
                placeholder="e.g., Block 5"
                defaultValue={initialBlock}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plot">Plot</Label>
              <Input
                id="plot"
                name="plot"
                placeholder="e.g., Plot K"
                defaultValue={initialPlot}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !allocationClient}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    {mode === "resend" ? "Resending..." : "Sending..."}
                  </>
                ) : mode === "resend" ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Resend
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
