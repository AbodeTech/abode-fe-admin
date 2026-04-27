"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Layers, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AssetPlot {
  id: string;
  label: string;
  totalBlocks: number;
  allocatedBlockNumbers: number[];
}

const MOCK_PLOTS: AssetPlot[] = [
  { id: "p1", label: "A", totalBlocks: 50, allocatedBlockNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: "p2", label: "B", totalBlocks: 30, allocatedBlockNumbers: [1, 2, 3] },
  { id: "p3", label: "C", totalBlocks: 40, allocatedBlockNumbers: [] },
];

interface PlotsManagerProps {
  assetName: string;
  assetType: string;
}

export function PlotsManager({ assetName }: PlotsManagerProps) {
  const [plots, setPlots] = useState<AssetPlot[]>(MOCK_PLOTS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<AssetPlot | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<AssetPlot | null>(null);

  const totals = useMemo(() => {
    const totalBlocks = plots.reduce((sum, p) => sum + p.totalBlocks, 0);
    const allocated = plots.reduce((sum, p) => sum + p.allocatedBlockNumbers.length, 0);
    return { totalBlocks, allocated, available: totalBlocks - allocated };
  }, [plots]);

  const handleCreate = (label: string, totalBlocks: number) => {
    const trimmed = label.trim().toUpperCase();
    if (plots.some((p) => p.label.toUpperCase() === trimmed)) {
      toast.error(`Plot "${trimmed}" already exists`);
      return;
    }
    setPlots((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        label: trimmed,
        totalBlocks,
        allocatedBlockNumbers: [],
      },
    ]);
    toast.success(`Plot "${trimmed}" created with ${totalBlocks} blocks`);
    setIsCreateOpen(false);
  };

  const handleUpdate = (plotId: string, totalBlocks: number) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return;

    const maxAllocated = Math.max(0, ...plot.allocatedBlockNumbers);
    if (totalBlocks < maxAllocated) {
      toast.error(
        `Cannot reduce to ${totalBlocks} — block ${plot.label}-${maxAllocated} is already allocated. Lowest safe value: ${maxAllocated}.`
      );
      return;
    }

    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, totalBlocks } : p))
    );
    toast.success(`Plot "${plot.label}" updated to ${totalBlocks} blocks`);
    setEditingPlot(null);
  };

  const handleDelete = (plotId: string) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return;

    if (plot.allocatedBlockNumbers.length > 0) {
      toast.error(`Cannot delete plot "${plot.label}" — ${plot.allocatedBlockNumbers.length} block(s) allocated`);
      return;
    }

    setPlots((prev) => prev.filter((p) => p.id !== plotId));
    toast.success(`Plot "${plot.label}" deleted`);
    setDeletingPlot(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Plot Inventory
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Define plots and their block capacity for {assetName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-bold tabular-nums">{totals.totalBlocks}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Allocated: </span>
              <span className="font-bold tabular-nums text-amber-600">{totals.allocated}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Available: </span>
              <span className="font-bold tabular-nums text-emerald-600">{totals.available}</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Plot
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {plots.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No plots seeded yet.</p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => setIsCreateOpen(true)}
            >
              Add your first plot
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plots.map((plot) => {
              const allocated = plot.allocatedBlockNumbers.length;
              const available = plot.totalBlocks - allocated;
              const occupancyPct = plot.totalBlocks > 0
                ? Math.round((allocated / plot.totalBlocks) * 100)
                : 0;
              const isFull = available === 0;

              return (
                <div
                  key={plot.id}
                  className={cn(
                    "rounded-xl border p-4 space-y-3 transition-colors",
                    isFull && "bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                        {plot.label}
                      </div>
                      <div>
                        <p className="font-semibold leading-none">Plot {plot.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plot.totalBlocks} blocks
                        </p>
                      </div>
                    </div>
                    {isFull && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                        Full
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-semibold tabular-nums">{occupancyPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          occupancyPct >= 90
                            ? "bg-rose-500"
                            : occupancyPct >= 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        )}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span>
                        <span className="text-amber-600 font-bold tabular-nums">{allocated}</span>
                        <span className="text-muted-foreground ml-1">allocated</span>
                      </span>
                      <span>
                        <span className="text-emerald-600 font-bold tabular-nums">{available}</span>
                        <span className="text-muted-foreground ml-1">free</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setEditingPlot(plot)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => setDeletingPlot(plot)}
                      disabled={allocated > 0}
                      title={allocated > 0 ? "Cannot delete — has allocated blocks" : "Delete plot"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CreatePlotDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
      />

      <EditPlotDialog
        plot={editingPlot}
        onClose={() => setEditingPlot(null)}
        onSubmit={(totalBlocks) => editingPlot && handleUpdate(editingPlot.id, totalBlocks)}
      />

      <AlertDialog open={!!deletingPlot} onOpenChange={(open) => !open && setDeletingPlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plot &quot;{deletingPlot?.label}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove plot {deletingPlot?.label} ({deletingPlot?.totalBlocks} blocks)
              from this asset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlot && handleDelete(deletingPlot.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface CreatePlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (label: string, totalBlocks: number) => void;
}

function CreatePlotDialog({ open, onOpenChange, onSubmit }: CreatePlotDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const label = String(formData.get("label") || "").trim();
    const totalBlocks = Number(formData.get("totalBlocks") || 0);

    if (!label) {
      toast.error("Plot label is required");
      return;
    }
    if (totalBlocks < 1) {
      toast.error("Block count must be at least 1");
      return;
    }
    onSubmit(label, totalBlocks);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new plot</DialogTitle>
          <DialogDescription>
            Define a plot label and the number of blocks it contains.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" key={open ? "open" : "closed"}>
          <div className="space-y-2">
            <Label htmlFor="label">Plot label</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., A, B, C"
              maxLength={5}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Use a short identifier. Will be uppercased.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalBlocks">Number of blocks</Label>
            <Input
              id="totalBlocks"
              name="totalBlocks"
              type="number"
              min={1}
              placeholder="e.g., 50"
              required
            />
            <p className="text-xs text-muted-foreground">
              How many blocks this plot contains (e.g. 50 → blocks 1 to 50).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create plot</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditPlotDialogProps {
  plot: AssetPlot | null;
  onClose: () => void;
  onSubmit: (totalBlocks: number) => void;
}

function EditPlotDialog({ plot, onClose, onSubmit }: EditPlotDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalBlocks = Number(formData.get("totalBlocks") || 0);
    if (totalBlocks < 1) {
      toast.error("Block count must be at least 1");
      return;
    }
    onSubmit(totalBlocks);
  };

  if (!plot) return null;
  const allocated = plot.allocatedBlockNumbers.length;
  const maxAllocated = Math.max(0, ...plot.allocatedBlockNumbers);

  return (
    <Dialog open={!!plot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit plot &quot;{plot.label}&quot;</DialogTitle>
          <DialogDescription>
            Change the total number of blocks in this plot.
          </DialogDescription>
        </DialogHeader>

        {allocated > 0 && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {allocated} block{allocated > 1 ? "s" : ""} currently allocated.
              </p>
              <p className="text-amber-800 mt-0.5">
                Highest allocated: {plot.label}-{maxAllocated}. You cannot reduce below this number.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" key={plot.id}>
          <div className="space-y-2">
            <Label htmlFor="totalBlocks">Number of blocks</Label>
            <Input
              id="totalBlocks"
              name="totalBlocks"
              type="number"
              min={Math.max(1, maxAllocated)}
              defaultValue={plot.totalBlocks}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Currently: {plot.totalBlocks} blocks. Increasing is always safe.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
