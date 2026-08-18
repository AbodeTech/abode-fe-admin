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
  Mail,
  Shuffle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAllocateFoPlan } from "@/features/asset-transactions";
import {
  useAssetIdByName,
  useAvailablePlotsForAsset,
  type Plot,
} from "../hooks/use-plots";
import { allocationKeys } from "../hooks/query-keys";
import { useAllocateLand } from "../hooks/use-allocate-land";
import { useDeallocateLand } from "../hooks/use-deallocate-land";
import { useReassignLand } from "../hooks/use-reassign-land";
import { useSendAllocationEmail } from "../hooks/use-send-allocation-email";

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
  const hasExistingAllocation = Boolean(allocationClient?.allocation);
  const isFo = assetType.trim().toLowerCase() === "full-ownership";

  const { data: assetId, isLoading: isResolvingAssetId } = useAssetIdByName(
    isFo ? "" : assetName,
    isFo ? "" : assetType
  );
  const { data: availablePlots = [], isLoading: isLoadingPlots } =
    useAvailablePlotsForAsset({
      assetId: isFo ? "" : (assetId ?? ""),
      size: assetSize || undefined,
      enabled: !isFo,
    });

  const [selectedPlotIds, setSelectedPlotIds] = useState<Set<string>>(new Set());
  const [selectedPlotsMeta, setSelectedPlotsMeta] = useState<
    Record<string, Plot>
  >({});
  const [isDeallocateConfirmOpen, setIsDeallocateConfirmOpen] = useState(false);
  const [foBlock, setFoBlock] = useState("");
  const [foPlot, setFoPlot] = useState("");

  const queryClient = useQueryClient();
  const allocateFoPlan = useAllocateFoPlan();
  const allocateLand = useAllocateLand();
  const deallocateLand = useDeallocateLand();
  const reassignLand = useReassignLand();
  const sendAllocationEmail = useSendAllocationEmail();

  useEffect(() => {
    if (open) {
      setSelectedPlotIds(new Set());
      setSelectedPlotsMeta({});
      setFoBlock("");
      setFoPlot("");
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
  const hasSelection = selectedPlotIds.size > 0;

  // Group plots by block_label for display
  const plotsByBlock = useMemo(() => {
    const groups = new Map<string, Plot[]>();
    for (const plot of availablePlots) {
      const arr = groups.get(plot.block_label) ?? [];
      arr.push(plot);
      groups.set(plot.block_label, arr);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => a.plot_number - b.plot_number);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [availablePlots]);

  const handleFoAllocate = () => {
    const block = foBlock.trim();
    const plot = foPlot.trim();
    if (!paymentPlanId || !block || !plot) return;
    allocateFoPlan.mutate(
      { id: paymentPlanId, block, plot },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: allocationKeys.all });
          toast.success(data.message || `Allocated block ${block}, plot ${plot}`);
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleAllocate = () => {
    if (isFo) {
      handleFoAllocate();
      return;
    }
    if (!isMatch || !paymentPlanId) return;
    allocateLand.mutate(
      { paymentPlanId, plotIds: Array.from(selectedPlotIds) },
      {
        onSuccess: (data) => {
          toast.success(data.allocateLand?.message || "Plots assigned");
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleReassign = () => {
    if (isFo) {
      handleFoAllocate();
      return;
    }
    if (!isMatch || !paymentPlanId) return;
    reassignLand.mutate(
      { paymentPlanId, newPlotIds: Array.from(selectedPlotIds) },
      {
        onSuccess: (data) => {
          toast.success(data.reassignLand?.message || "Allocation reassigned");
          onOpenChange(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleResendEmail = () => {
    if (!paymentPlanId) return;
    sendAllocationEmail.mutate(paymentPlanId, {
      onSuccess: (data) => {
        toast.success(
          data.sendAllocationEmail?.message || "Allocation email resent"
        );
        onOpenChange(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleDeallocate = () => {
    if (!paymentPlanId) return;
    deallocateLand.mutate(paymentPlanId, {
      onSuccess: (data) => {
        toast.success(data.deallocateLand?.message || "Allocation cleared");
        setIsDeallocateConfirmOpen(false);
        onOpenChange(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const isLoading = !isFo && (isResolvingAssetId || isLoadingPlots);
  const foReady = foBlock.trim().length > 0 && foPlot.trim().length > 0;
  const anyMutationPending =
    allocateLand.isPending ||
    allocateFoPlan.isPending ||
    reassignLand.isPending ||
    sendAllocationEmail.isPending ||
    deallocateLand.isPending;

  const title = mode === "resend" ? "Manage Allocation" : "Assign Plots";

  // Determine which primary action is active
  const primaryAction = useMemo(() => {
    if (isFo) {
      if (mode === "send" || foReady) {
        return {
          kind: "allocate" as const,
          label: hasExistingAllocation ? "Update allocation" : "Assign",
          icon: <Send className="h-4 w-4" />,
          pendingLabel: "Assigning...",
          disabled: !foReady || !paymentPlanId,
          handler: handleAllocate,
        };
      }
      return {
        kind: "resend" as const,
        label: "Resend email",
        icon: <Mail className="h-4 w-4" />,
        pendingLabel: "Sending...",
        disabled: !paymentPlanId || !hasExistingAllocation,
        handler: handleResendEmail,
      };
    }
    if (mode === "send") {
      return {
        kind: "allocate" as const,
        label: `Assign${hasSelection ? ` (${selectedPlotIds.size})` : ""}`,
        icon: <Send className="h-4 w-4" />,
        pendingLabel: "Assigning...",
        disabled: !isMatch,
        handler: handleAllocate,
      };
    }
    // resend mode
    if (hasSelection) {
      return {
        kind: "reassign" as const,
        label: `Reassign (${selectedPlotIds.size})`,
        icon: <Shuffle className="h-4 w-4" />,
        pendingLabel: "Reassigning...",
        disabled: !isMatch,
        handler: handleReassign,
      };
    }
    return {
      kind: "resend" as const,
      label: "Resend email",
      icon: <Mail className="h-4 w-4" />,
      pendingLabel: "Sending...",
      disabled: !paymentPlanId || !hasExistingAllocation,
      handler: handleResendEmail,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFo,
    foReady,
    mode,
    hasSelection,
    isMatch,
    selectedPlotIds.size,
    paymentPlanId,
    hasExistingAllocation,
  ]);

  const primaryPending =
    (primaryAction.kind === "allocate" &&
      (isFo ? allocateFoPlan.isPending : allocateLand.isPending)) ||
    (primaryAction.kind === "reassign" &&
      (isFo ? allocateFoPlan.isPending : reassignLand.isPending)) ||
    (primaryAction.kind === "resend" && sendAllocationEmail.isPending);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {allocationClient ? title : "Select a client"}
            </DialogTitle>
            <DialogDescription>
              {!allocationClient
                ? "Select a client to continue."
                : isFo
                ? "Enter the block and plot assigned to this full-ownership plan."
                : mode === "send"
                ? "Pick plots whose total sqm equals the purchased amount."
                : "Resend the current allocation email, or pick new plots to reassign."}
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

              {isFo ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="fo-alloc-block">Block</Label>
                    <Input
                      id="fo-alloc-block"
                      value={foBlock}
                      onChange={(event) => setFoBlock(event.target.value)}
                      placeholder="A"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fo-alloc-plot">Plot</Label>
                    <Input
                      id="fo-alloc-plot"
                      value={foPlot}
                      onChange={(event) => setFoPlot(event.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {(mode === "send" || hasSelection) && (
                    <RunningSumBanner
                      selected={selectedSqm}
                      required={requiredSqm}
                      remaining={remaining}
                      isMatch={isMatch}
                      isOver={isOver}
                    />
                  )}

                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : !assetId ? (
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                      Could not resolve asset ID.
                    </div>
                  ) : availablePlots.length === 0 ? (
                    <div className="rounded-md border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No available plots for this asset. Go to the asset detail
                        page to seed blocks and plots.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {plotsByBlock.map(([blockLabel, plots]) => (
                        <BlockPlotPicker
                          key={blockLabel}
                          blockLabel={blockLabel}
                          plots={plots}
                          selectedPlotIds={selectedPlotIds}
                          onTogglePlot={togglePlot}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex-row! items-center justify-between gap-2 sm:gap-2!">
            {hasExistingAllocation ? (
              <Button
                variant="outline"
                onClick={() => setIsDeallocateConfirmOpen(true)}
                disabled={anyMutationPending}
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
                disabled={anyMutationPending}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={primaryAction.disabled || anyMutationPending}
                onClick={primaryAction.handler}
                className={cn("flex items-center gap-2")}
              >
                {primaryPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    {primaryAction.pendingLabel}
                  </>
                ) : (
                  <>
                    {primaryAction.icon}
                    {primaryAction.label}
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
            <Button
              onClick={handleDeallocate}
              disabled={deallocateLand.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deallocateLand.isPending ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-1.5 animate-spin" />
                  Deallocating…
                </>
              ) : (
                "Deallocate"
              )}
            </Button>
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
  blockLabel: string;
  plots: Plot[];
  selectedPlotIds: Set<string>;
  onTogglePlot: (plot: Plot) => void;
}

function BlockPlotPicker({
  blockLabel,
  plots,
  selectedPlotIds,
  onTogglePlot,
}: BlockPlotPickerProps) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
            {blockLabel}
          </div>
          <p className="text-sm font-semibold">Block {blockLabel}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {plots.length} available
        </Badge>
      </div>
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
    </div>
  );
}
