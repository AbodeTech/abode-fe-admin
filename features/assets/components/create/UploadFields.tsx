"use client";

import { useRef } from "react";
import { AlertCircle, Check, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useAssetUpload } from "../../hooks/use-asset-upload";
import { useAssetFormStore } from "../../store/asset-form-store";

/* ============================================================
 * Upload-on-select.
 *
 * The backend takes URLs, so files upload the moment they're chosen rather
 * than at submit. A failed image is then visible beside its own field, and
 * retrying costs one click — instead of one bad file discarding a form with
 * four levels of nesting in it.
 * ============================================================ */

function StatusLine({ uploadKey }: { uploadKey: string }) {
  const entry = useAssetFormStore((state) => state.uploads[uploadKey]);
  if (!entry) return null;

  if (entry.status === "uploading") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Uploading {entry.name}…
      </p>
    );
  }

  if (entry.status === "error") {
    return (
      <p className="flex items-start gap-1.5 text-xs text-destructive">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span>
          {entry.name} failed — {entry.error}. Choose the file again to retry.
        </span>
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Check className="h-3 w-3 text-emerald-600" aria-hidden />
      {entry.name}
    </p>
  );
}

/** One file → one URL. Used for the hero image and each document slot. */
export function SingleUploadField({
  id,
  label,
  description,
  accept = "image/*",
  value,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  accept?: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload } = useAssetUpload();
  const clearUpload = useAssetFormStore((state) => state.clearUpload);

  const handleSelect = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(id, file);
    if (url) onChange(url);
  };

  const handleClear = () => {
    onChange(undefined);
    clearUpload(id);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-3.5 w-3.5" />
          {value ? "Replace" : "Choose file"}
        </Button>

        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <X className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleSelect(event.target.files?.[0])}
        />
      </div>

      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <StatusLine uploadKey={id} />
    </div>
  );
}

/** Many files → many URLs. Uploads run in parallel; one failure doesn't lose the rest. */
export function GalleryUploadField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadMany } = useAssetUpload();

  const uploads = useAssetFormStore((state) => state.uploads);
  const pending = Object.entries(uploads).filter(
    ([key, entry]) => key.startsWith(`${id}.`) && entry.status !== "done"
  );

  const handleSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls = await uploadMany(id, Array.from(files));
    if (urls.length > 0) onChange([...value, ...urls]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>

      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-3.5 w-3.5" />
        Add images
      </Button>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleSelect(event.target.files)}
      />

      {value.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {value.map((url, index) => (
            <li key={url} className="flex items-center gap-2 text-xs">
              <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{url}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pending.map(([key]) => (
        <StatusLine key={key} uploadKey={key} />
      ))}

      <p className={cn("text-xs text-muted-foreground", value.length === 0 && "hidden")}>
        {value.length} image{value.length === 1 ? "" : "s"} uploaded
      </p>
    </div>
  );
}
