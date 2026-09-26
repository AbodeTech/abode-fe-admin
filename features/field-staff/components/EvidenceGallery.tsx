"use client";

import { useState } from "react";
import { FileText, ImageIcon } from "lucide-react";

import { ViewTransactionEvidence } from "@/components/shared/ViewTransactionEvidence";

import type { SubmissionEvidence } from "../schemas/submission.schema";

const isPdf = (url: string) => url.toLowerCase().split("?")[0].endsWith(".pdf");

const KIND_LABELS: Record<string, string> = {
  photo: "Photo",
  document: "Document",
  sketch: "Sketch",
  receipt: "Receipt",
};

/** A thumbnail that degrades to a labelled tile when the file can't load or isn't an image. */
function Thumb({ item }: { item: SubmissionEvidence }) {
  const [failed, setFailed] = useState(false);
  const label = item.caption || KIND_LABELS[item.kind] || "Evidence";
  const imageLike = !isPdf(item.url) && item.kind !== "document";

  return (
    <ViewTransactionEvidence
      image={item.url}
      trigger={
        <button
          type="button"
          className="group relative block aspect-4/3 w-full overflow-hidden rounded-lg border bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`Open ${label}`}
        >
          {imageLike && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote evidence of unknown size
            <img src={item.url} alt={label} className="h-full w-full object-cover" onError={() => setFailed(true)} />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground">
              {imageLike ? <ImageIcon className="h-6 w-6" aria-hidden /> : <FileText className="h-6 w-6" aria-hidden />}
            </span>
          )}
          <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
            {label}
          </span>
        </button>
      }
    />
  );
}

/** Photos, sketches and documents in a grid, then the receipt on its own. Each opens full size. */
export function EvidenceGallery({ evidence, receiptUrl }: { evidence: SubmissionEvidence[]; receiptUrl: string | null }) {
  const items = evidence.filter((e) => e.kind !== "receipt");
  const receipts = [
    ...evidence.filter((e) => e.kind === "receipt").map((e) => e.url),
    ...(receiptUrl ? [receiptUrl] : []),
  ];

  if (items.length === 0 && receipts.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No evidence attached.</p>;
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, i) => (
            <Thumb key={`${item.url}-${i}`} item={item} />
          ))}
        </div>
      )}
      {[...new Set(receipts)].map((url) => (
        <ViewTransactionEvidence
          key={url}
          image={url}
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="font-medium">Receipt</span>
              <span className="truncate text-muted-foreground">{url.split("/").pop()?.split("?")[0]}</span>
            </button>
          }
        />
      ))}
    </div>
  );
}
