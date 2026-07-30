"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

import type { Asset } from "../../schemas/asset.schema";
import { useDeleteAsset } from "../../hooks/use-asset-list";

export function DeleteAssetDialog({
  asset,
  onOpenChange,
}: {
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteAsset = useDeleteAsset();

  if (!asset) return null;

  const handleDelete = () => {
    deleteAsset.mutate(asset._id, {
      onSuccess: () => {
        toast.success(`${asset.name} removed from the catalogue`);
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message || "Failed to delete asset"),
    });
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {asset.name} from the catalogue?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              {/*
                Soft delete — the BE sets `deleted_at` rather than destroying
                the record. Saying "permanently delete" would be untrue, and
                would make an admin hesitate over something recoverable.
              */}
              <p>
                This hides the asset from the catalogue. It isn&apos;t destroyed — it stays visible
                under &ldquo;Include deleted&rdquo;, and existing payment plans that reference it
                still resolve.
              </p>

              {asset.sold_units > 0 || asset.reserved_units > 0 ? (
                <p className="rounded-md border bg-muted/40 p-3">
                  This asset has{" "}
                  <strong>{asset.sold_units.toLocaleString()} sold</strong>
                  {asset.reserved_units > 0
                    ? ` and ${asset.reserved_units.toLocaleString()} reserved`
                    : ""}{" "}
                  units. Those customers keep their plans — removing the asset only takes it off
                  sale.
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAsset.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={deleteAsset.isPending}
          >
            {deleteAsset.isPending ? (
              <>
                Removing <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Remove from catalogue"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
