"use client";

import { useRef, useState } from "react";
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
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useRemovePitchPack, useSetPitchPack } from "../../hooks/use-pitch-pack";
import type { AssetDetail } from "../../schemas/asset-detail.schema";

const megabytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const LINK = "text-xs font-medium underline underline-offset-4 hover:text-foreground disabled:opacity-50";

/**
 * The estate's pitch pack — the PDF realtors download from their app. It has
 * its own endpoints (PUT / DELETE .../pitch-pack) and is not part of the asset
 * PATCH, so it is uploaded, replaced and removed right here rather than
 * through the panel's Edit form.
 */
export function PitchPackField({ asset }: { asset: AssetDetail }) {
  const canManage = useAdminPermissions().has("manage_assets");
  const setPack = useSetPitchPack(asset._id);
  const removePack = useRemovePitchPack(asset._id);
  const input = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const pack = asset.pitch_pack ?? null;
  const busy = setPack.isPending || removePack.isPending;

  function upload(file: File | undefined) {
    if (!file) return;
    setPack.mutate(file, {
      onSuccess: () => toast.success(pack ? "Pitch pack replaced" : "Pitch pack added"),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">Pitch pack for realtors</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {pack ? (
          <>
            <a href={pack.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
              View PDF
            </a>
            <span className="text-xs text-muted-foreground">
              {megabytes(pack.size_bytes)} · uploaded{" "}
              {new Date(pack.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}

        {canManage ? (
          <>
            <button type="button" className={LINK} disabled={busy} onClick={() => input.current?.click()}>
              {setPack.isPending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  Uploading…
                </span>
              ) : pack ? (
                "Replace"
              ) : (
                "Upload PDF"
              )}
            </button>
            {pack ? (
              <button type="button" className={`${LINK} text-rose-600`} disabled={busy} onClick={() => setConfirmRemove(true)}>
                Remove
              </button>
            ) : null}
            <input
              ref={input}
              type="file"
              accept="application/pdf"
              className="hidden"
              aria-label="Pitch pack PDF"
              onChange={(event) => {
                upload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </>
        ) : null}
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove the pitch pack?</AlertDialogTitle>
            <AlertDialogDescription>
              Realtors will no longer be able to download a pitch pack for {asset.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePack.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={removePack.isPending}
              onClick={() =>
                removePack.mutate(undefined, {
                  onSuccess: () => toast.success("Pitch pack removed"),
                  onError: (error: Error) => toast.error(error.message),
                })
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
