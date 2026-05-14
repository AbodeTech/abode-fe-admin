"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { AllocationTableRowFragment } from "./AllocationTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import {
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAssetBlocks,
  useAssetIdByName,
  useBlockPlots,
  type Block,
  type Plot,
} from "@/features/assets";
import { useAllocateLand } from "../hooks/use-allocate-land";
import { useDeallocateLand } from "../hooks/use-deallocate-land";

export type AllocationModalMode = "send" | "resend";

interface AllocationModalProps {
  open: boolean;
  mode: AllocationModalMode;
  client?: FragmentType<typeof AllocationTableRowFragment> | null;
  onOpenChange: (open: boolean) => void;
}

export function AllocationModal({
  open,
  mode,
  client,
  onOpenChange,
}: AllocationModalProps) {
  const allocationClient = getFragmentData(AllocationTableRowFragment, client);
  const units = allocationClient?.unit ?? 0;
  const assetSize = allocationClient?.assetSize ?? 0;
  const requiredSqm = units * assetSize;
  const assetName = allocationClient?.assetName ?? "";
  const assetType = allocationClient?.assetType ?? "";
  const paymentPlanId = allocationClient?.paymentPlan ?? "";

  const { data: assetId, isLoading: isResolvingAssetId } = useAssetIdByName(
    assetName,
    assetType
  );
  const { data: blocks = [], isLoading: isLoadingBlocks } = useAssetBlocks(
    assetId ?? ""
  );

  const [selectedPlotIds, setSelectedPlotIds] = useState<Set<string>>(new Set());
  const [selectedPlotsMeta, setSelectedPlotsMeta] = useState<
    Record<string, Plot>
  >({});
  const [isDeallocateConfirmOpen, setIsDeallocateConfirmOpen] = useState(false);

  const allocateLand = useAllocateLand();
  const deallocateLand = useDeallocateLand();

  useEffect(() => {
    if (open) {
      setSelectedPlotIds(new Set());
      setSelectedPlotsMeta({});
    }
  }, [open, allocationClient?.email]);

  const togglePlot = (plot: Plot) => {
    setSelectedPlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(plot._id)) next.delete(plot._id);
      else next.add(plot._id);
      return next;
    });
    setSelectedPlotsMeta((prev) => ({ ...prev, [plot._id]: plot }));
  };

  const selectedSqm = useMemo(() => {
    let total = 0;
    selectedPlotIds.forEach((id) => {
      const p = selectedPlotsMeta[id];
      if (p) total += p.size;
    });
    return total;
  }, [selectedPlotIds, selectedPlotsMeta]);

  const remaining = requiredSqm - selectedSqm;
  const isMatch = requiredSqm > 0 && remaining === 0;
  const isOver = remaining < 0;

  const handleConfirm = () => {
    if (!isMatch || !paymentPlanId) return;
    allocateLand.mutate(
      { paymentPlanId, plotIds: Array.from(selectedPlotIds) },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Allocation sent");
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleDeallocate = () => {
    if (!paymentPlanId) return;
    deallocateLand.mutate(paymentPlanId, {
      onSuccess: (data) => {
        toast.success(data.message || "Allocation cleared");
        setIsDeallocateConfirmOpen(false);
        onOpenChange(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const isLoading = isResolvingAssetId || isLoadingBlocks;
  const hasExistingAllocation = Boolean(allocationClient?.allocation);

  const title = mode === "resend" ? "Resend Allocation" : "Send Allocation";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {allocationClient ? title : "Select a client"}
            </DialogTitle>
            <DialogDescription>
              {allocationClient
                ? `Pick plots whose total sqm equals the purchased amount.`
                : "Select a client to continue."}
            </DialogDescription>
          </DialogHeader>

          {allocationClient && (
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Client summary */}
              <div className="rounded-md border p-3 bg-muted/40">
                <p className="text-sm font-medium">
                  {allocationClient.firstName} {allocationClient.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {allocationClient.email}
                </p>
                <Separator className="my-2" />
                <div className="text-xs space-y-1">
                  <p>Asset: {allocationClient.assetName}</p>
                  <p>
                    Units: <span className="font-semibold tabular-nums">{units}</span>
                    {" × "}
                    Size: <span className="font-semibold tabular-nums">{assetSize}</span> sqm
                    {" = "}
                    Required:{" "}
                    <span className="font-bold tabular-nums text-foreground">
                      {requiredSqm.toLocaleString()} sqm
                    </span>
                  </p>
                  {hasExistingAllocation && (
                    <p className="text-amber-600">
                      Current allocation: {allocationClient.allocation}
                    </p>
                  )}
                </div>
              </div>

              {/* Running sum */}
              <RunningSumBanner
                selected={selectedSqm}
                required={requiredSqm}
                remaining={remaining}
                isMatch={isMatch}
                isOver={isOver}
              />

              {/* Plots picker */}
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !assetId ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Could not resolve asset ID.
                </div>
              ) : blocks.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No blocks seeded for this asset. Go to the asset detail page
                    to add blocks and plots.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.map((block) => (
                    <BlockPlotPicker
                      key={block._id}
                      block={block}
                      selectedPlotIds={selectedPlotIds}
                      onTogglePlot={togglePlot}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-row! items-center justify-between gap-2 sm:gap-2!">
            {hasExistingAllocation ? (
              <Button
                variant="outline"
                onClick={() => setIsDeallocateConfirmOpen(true)}
                disabled={
                  deallocateLand.isPending || allocateLand.isPending
                }
                type="button"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Deallocate
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={allocateLand.isPending || deallocateLand.isPending}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!isMatch || !paymentPlanId || allocateLand.isPending}
                onClick={handleConfirm}
                className={cn("flex items-center gap-2")}
              >
                {allocateLand.isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    {mode === "resend" ? "Resending..." : "Allocating..."}
                  </>
                ) : mode === "resend" ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Resend
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Allocate {selectedPlotIds.size > 0 && `(${selectedPlotIds.size})`}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeallocateConfirmOpen}
        onOpenChange={setIsDeallocateConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deallocate this payment plan?</AlertDialogTitle>
            <AlertDialogDescription>
              All currently assigned plots will be released back to the
              available pool. Legacy block/plot strings will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deallocateLand.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeallocate}
              disabled={deallocateLand.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deallocateLand.isPending ? "Deallocating…" : "Deallocate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface RunningSumBannerProps {
  selected: number;
  required: number;
  remaining: number;
  isMatch: boolean;
  isOver: boolean;
}

function RunningSumBanner({
  selected,
  required,
  remaining,
  isMatch,
  isOver,
}: RunningSumBannerProps) {
  const color = isMatch
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : isOver
    ? "border-rose-200 bg-rose-50 text-rose-900"
    : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={cn("rounded-md border p-3 flex items-center gap-3", color)}>
      {isMatch ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : (
        <AlertTriangle className="h-5 w-5 shrink-0" />
      )}
      <div className="flex-1 text-sm">
        <p className="font-semibold">
          {isMatch
            ? "Allocation matches required total."
            : isOver
            ? `Over by ${Math.abs(remaining).toLocaleString()} sqm.`
            : remaining === required
            ? `Pick plots that sum to ${required.toLocaleString()} sqm.`
            : `${remaining.toLocaleString()} sqm remaining to reach target.`}
        </p>
        <p className="text-xs opacity-80">
          Selected: <span className="font-bold tabular-nums">{selected.toLocaleString()}</span>
          {" / "}
          Required: <span className="font-bold tabular-nums">{required.toLocaleString()}</span> sqm
        </p>
      </div>
    </div>
  );
}

interface BlockPlotPickerProps {
  block: Block;
  selectedPlotIds: Set<string>;
  onTogglePlot: (plot: Plot) => void;
}

function BlockPlotPicker({
  block,
  selectedPlotIds,
  onTogglePlot,
}: BlockPlotPickerProps) {
  const { data: plots = [], isLoading } = useBlockPlots({
    blockId: block._id,
    status: "available",
  });

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
            {block.label}
          </div>
          <p className="text-sm font-semibold">Block {block.label}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {isLoading ? "…" : `${plots.length} available`}
        </Badge>
      </div>
      {isLoading ? (
        <div className="py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading plots…
        </div>
      ) : plots.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">
          No available plots in this block.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {plots.map((plot) => {
            const checked = selectedPlotIds.has(plot._id);
            return (
              <label
                key={plot._id}
                className={cn(
                  "flex items-center gap-2 rounded-md border p-2 cursor-pointer text-xs transition-colors",
                  checked
                    ? "border-primary/50 bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onTogglePlot(plot)}
                />
                <div className="min-w-0">
                  <p className="font-semibold leading-none">
                    {plot.block_label}-{plot.plot_number}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                    {plot.size} sqm
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
