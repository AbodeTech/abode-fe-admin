"use client";

import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, HelpCircle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isMockApiEnabled } from "@/lib/mocks/config";
import { cn } from "@/lib/utils";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { PLOT_STATUSES, PLOT_STATUS_LABELS, type PlotStatus } from "../../schemas/block-plot.schema";
import { useAssetBlocks } from "../../hooks/use-blocks";
import { usePlotInventory } from "../../hooks/use-plot-inventory";
import { GroundConfirmationBadge } from "./GroundConfirmationBadge";

const ALL_BLOCKS = "all-blocks";
const ALL_STATUSES = "all-statuses";

/**
 * The asset-wide, cross-block plot inventory — a read/filter/search surface,
 * distinct from BlocksManager's per-block management UI (create/edit/delete
 * blocks and plots). Rendered below BlocksManager on the same tab, not
 * folded into it — different job, same separation already used between
 * LandAccountCard (summary) and LandUseTable (detail).
 *
 * Confirmed real against `abode-be-v2` staging's field-staff module (see
 * plot-inventory.schema.ts's header) — a field-ops readiness view
 * (parcelation/clearing/allocation-readiness), not a customer/sales one.
 * There is no per-plot buyer name or attributable value in this response;
 * that commercial detail lives on the Performance tab instead.
 *
 * `GroundConfirmationBadge` is a DIFFERENT, still-unverified feature (its own
 * doc comment: "🚧 Provisional, fully greenfield") — shown only in mock mode
 * so real mode doesn't call a fictitious `/admin/plots/:plotId/ground-
 * confirmation` endpoint just because the list around it is now real.
 */
export function PlotInventoryPanel({ assetId }: { assetId: string }) {
  const [search, setSearch] = useState("");
  const [block, setBlock] = useState<string | null>(null);
  const [status, setStatus] = useState<PlotStatus | null>(null);
  const [page, setPage] = useState(1);

  const { data: blocks } = useAssetBlocks(assetId);

  const filters = { search: search.trim() || null, block, status, page, limit: 20 };
  const { data: result, isLoading, isFetching } = usePlotInventory(assetId, filters);
  const data = result?.data;
  const meta = result?.meta;

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <section className="rounded-xl border">
      <div className="border-b px-4 py-3 sm:px-6">
        <h2 className="flex items-center gap-1.5 font-medium">
          Plot inventory
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="How this differs from the Performance tab's figures">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Field-ops readiness — parcelation, clearing, and allocation-readiness recorded from
              verified site visits. This is a different count from the Performance tab, which is
              commercial (units sold/reserved), and carries no buyer names or sale values.
            </TooltipContent>
          </Tooltip>
        </h2>
        <p className="text-xs text-muted-foreground">Every plot on this estate, across every block.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 sm:px-6">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search plot (e.g. A-12)"
            className="pl-8"
            value={search}
            onChange={(e) => updateFilter(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          value={block ?? ALL_BLOCKS}
          onValueChange={(value) => updateFilter(() => setBlock(value === ALL_BLOCKS ? null : value))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BLOCKS}>All blocks</SelectItem>
            {/* Matched by label on the real backend, not id — a block has no other identifier there. */}
            {(blocks ?? []).map((b) => (
              <SelectItem key={b._id} value={b.label}>
                Block {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status ?? ALL_STATUSES}
          onValueChange={(value) => updateFilter(() => setStatus(value === ALL_STATUSES ? null : (value as PlotStatus)))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {PLOT_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {PLOT_STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <div className="space-y-2 p-4 sm:p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : data.plots.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No plots match these filters.
        </div>
      ) : (
        <div className={cn("divide-y", isFetching && "opacity-60 transition-opacity")}>
          {data.plots.map((plot) => (
            <div key={plot.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              <div className="min-w-0">
                <span className="text-sm font-medium">{plot.label}</span>
                <p className="text-xs text-muted-foreground">
                  {plot.product ? OFFER_TYPE_LABELS[plot.product] : "No product"}
                  {plot.field_events > 0 ? ` · ${plot.field_events} field record${plot.field_events === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">{plot.size_sqm} sqm</span>
                {plot.clearing_percent > 0 ? (
                  <span className="text-xs text-muted-foreground">{plot.clearing_percent.toFixed(0)}% cleared</span>
                ) : null}
                {plot.parcelled ? <Badge variant="outline">Parcelled</Badge> : null}
                {plot.allocated_date ? (
                  <span className="text-xs text-muted-foreground">
                    Allocated {new Date(plot.allocated_date).toLocaleDateString("en-NG")}
                  </span>
                ) : null}
                <Badge
                  variant="secondary"
                  className={cn(
                    plot.commercial_status === "allocated"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  )}
                >
                  {PLOT_STATUS_LABELS[plot.commercial_status]}
                </Badge>
                {plot.commercial_status === "allocated" && isMockApiEnabled() ? (
                  <GroundConfirmationBadge assetId={assetId} plotId={plot.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        {data ? (
          <span>
            {data.filtered_totals.plots} plots · {data.filtered_totals.allocated} allocated ·{" "}
            {data.filtered_totals.allocation_ready} allocation-ready ·{" "}
            {data.filtered_totals.parcelled} parcelled · {data.filtered_totals.sqm.toLocaleString()} sqm
          </span>
        ) : (
          <span>Loading totals…</span>
        )}
      </div>

      {data ? (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5 text-xs sm:px-6">
          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          {data.allocation_readiness.upcoming_event ? (
            <span>
              {data.allocation_readiness.plots_ready} of{" "}
              {data.allocation_readiness.plots_ready + data.allocation_readiness.plots_not_ready} plots ready for{" "}
              <span className="font-medium">{data.allocation_readiness.upcoming_event.title}</span> on{" "}
              {new Date(data.allocation_readiness.upcoming_event.starts_at).toLocaleDateString("en-NG")}
            </span>
          ) : data.allocation_readiness.latest_completed_event ? (
            <span className="text-muted-foreground">
              No upcoming allocation event — last one was{" "}
              <span className="font-medium">{data.allocation_readiness.latest_completed_event.title}</span> on{" "}
              {new Date(data.allocation_readiness.latest_completed_event.starts_at).toLocaleDateString("en-NG")}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {data.allocation_readiness.note ?? "No allocation event is scheduled."}
            </span>
          )}
        </div>
      ) : null}

      {meta && meta.totalPages && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 sm:px-6">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= (meta.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
