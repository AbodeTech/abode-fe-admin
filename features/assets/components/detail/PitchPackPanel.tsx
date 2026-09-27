"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

import type { AssetDetail } from "../../schemas/asset-detail.schema";
import { useAssetUpload } from "../../hooks/use-asset-upload";
import { useRemovePitchPack, useSetPitchPack } from "../../hooks/use-pitch-pack";
import { useAssetFormStore } from "../../store/asset-form-store";

/** Mirrors the backend's `MAX_PITCH_PACK_BYTES` (`pitch-pack.dto.ts`). */
const MAX_PITCH_PACK_BYTES = 100 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Upload-on-select and its own endpoint, like the media section's document
 * slots — but kept as a standalone panel rather than folded into
 * "Images and documents". That form saves every document slot in one PATCH;
 * a pitch pack swap shouldn't wait on, or risk clobbering, whatever else is
 * mid-edit there, so it gets its own PUT/DELETE pair and its own save.
 */
export function PitchPackPanel({ asset }: { asset: AssetDetail }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadFile } = useAssetUpload();
  const setPitchPack = useSetPitchPack(asset._id);
  const removePitchPack = useRemovePitchPack(asset._id);

  const pack = asset.pitch_pack;
  const busy = isUploading || setPitchPack.isPending || removePitchPack.isPending;

  const handleSelect = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setUploadError(null);

    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_PITCH_PACK_BYTES) {
      setUploadError(
        `"${file.name}" is too large — pitch packs are capped at ${formatBytes(MAX_PITCH_PACK_BYTES)}.`
      );
      return;
    }

    const uploadKey = `pitch-pack.${asset._id}`;
    setIsUploading(true);
    const uploaded = await uploadFile(uploadKey, file);
    setIsUploading(false);

    // Upload failure leaves the asset's current pitch pack untouched — only
    // the error line changes. `uploadFile` stores the Cloudinary error in the
    // form store rather than returning it, so read it back from there — a
    // direct `getState()` read, since the value just landed this tick and a
    // stale hook subscription from render time wouldn't have it yet.
    if (!uploaded) {
      const reason = useAssetFormStore.getState().uploads[uploadKey]?.error;
      setUploadError(
        reason
          ? `Uploading "${file.name}" failed — ${reason}. Choose the file again to retry.`
          : `Uploading "${file.name}" failed. Choose the file again to retry.`
      );
      return;
    }

    setPitchPack.mutate(
      { url: uploaded.url, size_bytes: uploaded.bytes },
      {
        onSuccess: () => toast.success("Pitch pack saved"),
        onError: (error) => setUploadError(error.message || "Couldn't save the pitch pack"),
      }
    );
  };

  const handleRemove = () => {
    removePitchPack.mutate(undefined, {
      onSuccess: () => {
        toast.success("Pitch pack removed");
        setConfirmingRemove(false);
      },
      onError: (error) => toast.error(error.message || "Couldn't remove the pitch pack"),
    });
  };

  return (
    <section className="rounded-lg border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-medium">Pitch pack</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One PDF realtors can download for this estate.
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {pack ? (
          <div className="flex flex-wrap items-center gap-2.5 rounded-md border bg-muted/30 p-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <a
                href={pack.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium underline underline-offset-4"
              >
                View pitch pack
              </a>
              <p className="text-xs text-muted-foreground">
                {formatBytes(pack.size_bytes)} · Uploaded{" "}
                {new Date(pack.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pitch pack uploaded yet.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {isUploading || setPitchPack.isPending ? (
              <>
                Uploading <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3.5 w-3.5" />
                {pack ? "Replace" : "Upload PDF"}
              </>
            )}
          </Button>

          {pack ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingRemove(true)}
              disabled={busy}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => handleSelect(event.target.files?.[0])}
          />
        </div>

        {uploadError ? (
          <p className="flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            {uploadError}
          </p>
        ) : null}
      </div>

      <AlertDialog open={confirmingRemove} onOpenChange={setConfirmingRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove the pitch pack?</AlertDialogTitle>
            <AlertDialogDescription>
              Realtors will no longer be able to download it. You can upload a new one at any
              time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removePitchPack.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRemove();
              }}
              disabled={removePitchPack.isPending}
            >
              {removePitchPack.isPending ? (
                <>
                  Removing <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
