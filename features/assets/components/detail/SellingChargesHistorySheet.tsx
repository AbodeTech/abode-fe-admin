"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { useSellingChargesHistory } from "../../hooks/use-selling-charges";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Every approved version, each carrying its own full `charges[]` — the real
 * `GET .../selling-charges/history` returns the whole snapshot per version,
 * not a diff, so there's nothing to lazily expand like
 * `LandConfigurationHistory`'s per-version fetch.
 */
export function SellingChargesHistorySheet({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading } = useSellingChargesHistory(assetId, { enabled: open });
  const revisions = [...(data ?? [])].sort((a, b) => b.version - a.version);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Selling charges history</SheetTitle>
          <SheetDescription>Every approved version of this estate&apos;s selling charges.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : revisions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No versions have been approved yet.</p>
          ) : (
            <div className="divide-y">
              {revisions.map((revision) => (
                <div key={revision.version} className="space-y-2 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Version {revision.version}</span>
                      {revision.is_current ? (
                        <Badge variant="outline" className="text-emerald-600">
                          Current
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Effective {formatDate(revision.effective_date)}
                    </span>
                  </div>

                  <ul className="space-y-1 rounded-md bg-muted/30 p-2 text-xs">
                    {revision.charges.map((charge, index) => (
                      <li key={`${charge.charge_type}:${index}`} className="flex items-center justify-between gap-2">
                        <span>
                          {charge.label}
                          {charge.offer_type ? ` (${OFFER_TYPE_LABELS[charge.offer_type]})` : ""}
                        </span>
                        <span className="tabular-nums font-medium">{formatNaira(charge.amount)}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-muted-foreground">
                    {revision.reason} — approved by {revision.approved_by}
                    {revision.approved_at ? ` on ${formatDate(revision.approved_at)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
