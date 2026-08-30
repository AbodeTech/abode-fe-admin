"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Layers,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  blockStats,
  expandPlotRanges,
  isAllocated,
  plotName,
  type Block,
  type Plot,
  type PlotRange,
} from "../../schemas/block-plot.schema";
import {
  useAssetBlocks,
  useCreateBlock,
  useDeleteBlock,
} from "../../hooks/use-blocks";
import {
  useBlockPlots,
  useBulkCreatePlots,
  useDeletePlot,
  useUpdatePlot,
} from "../../hooks/use-plots";

/* ============================================================
 * Block inventory — the land this asset is actually made of.
 *
 * Blocks group plots; plots are what the allocation screen hands to a buyer.
 * The asset id comes from the route, so there is no name→id lookup any more.
 *
 * Both destructive paths are gated on the same rule the BE enforces: anything
 * allocated is frozen. An allocated plot cannot be resized, renumbered or
 * deleted, and a block holding one cannot be deleted. v1 had a "resize anyway"
 * override; abode-be-v2 has no such escape hatch, so the checkbox is gone
 * rather than kept as a button that always fails.
 * ============================================================ */

export function BlocksManager({ assetId }: { assetId: string }) {
  const { data: blocks = [], isLoading, isError, error } = useAssetBlocks(assetId);
  const createBlock = useCreateBlock(assetId);
  const deleteBlock = useDeleteBlock(assetId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [managingBlock, setManagingBlock] = useState<Block | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<Block | null>(null);

  const handleCreateBlock = (label: string, description: string) => {
    const trimmed = label.trim().toUpperCase();
    if (blocks.some((block) => block.label.toUpperCase() === trimmed)) {
      toast.error(`Block "${trimmed}" already exists`);
      return;
    }
    createBlock.mutate(
      { label: trimmed, description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Block "${trimmed}" created`);
          setIsCreateOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleDeleteBlock = (block: Block) => {
    deleteBlock.mutate(block._id, {
      onSuccess: () => {
        toast.success(`Block "${block.label}" deleted`);
        setDeletingBlock(null);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Boxes className="h-5 w-5 text-muted-foreground" />
            Block inventory
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Blocks and their plots. Allocated plots are frozen — the backend
            refuses to resize or remove them.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} disabled={isLoading}>
          <Plus className="mr-1 h-4 w-4" />
          Add block
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Loading block inventory…</p>
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 py-8 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-rose-500" />
            <p className="text-sm text-rose-700">
              {error?.message ?? "Could not load blocks."}
            </p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Layers className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No blocks seeded yet.</p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => setIsCreateOpen(true)}
            >
              Add your first block
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {blocks.map((block) => (
              <BlockCard
                key={block._id}
                block={block}
                onManage={() => setManagingBlock(block)}
                onDelete={() => setDeletingBlock(block)}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CreateBlockDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateBlock}
        isSubmitting={createBlock.isPending}
      />

      <ManageBlockPlotsDialog
        assetId={assetId}
        block={managingBlock}
        onClose={() => setManagingBlock(null)}
      />

      <AlertDialog
        open={!!deletingBlock}
        onOpenChange={(open) => !open && setDeletingBlock(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete block &quot;{deletingBlock?.label}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The block and its plots are soft-deleted. The backend refuses this
              if any plot in the block is already allocated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBlock.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBlock && handleDeleteBlock(deletingBlock)}
              disabled={deleteBlock.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleteBlock.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function BlockCard({
  block,
  onManage,
  onDelete,
}: {
  block: Block;
  onManage: () => void;
  onDelete: () => void;
}) {
  const { data: plots = [], isLoading } = useBlockPlots({ blockId: block._id });
  const stats = useMemo(() => blockStats(plots), [plots]);

  const blocked = stats.allocated > 0;

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
          {block.label}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-none">Block {block.label}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {block.description || "No description"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/40 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plots</p>
          <p className="text-sm font-bold tabular-nums">{isLoading ? "…" : stats.total}</p>
        </div>
        <div className="rounded-md bg-emerald-50 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700">Free</p>
          <p className="text-sm font-bold tabular-nums text-emerald-700">
            {isLoading ? "…" : stats.available}
          </p>
        </div>
        <div className="rounded-md bg-amber-50 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-amber-700">Allocated</p>
          <p className="text-sm font-bold tabular-nums text-amber-700">
            {isLoading ? "…" : stats.allocated}
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Total: <span className="font-semibold tabular-nums">{stats.totalSqm.toLocaleString()}</span> sqm
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={onManage}>
          <Pencil className="mr-1 h-3 w-3" />
          Manage plots
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={onDelete}
          disabled={isLoading || blocked}
          title={blocked ? "Cannot delete — this block has allocated plots" : "Delete block"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CreateBlockDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (label: string, description: string) => void;
  isSubmitting?: boolean;
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const label = String(formData.get("label") || "").trim();
    if (!label) {
      toast.error("Block label is required");
      return;
    }
    onSubmit(label, String(formData.get("description") || ""));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add new block</DialogTitle>
          <DialogDescription>
            A block groups plots. Add plots to it after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" key={open ? "open" : "closed"}>
          <div className="space-y-2">
            <Label htmlFor="label">Block label</Label>
            <Input id="label" name="label" placeholder="e.g., A, B, C" maxLength={5} autoFocus required />
            <p className="text-xs text-muted-foreground">
              Short identifier. Uppercased, and unique within this asset.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g., West-side blocks adjacent to road"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManageBlockPlotsDialog({
  assetId,
  block,
  onClose,
}: {
  assetId: string;
  block: Block | null;
  onClose: () => void;
}) {
  const blockId = block?._id ?? "";
  const ids = { blockId, assetId };

  const { data: plots = [], isLoading } = useBlockPlots({ blockId, enabled: !!blockId });
  const createPlots = useBulkCreatePlots(ids);
  const updatePlot = useUpdatePlot(ids);
  const deletePlot = useDeletePlot(ids);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null);

  if (!block) return null;

  const stats = blockStats(plots);

  const handleCreatePlots = (ranges: PlotRange[]) => {
    const expansion = expandPlotRanges(ranges, new Set(plots.map((plot) => plot.plot_number)));
    if (!expansion.ok) {
      toast.error(expansion.error);
      return;
    }
    createPlots.mutate(expansion.plots, {
      onSuccess: () => {
        const count = expansion.plots.length;
        toast.success(`Created ${count} plot${count === 1 ? "" : "s"}`);
        setIsAddOpen(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleUpdatePlot = (plot: Plot, changes: { plot_number?: number; size?: number }) => {
    updatePlot.mutate(
      { plotId: plot._id, ...changes },
      {
        onSuccess: () => {
          toast.success(`Plot ${plotName(plot)} updated`);
          setEditingPlot(null);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleDeletePlot = (plot: Plot) => {
    deletePlot.mutate(plot._id, {
      onSuccess: () => {
        toast.success(`Plot ${plotName(plot)} deleted`);
        setDeletingPlot(null);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <Dialog open={!!block} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Block {block.label}</span>
            <Badge variant="secondary" className="text-xs">
              {stats.total} plots · {stats.totalSqm.toLocaleString()} sqm
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {block.description || "Add plots and edit their sizes."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Plot numbers are unique within this block. Sizes are in sqm.
          </p>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add plots
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading plots…</p>
            </div>
          ) : plots.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No plots in this block. Click &quot;Add plots&quot; to seed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plot</TableHead>
                  <TableHead>Size (sqm)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plots.map((plot) => {
                  const frozen = isAllocated(plot);
                  return (
                    <TableRow key={plot._id}>
                      <TableCell className="font-semibold">{plotName(plot)}</TableCell>
                      <TableCell className="tabular-nums">{plot.size}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            frozen
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {plot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {frozen ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                            title="Allocated plots cannot be edited or deleted"
                          >
                            <Lock className="h-3 w-3" />
                            Locked
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setEditingPlot(plot)}
                              title="Edit plot"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => setDeletingPlot(plot)}
                              title="Delete plot"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>

        <AddPlotsDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          onSubmit={handleCreatePlots}
          isSubmitting={createPlots.isPending}
          existingPlotNumbers={new Set(plots.map((plot) => plot.plot_number))}
        />

        <EditPlotDialog
          plot={editingPlot}
          onClose={() => setEditingPlot(null)}
          onSubmit={handleUpdatePlot}
          isSubmitting={updatePlot.isPending}
        />

        <AlertDialog
          open={!!deletingPlot}
          onOpenChange={(open) => !open && setDeletingPlot(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete plot {deletingPlot ? plotName(deletingPlot) : ""}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                The plot is soft-deleted and its number becomes free to reuse in
                this block.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePlot.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPlot && handleDeletePlot(deletingPlot)}
                disabled={deletePlot.isPending}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {deletePlot.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

type DraftRange = { id: string; from: string; to: string; size: string };

const EMPTY_RANGE: DraftRange = { id: "r1", from: "", to: "", size: "" };

function AddPlotsDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  existingPlotNumbers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ranges: PlotRange[]) => void;
  isSubmitting?: boolean;
  existingPlotNumbers: ReadonlySet<number>;
}) {
  const [ranges, setRanges] = useState<DraftRange[]>([EMPTY_RANGE]);

  const addRange = () =>
    setRanges((prev) => [...prev, { id: `r${Date.now()}`, from: "", to: "", size: "" }]);

  const removeRange = (id: string) =>
    setRanges((prev) => (prev.length > 1 ? prev.filter((range) => range.id !== id) : prev));

  const updateRange = (id: string, patch: Partial<DraftRange>) =>
    setRanges((prev) => prev.map((range) => (range.id === id ? { ...range, ...patch } : range)));

  const { parsed, preview, error } = useMemo(() => {
    const complete = ranges.filter((range) => range.from && range.to && range.size);
    if (complete.length !== ranges.length) {
      return { parsed: null, preview: null, error: null };
    }

    const asNumbers: PlotRange[] = complete.map((range) => ({
      from: Number(range.from),
      to: Number(range.to),
      size: Number(range.size),
    }));

    const expansion = expandPlotRanges(asNumbers, existingPlotNumbers);
    if (!expansion.ok) return { parsed: null, preview: null, error: expansion.error };

    return {
      parsed: asNumbers,
      preview: { count: expansion.plots.length, totalSqm: expansion.totalSqm },
      error: null,
    };
  }, [ranges, existingPlotNumbers]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (parsed) onSubmit(parsed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRanges([EMPTY_RANGE]);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add plots</DialogTitle>
          <DialogDescription>
            Each range creates plots numbered from–to, all at the same size.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {ranges.map((range, index) => (
            <div key={range.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <div className="space-y-1">
                {index === 0 && <Label className="text-xs">From</Label>}
                <Input
                  type="number"
                  min={1}
                  value={range.from}
                  onChange={(event) => updateRange(range.id, { from: event.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                {index === 0 && <Label className="text-xs">To</Label>}
                <Input
                  type="number"
                  min={1}
                  value={range.to}
                  onChange={(event) => updateRange(range.id, { to: event.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                {index === 0 && <Label className="text-xs">Size (sqm)</Label>}
                <Input
                  type="number"
                  min={1}
                  value={range.size}
                  onChange={(event) => updateRange(range.id, { size: event.target.value })}
                  placeholder="500"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => removeRange(range.id)}
                disabled={ranges.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRange}
            className="h-8 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add another range
          </Button>

          {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
          {preview ? (
            <div className="flex justify-between rounded-md bg-muted/40 p-2 text-xs">
              <span className="text-muted-foreground">Will create:</span>
              <span className="font-semibold tabular-nums">
                {preview.count} plots · {preview.totalSqm.toLocaleString()} sqm total
              </span>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!parsed || isSubmitting}>
              {isSubmitting ? "Creating…" : `Create ${preview?.count ?? ""} plots`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPlotDialog({
  plot,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  plot: Plot | null;
  onClose: () => void;
  onSubmit: (plot: Plot, changes: { plot_number?: number; size?: number }) => void;
  isSubmitting?: boolean;
}) {
  const [size, setSize] = useState("");
  const [plotNumber, setPlotNumber] = useState("");

  if (!plot) return null;

  const nextSize = size === "" ? plot.size : Number(size);
  const nextNumber = plotNumber === "" ? plot.plot_number : Number(plotNumber);
  const valid =
    Number.isInteger(nextSize) && nextSize > 0 && Number.isInteger(nextNumber) && nextNumber > 0;
  const changed = nextSize !== plot.size || nextNumber !== plot.plot_number;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || !changed) return;
    onSubmit(plot, {
      ...(nextSize !== plot.size ? { size: nextSize } : {}),
      ...(nextNumber !== plot.plot_number ? { plot_number: nextNumber } : {}),
    });
  };

  return (
    <Dialog
      open={!!plot}
      onOpenChange={(open) => {
        if (!open) {
          setSize("");
          setPlotNumber("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit plot {plotName(plot)}</DialogTitle>
          <DialogDescription>
            Currently {plot.size} sqm. Renumbering is allowed while the plot is
            unallocated, as long as the new number is free in this block.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plot-size">Size (sqm)</Label>
            <Input
              id="plot-size"
              type="number"
              min={1}
              defaultValue={plot.size}
              onChange={(event) => setSize(event.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plot-number">Plot number</Label>
            <Input
              id="plot-number"
              type="number"
              min={1}
              defaultValue={plot.plot_number}
              onChange={(event) => setPlotNumber(event.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || !changed || isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
