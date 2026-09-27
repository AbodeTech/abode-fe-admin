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

import { useBoundaryHistory } from "../../hooks/use-site-setup";
import { FENCING_SIDE_LABELS } from "../../schemas/site-setup.schema";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function metres(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Preserve boundary measurement history" — `GET .../boundary` returns every
 * approved version, newest first, confirmed real against `abode-be-v2`
 * staging (see site-setup.schema.ts's header). This sheet is the one piece
 * SiteSetup.tsx was still missing: the card shows only the current version,
 * with nowhere to see what it superseded.
 */
export function BoundaryHistorySheet({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading } = useBoundaryHistory(assetId, { enabled: open });
  const versions = [...(data ?? [])].sort((a, b) => b.version - a.version);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Boundary history</SheetTitle>
          <SheetDescription>Every approved boundary this estate has had, newest first.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : versions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No boundary has ever been approved.</p>
          ) : (
            <div className="divide-y">
              {versions.map((version) => (
                <div key={version.version} className="space-y-2 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Version {version.version}</span>
                      {version.is_current ? (
                        <Badge variant="outline" className="text-emerald-600">
                          Current
                        </Badge>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {version.approved_at ? formatDate(version.approved_at) : "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-muted/30 p-2 text-xs sm:grid-cols-4">
                    {(["front", "right", "back", "left"] as const).map((side) => (
                      <div key={side} className="flex items-center justify-between gap-2 sm:block">
                        <span className="text-muted-foreground">{FENCING_SIDE_LABELS[side]}</span>
                        <span className="font-medium tabular-nums sm:block">{metres(version.sides[side])}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Perimeter <span className="font-medium tabular-nums">{metres(version.perimeter_metres)}</span> ·{" "}
                    {version.source === "admin" ? "admin-entered" : "surveyor submission"}
                  </p>

                  {version.note ? <p className="text-xs text-muted-foreground">{version.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
