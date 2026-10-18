"use client";

import { useState } from "react";
import { History, Pencil, Ruler } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useSiteSetup } from "../../hooks/use-site-setup";
import { FENCING_SIDE_LABELS, type FencingSideRow, type SiteSetup as SiteSetupData } from "../../schemas/site-setup.schema";
import { BoundaryHistorySheet } from "./BoundaryHistorySheet";
import { DetailPanel } from "./DetailPanel";
import { EditBoundaryDialog } from "./EditBoundaryDialog";
import { FieldCostsPanel, FieldTeamPanel, GroundAllocationPanel } from "./FieldSitePanels";
import { FieldSubmissionsPanel } from "./FieldSubmissionsPanel";

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
      <p className="flex justify-between text-[11px] text-muted-foreground">
        <span>
          {row.remaining_metres === null ? "No approved length to measure against" : `${metres(row.remaining_metres)} still to fence`}
          {row.repaired_metres > 0 ? ` · ${metres(row.repaired_metres)} repaired` : ""}
        </span>
        <span>{percent(pct)} complete</span>
      </p>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="px-4 py-3.5">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className="text-base font-semibold tabular-nums">{value}</strong>
      <small className="mt-1 block text-[10px] text-muted-foreground">{note}</small>
    </div>
  );
}

/** Where the site stands, from verified field work. Every figure is the backend's own. */
function ProgressStrip({ data }: { data: SiteSetupData }) {
  const { fencing, clearing, parcelation } = data;
  return (
    <div className="grid grid-cols-1 divide-y overflow-hidden rounded-lg border bg-muted/40 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      <Metric
        label="Fenced"
        value={metres(fencing.total_fenced_metres)}
        note={
          fencing.approved_perimeter_metres === null
            ? "No approved boundary to measure against"
            : `${percent(fencing.percent_complete)} of the ${metres(fencing.approved_perimeter_metres)} perimeter`
        }
      />
      <Metric
        label="Boundary established"
        value={metres(data.boundary_established_metres)}
        note="Marked out on the ground by surveyors"
      />
      <Metric
        label="Land cleared"
        value={`${clearing.cleared_sqm.toLocaleString()} sqm`}
        note={
          clearing.percent_of_estate === null
            ? "The estate has no total land size to compare with"
            : `${percent(clearing.percent_of_estate)} of the estate`
        }
      />
      <Metric
        label="Plots parcelled"
        value={parcelation.plots_parcelled.toLocaleString()}
        note={
          parcelation.plots_re_pegged > 0
            ? `${parcelation.plots_re_pegged} re-pegged · ${parcelation.distinct_plots_worked} distinct plots worked`
            : `${parcelation.distinct_plots_worked} distinct plots worked`
        }
      />
    </div>
  );
}

/**
 * Site Setup — the physical state of the estate and the field work behind it.
 * Not a tab in the asset-detail design; it sits last in the navigation.
 *
 *   approved boundary → progress (fencing, boundary, clearing, parcelation) →
 *   fencing by side → field work review → field team → allocation events on
 *   the ground → cost of field work
 *
 * Everything is read from `abode-be-v2`'s field-staff module. The progress
 * figures are worked out server-side from verified field work; the admin
 * actions here are approving the boundary, reviewing submissions and naming
 * who is accountable for an allocation event.
 *
 * Not here: inviting field workers, assigning them to sites and setting
 * their monthly targets. Those belong to the field staff accounts
 * (`/admin/field-staff`, `/admin/field-scorecards`), which span every estate.
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
    <div className="space-y-4">
      <DetailPanel
        title="Approved boundary"
        description="What fencing progress is measured against."
        action={
          <>
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
          </>
        }
      >
        {data.boundary ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(["front", "right", "back", "left"] as const).map((side) => (
                <div key={side}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {FENCING_SIDE_LABELS[side]}
                  </p>
                  <p className="text-lg font-bold tabular-nums">{metres(data.boundary!.sides[side])}</p>
                </div>
              ))}
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
            {data.boundary.note ? <p className="mt-2 text-xs text-muted-foreground">{data.boundary.note}</p> : null}
          </>
        ) : (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No boundary has been approved yet — fencing progress can&apos;t be measured until one is set.
          </p>
        )}
      </DetailPanel>

      <ProgressStrip data={data} />

      <DetailPanel
        title="Fencing progress"
        description="Verified from field-crew submissions."
        action={
          data.fencing.approved_perimeter_metres ? (
            <Badge variant="outline">{percent(data.fencing.percent_complete)} of perimeter fenced</Badge>
          ) : null
        }
      >
        <div className="space-y-4">
          {data.fencing.sides.map((row) => (
            <FencingRow key={row.side} row={row} />
          ))}
        </div>
      </DetailPanel>

      <FieldSubmissionsPanel assetId={assetId} />
      <FieldTeamPanel assetId={assetId} />
      <GroundAllocationPanel assetId={assetId} />
      <FieldCostsPanel assetId={assetId} />

      <EditBoundaryDialog assetId={assetId} current={data.boundary} open={editOpen} onOpenChange={setEditOpen} />
      <BoundaryHistorySheet assetId={assetId} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
