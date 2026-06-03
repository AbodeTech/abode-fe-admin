"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  AlertTriangle,
  Loader2,
  Boxes,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useAssetBlocks,
  useAssetIdByName,
  useCreateBlock,
  useDeleteBlock,
  useBlockPlots,
  useCreatePlots,
  useUpdatePlotSize,
  type Block,
  type Plot,
  type PlotRangeInput,
} from "@/features/assets";

interface BlocksManagerProps {
  assetName: string;
  assetType: string;
}

export function BlocksManager({ assetName, assetType }: BlocksManagerProps) {
  const decodedAssetName = decodeURIComponent(assetName);

  const { data: assetId, isLoading: isResolvingAssetId } = useAssetIdByName(
    assetName,
    assetType
  );
  const {
    data: blocks = [],
    isLoading: isLoadingBlocks,
    isError,
  } = useAssetBlocks(assetId ?? "");

  const createBlock = useCreateBlock(assetId ?? "");
  const deleteBlock = useDeleteBlock(assetId ?? "");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [managingBlock, setManagingBlock] = useState<Block | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<Block | null>(null);

  const handleCreateBlock = (label: string, description: string) => {
    if (!assetId) {
      toast.error("Asset not yet resolved — try again in a moment");
      return;
    }
    const trimmed = label.trim().toUpperCase();
    if (blocks.some((b) => b.label.toUpperCase() === trimmed)) {
      toast.error(`Block "${trimmed}" already exists`);
      return;
    }
    createBlock.mutate(
      { assetId, label: trimmed, description: description.trim() || undefined },
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

  const isLoading = isLoadingBlocks || isResolvingAssetId;

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Boxes className="h-5 w-5 text-muted-foreground" />
            Block Inventory
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Manage blocks and their plots for {decodedAssetName}.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          disabled={!assetId || isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Block
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Loader2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading block inventory…
            </p>
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 py-8 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-rose-500" />
            <p className="text-sm text-rose-700">Could not load blocks.</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No blocks seeded yet.
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => setIsCreateOpen(true)}
              disabled={!assetId}
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
              This will permanently remove block {deletingBlock?.label}. The
              backend will reject this if any plots are still attached.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBlock.isPending}>
              Cancel
            </AlertDialogCancel>
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

interface BlockCardProps {
  block: Block;
  onManage: () => void;
  onDelete: () => void;
}

function BlockCard({ block, onManage, onDelete }: BlockCardProps) {
  const { data: plots = [], isLoading } = useBlockPlots({ blockId: block._id });

  const stats = useMemo(() => {
    const total = plots.length;
    const allocated = plots.filter((p) => p.status === "allocated").length;
    const totalSqm = plots.reduce((s, p) => s + p.size, 0);
    return { total, allocated, available: total - allocated, totalSqm };
  }, [plots]);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
            {block.label}
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-none truncate">
              Block {block.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {block.description || "No description"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/40 py-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Plots
          </p>
          <p className="text-sm font-bold tabular-nums">
            {isLoading ? "…" : stats.total}
          </p>
        </div>
        <div className="rounded-md bg-emerald-50 py-1.5">
          <p className="text-[10px] text-emerald-700 uppercase tracking-wider">
            Free
          </p>
          <p className="text-sm font-bold tabular-nums text-emerald-700">
            {isLoading ? "…" : stats.available}
          </p>
        </div>
        <div className="rounded-md bg-amber-50 py-1.5">
          <p className="text-[10px] text-amber-700 uppercase tracking-wider">
            Allocated
          </p>
          <p className="text-sm font-bold tabular-nums text-amber-700">
            {isLoading ? "…" : stats.allocated}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Total: <span className="font-semibold tabular-nums">{stats.totalSqm.toLocaleString()}</span> sqm
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={onManage}
        >
          <Pencil className="h-3 w-3 mr-1" />
          Manage plots
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={onDelete}
          disabled={stats.total > 0}
          title={stats.total > 0 ? "Cannot delete — has plots" : "Delete block"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface CreateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (label: string, description: string) => void;
  isSubmitting?: boolean;
}

function CreateBlockDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateBlockDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const label = String(formData.get("label") || "").trim();
    const description = String(formData.get("description") || "");
    if (!label) {
      toast.error("Block label is required");
      return;
    }
    onSubmit(label, description);
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
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          key={open ? "open" : "closed"}
        >
          <div className="space-y-2">
            <Label htmlFor="label">Block label</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., A, B, C"
              maxLength={5}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Short identifier. Will be uppercased and must be unique per asset.
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
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

interface ManageBlockPlotsDialogProps {
  block: Block | null;
  onClose: () => void;
}

function ManageBlockPlotsDialog({ block, onClose }: ManageBlockPlotsDialogProps) {
  const blockId = block?._id ?? "";
  const { data: plots = [], isLoading } = useBlockPlots({
    blockId,
    enabled: !!blockId,
  });
  const createPlots = useCreatePlots(blockId);
  const updatePlotSize = useUpdatePlotSize(blockId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);

  if (!block) return null;

  const totalSqm = plots.reduce((s, p) => s + p.size, 0);

  const handleCreatePlots = (ranges: PlotRangeInput[]) => {
    createPlots.mutate(
      { blockId: block._id, ranges },
      {
        onSuccess: (data) => {
          const count = data.createPlots?.length ?? 0;
          toast.success(`Created ${count} plot${count === 1 ? "" : "s"}`);
          setIsAddOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  const handleUpdatePlotSize = (plot: Plot, size: number, override: boolean) => {
    updatePlotSize.mutate(
      { plotId: plot._id, size, override: override || undefined },
      {
        onSuccess: () => {
          toast.success(`Plot ${plot.block_label}-${plot.plot_number} updated`);
          setEditingPlot(null);
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  return (
    <Dialog open={!!block} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Block {block.label}</span>
            <Badge variant="secondary" className="text-xs">
              {plots.length} plots · {totalSqm.toLocaleString()} sqm
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {block.description || "Add plots and edit their sizes."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Plot numbers must be unique within this block. Sizes are in sqm.
          </p>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add plots
          </Button>
        </div>

        <div className="rounded-md border max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
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
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plots.map((plot) => (
                  <TableRow key={plot._id}>
                    <TableCell className="font-semibold">
                      {plot.block_label}-{plot.plot_number}
                    </TableCell>
                    <TableCell className="tabular-nums">{plot.size}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          plot.status === "allocated"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        )}
                      >
                        {plot.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setEditingPlot(plot)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
          existingPlotNumbers={new Set(plots.map((p) => p.plot_number))}
        />

        <EditPlotSizeDialog
          plot={editingPlot}
          onClose={() => setEditingPlot(null)}
          onSubmit={handleUpdatePlotSize}
          isSubmitting={updatePlotSize.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface AddPlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ranges: PlotRangeInput[]) => void;
  isSubmitting?: boolean;
  existingPlotNumbers: Set<number>;
}

interface DraftRange {
  id: string;
  from: string;
  to: string;
  size: string;
}

function AddPlotsDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  existingPlotNumbers,
}: AddPlotsDialogProps) {
  const [ranges, setRanges] = useState<DraftRange[]>([
    { id: "r1", from: "", to: "", size: "" },
  ]);

  const addRange = () =>
    setRanges((prev) => [
      ...prev,
      { id: `r${Date.now()}`, from: "", to: "", size: "" },
    ]);

  const removeRange = (id: string) =>
    setRanges((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const updateRange = (id: string, patch: Partial<DraftRange>) =>
    setRanges((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const { parsed, error, totalCount, totalSqm } = useMemo(() => {
    const result: PlotRangeInput[] = [];
    const seen = new Set<number>();
    let totalCount = 0;
    let totalSqm = 0;
    for (const r of ranges) {
      const from = Number(r.from);
      const to = Number(r.to);
      const size = Number(r.size);
      if (!r.from || !r.to || !r.size) {
        return { parsed: [], error: null, totalCount: 0, totalSqm: 0 };
      }
      if (!Number.isInteger(from) || !Number.isInteger(to) || !Number.isInteger(size)) {
        return { parsed: [], error: "Values must be integers", totalCount: 0, totalSqm: 0 };
      }
      if (from < 1 || to < from) {
        return { parsed: [], error: `Invalid range ${from}–${to}`, totalCount: 0, totalSqm: 0 };
      }
      if (size <= 0) {
        return { parsed: [], error: "Size must be greater than 0", totalCount: 0, totalSqm: 0 };
      }
      for (let n = from; n <= to; n++) {
        if (existingPlotNumbers.has(n)) {
          return {
            parsed: [],
            error: `Plot ${n} already exists in this block`,
            totalCount: 0,
            totalSqm: 0,
          };
        }
        if (seen.has(n)) {
          return {
            parsed: [],
            error: `Plot ${n} appears in more than one range`,
            totalCount: 0,
            totalSqm: 0,
          };
        }
        seen.add(n);
      }
      const count = to - from + 1;
      totalCount += count;
      totalSqm += count * size;
      result.push({ from, to, size });
    }
    return { parsed: result, error: null, totalCount, totalSqm };
  }, [ranges, existingPlotNumbers]);

  const canSubmit = parsed.length > 0 && !error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(parsed);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setRanges([{ id: "r1", from: "", to: "", size: "" }]);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add plots</DialogTitle>
          <DialogDescription>
            Each range creates plots numbered from–to, all with the same size.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {ranges.map((r, idx) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs">From</Label>}
                <Input
                  type="number"
                  min={1}
                  value={r.from}
                  onChange={(e) => updateRange(r.id, { from: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs">To</Label>}
                <Input
                  type="number"
                  min={1}
                  value={r.to}
                  onChange={(e) => updateRange(r.id, { to: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                {idx === 0 && <Label className="text-xs">Size (sqm)</Label>}
                <Input
                  type="number"
                  min={1}
                  value={r.size}
                  onChange={(e) => updateRange(r.id, { size: e.target.value })}
                  placeholder="500"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => removeRange(r.id)}
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
            <Plus className="h-3 w-3 mr-1" />
            Add another range
          </Button>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}
          {canSubmit && (
            <div className="rounded-md bg-muted/40 p-2 text-xs flex justify-between">
              <span className="text-muted-foreground">Will create:</span>
              <span className="font-semibold tabular-nums">
                {totalCount} plots · {totalSqm.toLocaleString()} sqm total
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating…" : `Create ${totalCount || ""} plots`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditPlotSizeDialogProps {
  plot: Plot | null;
  onClose: () => void;
  onSubmit: (plot: Plot, size: number, override: boolean) => void;
  isSubmitting?: boolean;
}

function EditPlotSizeDialog({
  plot,
  onClose,
  onSubmit,
  isSubmitting,
}: EditPlotSizeDialogProps) {
  const [size, setSize] = useState("");
  const [override, setOverride] = useState(false);

  const isAllocated = plot?.status === "allocated";

  if (!plot) return null;

  const sizeValue = Number(size);
  const sizeValid = Number.isInteger(sizeValue) && sizeValue > 0;
  const overrideRequired = isAllocated;
  const canSubmit = sizeValid && (!overrideRequired || override);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(plot, sizeValue, override);
  };

  return (
    <Dialog
      open={!!plot}
      onOpenChange={(o) => {
        if (!o) {
          setSize("");
          setOverride(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit plot {plot.block_label}-{plot.plot_number}
          </DialogTitle>
          <DialogDescription>
            Current size: {plot.size} sqm.
          </DialogDescription>
        </DialogHeader>

        {isAllocated && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                This plot is currently allocated.
              </p>
              <p className="text-amber-800 mt-0.5">
                Resizing requires explicit override; it will be logged as a
                size_override audit entry.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="size">New size (sqm)</Label>
            <Input
              id="size"
              type="number"
              min={1}
              defaultValue={plot.size}
              onChange={(e) => setSize(e.target.value)}
              autoFocus
              required
            />
          </div>

          {overrideRequired && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Checkbox
                id="override"
                checked={override}
                onCheckedChange={(c) => setOverride(c === true)}
              />
              <Label htmlFor="override" className="text-xs cursor-pointer leading-tight">
                I understand this plot is allocated. Resize anyway and log the
                override.
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving…" : "Save size"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
