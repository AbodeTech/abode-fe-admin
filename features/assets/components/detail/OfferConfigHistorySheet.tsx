"use client";

import { useState } from "react";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { OFFER_CONFIG_ACTION_LABELS, type OfferConfigRevision } from "../../schemas/offer-config-history.schema";
import { useOfferConfigHistory } from "../../hooks/use-offer-config-history";

/* ============================================================
 * "Preserve offer configuration history" — a flat activity log, not a
 * diffable version list like LandConfigurationHistory/SellingChargesHistorySheet.
 * The six real offer/size/plan endpoints carry no admin-authored reason and
 * no before/after snapshot to diff, so each entry is just a server-derived
 * summary of what happened, who, and when.
 * ============================================================ */

/**
 * “3 purchases so far” on the live version, “11 purchases · now superseded” on an
 * older one — and, when any, the transfers still awaiting approval, which keep
 * their saved terms too. Only pricing entries carry these counts.
 */
function pricingNote(revision: OfferConfigRevision): string | null {
  if (revision.purchase_count === undefined) return null;
  const count = revision.purchase_count;
  const purchases = `${count} ${count === 1 ? "purchase" : "purchases"}`;
  const base = revision.superseded ? `${purchases} · now superseded` : `${purchases} so far`;
  const pending = revision.pending_transfer_count ?? 0;
  return pending > 0 ? `${base} · ${pending} awaiting approval` : base;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferConfigHistorySheet({ assetId, open, onOpenChange }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useOfferConfigHistory(assetId, { enabled: open, page });
  const [expanded, setExpanded] = useState(false);

  const revisions = data?.items ?? [];
  const visible = expanded ? revisions : revisions.slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Offer configuration history</SheetTitle>
          <SheetDescription>Every offer, size and plan change made on this estate.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <p className="p-6 text-sm text-destructive">Could not load offer history. Close and reopen this panel to try again.</p>
          ) : revisions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No changes have been made yet.</p>
          ) : (
            <ul>
              {visible.map((revision) => (
                <li key={revision.version} className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b px-4 py-3 last:border-b-0 sm:px-6">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                    {OFFER_CONFIG_ACTION_LABELS[revision.action]}
                  </Badge>
                  <span className="min-w-0 flex-1 text-sm">
                    {revision.summary}
                    {pricingNote(revision) ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">{pricingNote(revision)}</span>
                    ) : null}
                  </span>
                  <span className="w-full text-xs text-muted-foreground sm:w-auto">
                    {revision.changed_by ?? "—"} · {formatDate(revision.changed_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {revisions.length > 10 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className={cn("w-full border-t px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/40")}
            >
              {expanded ? "Show fewer" : `Show all ${revisions.length} changes`}
            </button>
          ) : null}

          {revisions.some((revision) => revision.pricing_version !== undefined) ? (
            <div className="m-4 flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-[13px] text-blue-900 sm:mx-6">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <div>
                <b>Publishing a new pricing version doesn&apos;t touch earlier purchases.</b> Buyers under earlier versions — including transfers
                awaiting approval — keep their saved terms. Only new quotes use the live version.
              </div>
          {(data?.meta.totalPages ?? 0) > 1 ? (
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => { setPage((value) => value - 1); setExpanded(false); }} className="disabled:opacity-40">Previous</button>
              <span>Page {page} of {data?.meta.totalPages}</span>
              <button type="button" disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => { setPage((value) => value + 1); setExpanded(false); }} className="disabled:opacity-40">Next</button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
