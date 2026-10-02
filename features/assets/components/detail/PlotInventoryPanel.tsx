"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import { PLOT_STATUSES, type PlotStatus } from "../../schemas/block-plot.schema";
import { useAssetBlocks } from "../../hooks/use-blocks";
import { usePlotInventory } from "../../hooks/use-plot-inventory";
import { formatEventDate } from "../../schemas/allocation-event.schema";
import { DetailPanel } from "./DetailPanel";

const ALL_BLOCKS = "all-blocks";
const ALL_STATUSES = "all-statuses";

/** This table's own wording — the design says plainly "Allocated" / "Available". */
const STATUS_LABELS: Record<PlotStatus, string> = { available: "Available", allocated: "Allocated" };

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right first:text-left";

/**
 * Plot inventory — every plot on the estate across every block, from
 * GET /admin/assets/:assetId/plots (searched, filtered and paged by the
 * backend).
 *
 * Column by column:
 *  - Plot / Block / Size   the plot record itself.
 *  - Product               the product of the plan the plot is allocated to.
 *                          A plot has no product of its own, so an available
 *                          plot shows a dash (the design shows one there, but
 *                          the backend has nothing to give).
 *  - Plot status           `available` or `allocated`.
 *  - Customer plan         the id of the plan holding the plot. The design
 *                          shows the customer's name and event; this endpoint
 *                          returns only the plan id.
 *  - Allocated date        when the plot was bound to that plan.
 *
 * "Manage plots" opens the per-block editor (add, resize, renumber, delete) —
 * plots are managed a block at a time, so it asks which block first.
 */
export function PlotInventoryPanel({
  assetId,
  onManageBlock,
}: {
  assetId: string;
  onManageBlock: (blockId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [block, setBlock] = useState<string | null>(null);
  const [status, setStatus] = useState<PlotStatus | null>(null);
  const [page, setPage] = useState(1);

  const { data: blocks = [] } = useAssetBlocks(assetId);

  const filters = { search: search.trim() || null, block, status, page, limit: 20 };
  const { data: result, isLoading, isFetching, error } = usePlotInventory(assetId, filters);
  const data = result?.data;
  const meta = result?.meta;

  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <DetailPanel
      title="Plot inventory"
      description="Exact plots become connected to customers only through physical allocation"
      flush
      action={
        blocks.length === 0 ? null : blocks.length === 1 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onManageBlock(blocks[0]._id)}>
            Manage plots
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Manage plots
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {blocks.map((b) => (
                <DropdownMenuItem key={b._id} onClick={() => onManageBlock(b._id)}>
                  Block {b.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <div className="relative min-w-40 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
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
            {/* Matched by label on the backend, not id. */}
            {blocks.map((b) => (
              <SelectItem key={b._id} value={b.label}>
                Block {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status ?? ALL_STATUSES}
          onValueChange={(value) =>
            updateFilter(() => setStatus(value === ALL_STATUSES ? null : (value as PlotStatus)))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {PLOT_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {STATUS_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="p-6 text-center text-sm text-rose-600">Couldn&apos;t load plots: {error.message}</p>
      ) : isLoading || !data ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : data.plots.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          {data.totals.plots === 0
            ? "No plots recorded yet — add a block, then add plots to it."
            : "No plots match these filters."}
        </p>
      ) : (
        <div className={cn("overflow-x-auto", isFetching && "opacity-60 transition-opacity")}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40">
                <th className={HEAD}>Plot</th>
                <th className={HEAD}>Block</th>
                <th className={HEAD}>Size</th>
                <th className={HEAD}>Product</th>
                <th className={HEAD}>Plot status</th>
                <th className={HEAD}>Customer plan</th>
                <th className={HEAD}>Allocated date</th>
              </tr>
            </thead>
            <tbody>
              {data.plots.map((plot) => (
                <tr key={plot.id} className="border-b last:border-b-0 hover:bg-muted/40">
                  <td className={cn(CELL, "font-semibold")}>{plot.label}</td>
                  <td className={CELL}>Block {plot.block}</td>
                  <td className={cn(CELL, "tabular-nums")}>{plot.size_sqm.toLocaleString()} sqm</td>
                  <td className={CELL}>{plot.product ? OFFER_TYPE_LABELS[plot.product] : "—"}</td>
                  <td className={CELL}>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-semibold",
                        plot.commercial_status === "allocated"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {STATUS_LABELS[plot.commercial_status]}
                    </span>
                  </td>
                  <td className={cn(CELL, "tabular-nums")}>
                    {plot.payment_plan_id ? (
                      <span title={plot.payment_plan_id}>Plan …{plot.payment_plan_id.slice(-6)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={CELL}>{plot.allocated_date ? formatEventDate(plot.allocated_date) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {data?.filtered_totals.plots.toLocaleString()} plots
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
    </DetailPanel>
  );
}
