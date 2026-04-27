"use client";

import React, { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RotateCcw, Send, Sparkles, Pencil, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type AllocationModalMode = "send" | "resend";

interface AllocationModalProps {
  open: boolean;
  mode: AllocationModalMode;
  client?: FragmentType<typeof AllocationTableRowFragment> | null;
  onOpenChange: (open: boolean) => void;
}

interface AssetPlotMock {
  label: string;
  totalBlocks: number;
  allocatedBlockNumbers: number[];
}

// MOCK: in production these come from useAssetPlots(assetName)
const MOCK_ASSET_PLOTS: AssetPlotMock[] = [
  { label: "A", totalBlocks: 50, allocatedBlockNumbers: Array.from({ length: 12 }, (_, i) => i + 1) },
  { label: "B", totalBlocks: 30, allocatedBlockNumbers: [1, 2, 3] },
  { label: "C", totalBlocks: 40, allocatedBlockNumbers: [] },
];

interface Suggestion {
  plotLabel: string;
  blockNumbers: number[];
}

function findContiguousRun(
  taken: Set<number>,
  totalBlocks: number,
  units: number
): number[] | null {
  let runStart = -1;
  let runLen = 0;

  for (let i = 1; i <= totalBlocks; i++) {
    if (!taken.has(i)) {
      if (runStart === -1) runStart = i;
      runLen += 1;
      if (runLen >= units) {
        return Array.from({ length: units }, (_, k) => runStart + k);
      }
    } else {
      runStart = -1;
      runLen = 0;
    }
  }
  return null;
}

function suggestNextAllocation(plots: AssetPlotMock[], units: number): Suggestion | null {
  for (const plot of plots) {
    const taken = new Set(plot.allocatedBlockNumbers);
    const run = findContiguousRun(taken, plot.totalBlocks, units);
    if (run) {
      return { plotLabel: plot.label, blockNumbers: run };
    }
  }
  return null;
}

export function AllocationModal({ open, mode, client, onOpenChange }: AllocationModalProps) {
  const allocationClient = getFragmentData(AllocationTableRowFragment, client);
  const units = allocationClient?.unit ?? 1;

  const suggestion = useMemo(
    () => (allocationClient ? suggestNextAllocation(MOCK_ASSET_PLOTS, units) : null),
    [allocationClient, units]
  );

  const [isOverriding, setIsOverriding] = useState(false);
  const [overridePlot, setOverridePlot] = useState<string>(suggestion?.plotLabel ?? "");
  const [overrideStart, setOverrideStart] = useState<string>(
    suggestion ? String(suggestion.blockNumbers[0]) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // reset override state whenever modal reopens with a different client
  React.useEffect(() => {
    if (open) {
      setIsOverriding(false);
      setOverridePlot(suggestion?.plotLabel ?? "");
      setOverrideStart(suggestion ? String(suggestion.blockNumbers[0]) : "");
    }
  }, [open, suggestion]);

  const finalAllocation: Suggestion | null = useMemo(() => {
    if (!isOverriding) return suggestion;
    const plot = MOCK_ASSET_PLOTS.find((p) => p.label === overridePlot);
    if (!plot) return null;
    const start = Number(overrideStart);
    if (!Number.isFinite(start) || start < 1 || start + units - 1 > plot.totalBlocks) return null;
    const blocks = Array.from({ length: units }, (_, i) => start + i);
    const taken = new Set(plot.allocatedBlockNumbers);
    if (blocks.some((b) => taken.has(b))) return null;
    return { plotLabel: plot.label, blockNumbers: blocks };
  }, [isOverriding, suggestion, overridePlot, overrideStart, units]);

  const overrideError = useMemo(() => {
    if (!isOverriding) return null;
    if (!overridePlot) return "Pick a plot";
    const plot = MOCK_ASSET_PLOTS.find((p) => p.label === overridePlot);
    if (!plot) return "Plot not found";
    const start = Number(overrideStart);
    if (!Number.isFinite(start) || start < 1) return "Enter a valid starting block";
    if (start + units - 1 > plot.totalBlocks) {
      return `Range exceeds plot capacity (max start: ${plot.totalBlocks - units + 1})`;
    }
    const taken = new Set(plot.allocatedBlockNumbers);
    const conflict = Array.from({ length: units }, (_, i) => start + i).find((b) => taken.has(b));
    if (conflict !== undefined) return `Block ${plot.label}-${conflict} is already allocated`;
    return null;
  }, [isOverriding, overridePlot, overrideStart, units]);

  const handleConfirm = async () => {
    if (!finalAllocation || !allocationClient?.paymentPlan) return;
    setIsSubmitting(true);
    // Mock API call delay
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    toast.success(
      mode === "resend"
        ? `Allocation resent: ${finalAllocation.plotLabel}-${finalAllocation.blockNumbers.join(", ")}`
        : `Allocated ${finalAllocation.blockNumbers.length} block(s): ${finalAllocation.plotLabel}-${finalAllocation.blockNumbers.join(", ")}`
    );
    onOpenChange(false);
  };

  const title = mode === "resend" ? "Resend Allocation" : "Send Allocation";
  const description =
    mode === "resend"
      ? "Resend the allocation email to this client."
      : "Confirm the suggested allocation or override it manually.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{allocationClient ? title : "Select a client"}</DialogTitle>
          <DialogDescription>
            {allocationClient
              ? `${description} — ${allocationClient.firstName} ${allocationClient.lastName}`
              : "Select a client to continue."}
          </DialogDescription>
        </DialogHeader>

        {allocationClient && (
          <div className="space-y-4">
            {/* Client summary */}
            <div className="rounded-md border p-3 bg-muted/40">
              <p className="text-sm font-medium">
                {allocationClient.firstName} {allocationClient.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{allocationClient.email}</p>
              <Separator className="my-2" />
              <div className="text-xs space-y-1">
                <p>Asset: {allocationClient.assetName}</p>
                <div className="flex items-center gap-3">
                  <span>
                    Units bought:{" "}
                    <span className="font-semibold tabular-nums text-foreground">
                      {units}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    → {units} block{units > 1 ? "s" : ""} to allocate
                  </span>
                </div>
                {allocationClient.allocation && (
                  <p className="text-amber-600">
                    Current allocation: {allocationClient.allocation}
                  </p>
                )}
              </div>
            </div>

            {/* Suggestion / override block */}
            {!suggestion && !isOverriding ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm">
                <p className="font-semibold text-rose-900">No contiguous range available</p>
                <p className="text-rose-700 text-xs mt-1">
                  Could not find {units} contiguous free block(s) across any plot. You can
                  override manually or seed more plots on the asset page.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsOverriding(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Override manually
                </Button>
              </div>
            ) : !isOverriding && finalAllocation ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Suggested allocation
                      </p>
                      <p className="text-lg font-bold text-emerald-900 mt-0.5">
                        Plot {finalAllocation.plotLabel} —{" "}
                        Blocks {finalAllocation.blockNumbers.join(", ")}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Next contiguous range of {units} block{units > 1 ? "s" : ""}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {finalAllocation.blockNumbers.map((b) => (
                    <Badge
                      key={b}
                      className="bg-emerald-600 hover:bg-emerald-600 text-white tabular-nums"
                    >
                      {finalAllocation.plotLabel}-{b}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100 px-2"
                  onClick={() => setIsOverriding(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Override manually
                </Button>
              </div>
            ) : (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Manual override
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOverriding(false)}
                    className="text-xs h-7 px-2"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Use suggestion
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="override-plot" className="text-xs">Plot</Label>
                    <Select value={overridePlot} onValueChange={setOverridePlot}>
                      <SelectTrigger id="override-plot">
                        <SelectValue placeholder="Pick a plot" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_ASSET_PLOTS.map((plot) => {
                          const free = plot.totalBlocks - plot.allocatedBlockNumbers.length;
                          return (
                            <SelectItem
                              key={plot.label}
                              value={plot.label}
                              disabled={free < units}
                            >
                              Plot {plot.label}{" "}
                              <span className="text-muted-foreground ml-1">
                                ({free} free)
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="override-start" className="text-xs">
                      Starting block #
                    </Label>
                    <Input
                      id="override-start"
                      type="number"
                      min={1}
                      value={overrideStart}
                      onChange={(e) => setOverrideStart(e.target.value)}
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>
                {finalAllocation && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground self-center mr-1">
                      Will allocate:
                    </span>
                    {finalAllocation.blockNumbers.map((b) => (
                      <Badge
                        key={b}
                        variant="outline"
                        className="tabular-nums border-emerald-300 text-emerald-700"
                      >
                        {finalAllocation.plotLabel}-{b}
                      </Badge>
                    ))}
                  </div>
                )}
                {overrideError && (
                  <p className="text-xs text-rose-600 font-medium">{overrideError}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || !finalAllocation}
                onClick={handleConfirm}
                className={cn("flex items-center gap-2")}
              >
                {isSubmitting ? (
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
                    {isOverriding ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {isOverriding ? "Confirm override" : "Confirm & send"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
