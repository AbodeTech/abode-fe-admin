"use client";

import { useState } from "react";
import { FileText, ImageIcon } from "lucide-react";

import { ViewTransactionEvidence } from "@/components/shared/ViewTransactionEvidence";

import type { SubmissionEvidence, SubmissionReceipt } from "../schemas/submission.schema";
import { formatNaira } from "../lib/format";

const isPdf = (url: string) => url.toLowerCase().split("?")[0].endsWith(".pdf");

/** The last path segment, without the query string — what the uploader named the file (or the CDN did). */
const fileNameOf = (url: string) => {
  const name = url.split("?")[0].split("/").pop() || "file";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

const KIND_LABELS: Record<string, string> = {
  photo: "Photo",
  document: "Document",
  sketch: "Sketch",
  receipt: "Receipt",
};

/**
 * A caption when the worker wrote one; otherwise the kind, numbered within its
 * kind ("Photo 2 of 5") so uncaptioned files don't all read the same to a
 * screen reader.
 */
function labelFor(item: SubmissionEvidence, position: number, ofKind: number) {
  if (item.caption) return item.caption;
  const kind = KIND_LABELS[item.kind] ?? "Evidence";
  return ofKind > 1 ? `${kind} ${position} of ${ofKind}` : kind;
}

/** A thumbnail that degrades to a labelled tile when the file can't load or isn't an image. */
function Thumb({ item, label }: { item: SubmissionEvidence; label: string }) {
  const [failed, setFailed] = useState(false);
  const fileName = fileNameOf(item.url);
  const imageLike = !isPdf(item.url) && item.kind !== "document";

  return (
    <div className="min-w-0">
      <ViewTransactionEvidence
        image={item.url}
        title={label}
        fileName={fileName}
        trigger={
          <button
            type="button"
            className="group relative block aspect-4/3 w-full overflow-hidden rounded-lg border bg-muted text-left focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Open ${label}, ${fileName}`}
          >
            {imageLike && !failed ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote evidence of unknown size
              <img src={item.url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
            ) : (
              <span className="grid h-full w-full place-items-center text-muted-foreground">
                {imageLike ? <ImageIcon className="h-6 w-6" aria-hidden /> : <FileText className="h-6 w-6" aria-hidden />}
              </span>
            )}
            <span
              className="absolute inset-x-1.5 bottom-1.5 truncate rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-foreground"
              aria-hidden
            >
              {label}
            </span>
          </button>
        }
      />
      <p className="mt-1 truncate text-[11px] text-muted-foreground" title={fileName} aria-hidden>
        {fileName}
      </p>
    </div>
  );
}

/**
 * Photos, sketches and documents in a grid, then the receipts. Each opens full
 * size. Pass receipts through `receiptsOf()` so legacy ones are included.
 */
export function EvidenceGallery({ evidence, receipts }: { evidence: SubmissionEvidence[]; receipts: SubmissionReceipt[] }) {
  const items = evidence.filter((e) => e.kind !== "receipt");

  if (items.length === 0 && receipts.length === 0) {
    return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No evidence attached.</p>;
  }

  const kindTotals = new Map<string, number>();
  for (const item of items) kindTotals.set(item.kind, (kindTotals.get(item.kind) ?? 0) + 1);
  const kindSeen = new Map<string, number>();

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Evidence">
          {items.map((item, i) => {
            const position = (kindSeen.get(item.kind) ?? 0) + 1;
            kindSeen.set(item.kind, position);
            return (
              <li key={`${item.url}-${i}`} className="min-w-0">
                <Thumb item={item} label={labelFor(item, position, kindTotals.get(item.kind) ?? 1)} />
              </li>
            );
          })}
        </ul>
      )}
      {receipts.length > 0 && (
        <ul className="space-y-2" aria-label="Receipts">
          {receipts.map((receipt, i) => {
            const numbered = receipts.length > 1 ? `Receipt ${i + 1} of ${receipts.length}` : "Receipt";
            const label = receipt.caption ? `${numbered}: ${receipt.caption}` : numbered;
            const fileName = fileNameOf(receipt.url);
            const details = [
              receipt.reference && `Ref ${receipt.reference}`,
              receipt.amount !== null && formatNaira(receipt.amount),
            ].filter(Boolean);
            return (
              <li key={receipt.url}>
                <ViewTransactionEvidence
                  image={receipt.url}
                  title={label}
                  fileName={fileName}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/50"
                      aria-label={`Open ${label}, ${[fileName, ...details].join(", ")}`}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1" aria-hidden>
                        <span className="block truncate font-medium">{label}</span>
                        <span className="block truncate text-xs text-muted-foreground" title={fileName}>
                          {[fileName, receipt.reference && `Ref ${receipt.reference}`].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {receipt.amount !== null && (
                        <span className="shrink-0 font-medium tabular-nums" aria-hidden>
                          {formatNaira(receipt.amount)}
                        </span>
                      )}
                    </button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
