"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAssetCommissionOverrides,
  useDeleteAssetCommissionOverride,
} from "../hooks/use-asset-commission-overrides";
import type { AssetCommissionOverride } from "../hooks/use-asset-commission-overrides";
import { EditAssetOverrideDialog } from "./EditAssetOverrideDialog";
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

const LIMIT = 10;

function countOverriddenFields(override: AssetCommissionOverride): number {
  let count = 0;
  const check = (obj: unknown) => {
    if (obj === null || obj === undefined) return;
    if (typeof obj === "object") {
      for (const val of Object.values(obj as Record<string, unknown>)) {
        if (val !== null && val !== undefined) {
          if (typeof val === "object") {
            check(val);
          } else if (typeof val === "number") {
            count++;
          }
        }
      }
    }
  };
  check(override.flexCommission);
  check(override.fullOwnershipCommission);
  check(override.flexRemoval);
  check(override.fullOwnershipRemoval);
  return count;
}

export function AssetOverrideList() {
  const [page, setPage] = useState(1);
  const [editOverride, setEditOverride] = useState<AssetCommissionOverride | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssetCommissionOverride | null>(null);

  const { data, isLoading, error } = useAssetCommissionOverrides(page, LIMIT);
  const deleteMutation = useDeleteAssetCommissionOverride();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.asset._id);
      toast.success(`Override removed for ${deleteTarget.asset.asset_name}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete override");
    }
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <p className="font-bold">Error loading overrides</p>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overrides = data?.overrides ?? [];
  const totalPages = data?.pagination?.pages ?? 1;
  const total = data?.pagination?.total ?? 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-muted-foreground">
          {total} asset{total !== 1 ? "s" : ""} with custom commission rates
        </p>
        <Button size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Override
        </Button>
      </div>

      {overrides.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No per-asset overrides configured yet.
        </p>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Asset Type</TableHead>
              <TableHead>Overridden Fields</TableHead>
              <TableHead className="w-[160px]">Last Modified</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.map((override) => (
              <TableRow key={override._id}>
                <TableCell className="font-medium">
                  {override.asset.asset_name}
                </TableCell>
                <TableCell className="text-sm capitalize">
                  {override.asset.asset_type}
                </TableCell>
                <TableCell className="text-sm">
                  {countOverriddenFields(override)} field{countOverriddenFields(override) !== 1 ? "s" : ""}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(override.updatedAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditOverride(override)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(override)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <EditAssetOverrideDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        override={null}
      />

      {/* Edit dialog */}
      {editOverride && (
        <EditAssetOverrideDialog
          open={!!editOverride}
          onOpenChange={(open) => { if (!open) setEditOverride(null); }}
          override={editOverride}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Override</AlertDialogTitle>
            <AlertDialogDescription>
              Remove the commission override for{" "}
              <strong>{deleteTarget?.asset.asset_name}</strong>? This asset will
              revert to global commission rates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
