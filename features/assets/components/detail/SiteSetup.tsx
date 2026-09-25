"use client";

import { useState } from "react";
import { History, Pencil, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useSiteSetup } from "../../hooks/use-site-setup";
import { FENCING_SIDE_LABELS, type FencingSideRow } from "../../schemas/site-setup.schema";
import { BoundaryHistorySheet } from "./BoundaryHistorySheet";
import { EditBoundaryDialog } from "./EditBoundaryDialog";

function metres(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} m`;
}

function percent(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1)}%`;
}

function FencingRow({ row }: { row: FencingSideRow }) {
  const pct = row.percent_complete;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{FENCING_SIDE_LABELS[row.side]}</span>
        <span className="text-xs text-muted-foreground">
          {metres(row.fenced_metres)} of {metres(row.approved_metres)}
          {row.over_by_metres ? ` · ${metres(row.over_by_metres)} over` : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", pct !== null && pct >= 100 ? "bg-emerald-500" : "bg-sky-500")}
          style={{ width: `${pct === null ? 0 : Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-right text-[11px] text-muted-foreground">{percent(pct)} complete</p>
    </div>
  );
}

/**
 * Boundary + fencing progress — confirmed real against `abode-be-v2`
 * staging's field-staff module (`AssetSiteSetupController`), not a mock.
 * Fencing/clearing/parcelation figures are computed server-side from
 * verified field-crew submissions; the only admin action here is approving
 * the boundary itself.
 *
 * "Roads and services" (non-saleable land) is a DIFFERENT real feature —
 * see the Land Account card on Overview — not part of Site Setup.
 * Reviewing individual field-crew submissions is a separate, larger admin
 * workflow not built here (a scope decision, not an oversight).
 */
export function SiteSetup({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_field_performance");
  const canManage = permissions.has("manage_asset_boundary");
  const { data, isLoading, error } = useSiteSetup(assetId, { enabled: canView });
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!canView) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="font-medium">You do not have permission to view site setup.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          An admin can grant the view_field_performance permission.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-500/5 p-6 text-center text-sm text-rose-600">
        Couldn&apos;t load site setup: {error.message}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div>
            <h2 className="font-medium">Approved boundary</h2>
            <p className="text-xs text-muted-foreground">
              What fencing progress is measured against.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="mr-1.5 h-3.5 w-3.5" />
              View history
            </Button>
            {canManage ? (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {data.boundary ? "Edit boundary" : "Set boundary"}
              </Button>
            ) : null}
          </div>
        </div>

        {data.boundary ? (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Front</p>
                <p className="text-lg font-bold tabular-nums">{metres(data.boundary.sides.front)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Right</p>
                <p className="text-lg font-bold tabular-nums">{metres(data.boundary.sides.right)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Back</p>
                <p className="text-lg font-bold tabular-nums">{metres(data.boundary.sides.back)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Left</p>
                <p className="text-lg font-bold tabular-nums">{metres(data.boundary.sides.left)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-sm">
              <span className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                Perimeter <span className="font-semibold tabular-nums">{metres(data.boundary.perimeter_metres)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                Version {data.boundary.version} · source{" "}
                {data.boundary.source === "admin" ? "admin-entered" : "surveyor submission"}
                {data.boundary.approved_at
                  ? ` · approved ${new Date(data.boundary.approved_at).toLocaleDateString()}`
                  : ""}
              </span>
            </div>
            {data.boundary.note ? (
              <p className="mt-2 text-xs text-muted-foreground">{data.boundary.note}</p>
            ) : null}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No boundary has been approved yet — fencing progress can&apos;t be measured until one is set.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div>
            <h2 className="font-medium">Fencing progress</h2>
            <p className="text-xs text-muted-foreground">Verified from field-crew submissions.</p>
          </div>
          {data.fencing.approved_perimeter_metres ? (
            <Badge variant="outline">{percent(data.fencing.percent_complete)} of perimeter fenced</Badge>
          ) : null}
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {data.fencing.sides.map((row) => (
            <FencingRow key={row.side} row={row} />
          ))}
        </div>
      </section>

      <EditBoundaryDialog assetId={assetId} current={data.boundary} open={editOpen} onOpenChange={setEditOpen} />
      <BoundaryHistorySheet assetId={assetId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
