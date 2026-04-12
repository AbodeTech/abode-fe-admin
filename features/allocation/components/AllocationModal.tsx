"use client";

import React from "react";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { AllocationTableRowFragment } from "./AllocationTable";
import { useAllocateLand } from "../hooks/use-allocate-land";
import { useAssignLand } from "../hooks/use-assign-land";
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
import { ClipboardList, RotateCcw, Send } from "lucide-react";

export type AllocationModalMode = "assign" | "allocate" | "resend";

interface AllocationModalProps {
  open: boolean;
  mode: AllocationModalMode;
  client?: FragmentType<typeof AllocationTableRowFragment> | null;
  onOpenChange: (open: boolean) => void;
}

function parseAllocation(allocation: string | null | undefined): { block: string; plot: string } {
  if (!allocation) return { block: "", plot: "" };
  const parts = allocation.split(",").map((p) => p.trim());
  return { block: parts[0] ?? "", plot: parts[1] ?? "" };
}

export function AllocationModal({ open, mode, client, onOpenChange }: AllocationModalProps) {
  const allocationClient = getFragmentData(AllocationTableRowFragment, client);
  const { mutateAsync: allocateLand, isPending: isAllocating } = useAllocateLand();
  const { mutateAsync: assignLand, isPending: isAssigning } = useAssignLand();

  const isPending = isAllocating || isAssigning;

  const prefilled = parseAllocation(allocationClient?.allocation);
  const formKey = `${mode}-${allocationClient?.paymentPlan ?? "no-plan"}-${allocationClient?.allocation ?? "none"}`;

  const titles: Record<AllocationModalMode, string> = {
    assign: "Assign Block & Plot",
    allocate: "Send Allocation",
    resend: "Resend Allocation",
  };

  const descriptions: Record<AllocationModalMode, string> = {
    assign: "Save block and plot for this client without sending the allocation email.",
    allocate: "Send the allocation email to this client.",
    resend: "Resend the allocation email to this client.",
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allocationClient?.paymentPlan) return;

    const formData = new FormData(event.currentTarget);
    const block = String(formData.get("block") || "").trim();
    const plot = String(formData.get("plot") || "").trim();
    if (!block || !plot) return;

    try {
      if (mode === "assign") {
        await assignLand({ paymentPlanId: allocationClient.paymentPlan, block, plot });
        toast.success("Block and plot assigned successfully");
      } else {
        await allocateLand({ paymentPlanId: allocationClient.paymentPlan, block, plot });
        toast.success(mode === "resend" ? "Allocation resent" : "Allocation sent");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{allocationClient ? titles[mode] : "Select a client"}</DialogTitle>
          <DialogDescription>
            {allocationClient
              ? `${descriptions[mode]} — ${allocationClient.firstName} ${allocationClient.lastName}`
              : "Select a client to continue."}
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
                  Payment plan:{" "}
                  <span className="font-medium">{allocationClient.paymentPlan || "—"}</span>
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
                defaultValue={prefilled.block}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plot">Plot</Label>
              <Input
                id="plot"
                name="plot"
                placeholder="e.g., Plot K"
                defaultValue={prefilled.plot}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                type="button"
              >
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
                    {mode === "assign" ? "Saving..." : mode === "resend" ? "Resending..." : "Sending..."}
                  </>
                ) : mode === "assign" ? (
                  <>
                    <ClipboardList className="h-4 w-4" />
                    Save Assignment
                  </>
                ) : mode === "resend" ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Resend
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Allocation
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
