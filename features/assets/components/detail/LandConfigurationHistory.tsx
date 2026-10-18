"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
import { formatSqm } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import {
  LAND_USE_CATEGORY_LABELS,
  type LandConfigurationHistoryEntry,
  type LandConfigurationSnapshot,
} from "../../schemas/land-configuration.schema";
import { useLandConfigurationHistory, useLandConfigurationRevision } from "../../hooks/use-land-configuration";

/* ============================================================
 * Land configuration history — a version list with expand-to-diff, modeled
 * on features/commission/components/rates/ConfigHistory.tsx. Unlike that
 * feature, the list itself is a lightweight summary row only (the real
 * backend doesn't return full before/after snapshots there) — expanding a
 * row fetches its full snapshot pair on demand via
 * `useLandConfigurationRevision`.
 * ============================================================ */

type Change = { label: string; from: string; to: string };

function diffLandConfiguration(
  before: LandConfigurationSnapshot | null,
  after: LandConfigurationSnapshot
): Change[] {
  const changes: Change[] = [];

  const beforeTotal = before?.total_land_sqm ?? null;
  if (beforeTotal !== after.total_land_sqm) {
    changes.push({
      label: "Total estate size",
      from: formatSqm(beforeTotal),
      to: formatSqm(after.total_land_sqm),
    });
  }

  const offerTypes = new Set<OfferType>([
    ...(before?.products ?? []).map((p) => p.offer_type),
    ...after.products.map((p) => p.offer_type),
  ]);
  for (const offerType of offerTypes) {
    const beforeSqm = before?.products.find((p) => p.offer_type === offerType)?.assigned_sqm;
    const afterSqm = after.products.find((p) => p.offer_type === offerType)?.assigned_sqm;
    if (beforeSqm !== afterSqm) {
      changes.push({
        label: `${OFFER_TYPE_LABELS[offerType]} assigned sqm`,
        from: beforeSqm === undefined ? "—" : formatSqm(beforeSqm),
        to: afterSqm === undefined ? "Removed" : formatSqm(afterSqm),
      });
    }
  }

  // `land_use_id` can be `null` for a row created in this very save (a
  // confirmed real backend quirk — see AssetLandUseSchema's doc comment);
  // `before` rows always already existed so always carry a real id, but
  // several brand-new `after` rows could all be null at once, which would
  // collapse them onto the same Map key and silently hide all but the last.
  // Falling back to the row's own index (unique per array) avoids that.
  const beforeRows = new Map((before?.non_saleable ?? []).map((row, index) => [row.land_use_id ?? `__new_${index}`, row]));
  const afterRows = new Map(after.non_saleable.map((row, index) => [row.land_use_id ?? `__new_${index}`, row]));
  const rowIds = new Set([...beforeRows.keys(), ...afterRows.keys()]);
  for (const id of rowIds) {
    const b = beforeRows.get(id);
    const a = afterRows.get(id);
    if (!b && a) {
      changes.push({
        label: `${LAND_USE_CATEGORY_LABELS[a.category]} · ${a.label}`,
        from: "—",
        to: `Added, ${formatSqm(a.allocated_sqm)}`,
      });
    } else if (b && !a) {
      changes.push({
        label: `${LAND_USE_CATEGORY_LABELS[b.category]} · ${b.label}`,
        from: formatSqm(b.allocated_sqm),
        to: "Removed",
      });
    } else if (b && a && (b.allocated_sqm !== a.allocated_sqm || b.is_active !== a.is_active || b.label !== a.label)) {
      changes.push({
        label: `${LAND_USE_CATEGORY_LABELS[a.category]} · ${a.label}`,
        from: `${formatSqm(b.allocated_sqm)}${b.is_active ? "" : " (inactive)"}`,
        to: `${formatSqm(a.allocated_sqm)}${a.is_active ? "" : " (inactive)"}`,
      });
    }
  }

  return changes;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function VersionRow({
  assetId,
  entry,
  isActive,
}: {
  assetId: string;
  entry: LandConfigurationHistoryEntry;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: revision, isLoading } = useLandConfigurationRevision(assetId, entry.version, { enabled: open });
  const changes = revision ? diffLandConfiguration(revision.before, revision.after) : [];

  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-muted/40"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}

        <span className="text-sm font-semibold tabular-nums">v{entry.version}</span>
        {isActive && <Badge variant="secondary">Active</Badge>}

        <span className="text-xs text-muted-foreground">{formatDate(entry.changed_at)}</span>
        <span className="text-xs text-muted-foreground">{entry.changed_by_email ?? entry.changed_by}</span>

        {entry.reason ? (
          <span className="min-w-0 basis-full text-sm text-muted-foreground sm:basis-auto sm:flex-1 sm:truncate">
            {entry.reason}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="space-y-1.5 border-t bg-muted/20 px-4 py-3 pl-11">
          {isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing differs from the previous version.</p>
          ) : (
            changes.map((change) => (
              <div key={change.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                <span className="min-w-0 flex-1 text-muted-foreground">{change.label}</span>
                <span className="tabular-nums line-through opacity-60">{change.from}</span>
                <span className="font-medium tabular-nums">{change.to}</span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </li>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LandConfigurationHistory({ assetId, open, onOpenChange }: Props) {
  const { data, isLoading } = useLandConfigurationHistory(assetId, { enabled: open });
  const [expanded, setExpanded] = useState(false);

  const revisions = data?.items ?? [];
  const visible = expanded ? revisions : revisions.slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Land account history</SheetTitle>
          <SheetDescription>Every saved version of this estate&apos;s land account.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : revisions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No changes have been saved yet.</p>
          ) : (
            <ul>
              {visible.map((entry, index) => (
                <VersionRow key={entry.version} assetId={assetId} entry={entry} isActive={index === 0} />
              ))}
            </ul>
          )}

          {revisions.length > 5 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className={cn("w-full border-t px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/40")}
            >
              {expanded ? "Show fewer" : `Show all ${revisions.length} versions`}
            </button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
