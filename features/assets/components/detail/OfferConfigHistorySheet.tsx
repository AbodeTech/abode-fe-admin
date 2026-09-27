"use client";

import { useState } from "react";

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

import { OFFER_CONFIG_ACTION_LABELS } from "../../schemas/offer-config-history.schema";
import { useOfferConfigHistory } from "../../hooks/use-offer-config-history";

/* ============================================================
 * "Preserve offer configuration history" — a flat activity log, not a
 * diffable version list like LandConfigurationHistory/SellingChargesHistorySheet.
 * The six real offer/size/plan endpoints carry no admin-authored reason and
 * no before/after snapshot to diff, so each entry is just a server-derived
 * summary of what happened, who, and when.
 * ============================================================ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferConfigHistorySheet({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading } = useOfferConfigHistory(assetId, { enabled: open });
  const [expanded, setExpanded] = useState(false);

  const revisions = data?.items ?? [];
  const visible = expanded ? revisions : revisions.slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
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
          ) : revisions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No changes have been made yet.</p>
          ) : (
            <ul>
              {visible.map((revision) => (
                <li key={revision.version} className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b px-4 py-3 last:border-b-0 sm:px-6">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                    {OFFER_CONFIG_ACTION_LABELS[revision.action]}
                  </Badge>
                  <span className="min-w-0 flex-1 text-sm">{revision.summary}</span>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
