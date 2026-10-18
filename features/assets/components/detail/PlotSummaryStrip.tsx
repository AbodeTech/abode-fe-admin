"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatSqmExact } from "@/lib/utils/format";

import { usePlotSummary } from "../../hooks/use-plot-summary";
import { formatEventDate } from "../../schemas/allocation-event.schema";

function Metric({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className="px-4 py-3.5">
      <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong
        className={cn(
          "text-base font-semibold tabular-nums",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600"
        )}
      >
        {value}
      </strong>
      <small className="mt-1 block text-[10px] text-muted-foreground">{note}</small>
    </div>
  );
}

/**
 * The five figures above the Blocks & Plots tab, from ONE call:
 * GET .../plots/summary?allocation=allocated.
 *
 *  - Total physical plots   `totals.plots` / `totals.sqm` — every plot recorded.
 *  - Allocated plots        `filtered_totals` — the same totals for just the
 *                           plots the filter matched, i.e. the allocated ones.
 *  - Available plots        the difference between the two.
 *  - Next event reserved    `allocation_readiness.upcoming_event.reserved`.
 *  - Event capacity remaining  that event's `capacity - reserved`.
 *
 * The design's "126 plans" on the reserved figure isn't shown: the endpoint
 * reports the sqm an event has reserved, not how many plans that is.
 */
export function PlotSummaryStrip({ assetId }: { assetId: string }) {
  const { data, isLoading, error } = usePlotSummary(assetId, { allocation: "allocated" });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;

  if (error || !data) {
    return (
      <p className="rounded-lg border p-4 text-sm text-rose-600">
        Couldn&apos;t load the plot totals{error ? `: ${error.message}` : "."}
      </p>
    );
  }

  const { totals, filtered_totals: allocated } = data;
  const event = data.allocation_readiness.upcoming_event;
  const unit = event?.size_unit ?? "sqm";
  const reserved = event?.reserved ?? null;
  const remaining = event && event.capacity != null ? Math.max(0, event.capacity - (reserved ?? 0)) : null;

  return (
    <div className="grid grid-cols-1 divide-y overflow-hidden rounded-lg border bg-muted/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
      <Metric
        label="Total physical plots"
        value={totals.plots.toLocaleString()}
        note={`${formatSqmExact(totals.sqm)} recorded`}
      />
      <Metric
        label="Available plots"
        value={(totals.plots - allocated.plots).toLocaleString()}
        note={`${formatSqmExact(totals.sqm - allocated.sqm)} unallocated`}
      />
      <Metric
        label="Allocated plots"
        value={allocated.plots.toLocaleString()}
        note={`${formatSqmExact(allocated.sqm)} assigned`}
      />
      <Metric
        label="Next event reserved"
        value={reserved != null ? `${reserved.toLocaleString()} ${unit}` : "—"}
        note={event ? `${event.title} · ${formatEventDate(event.starts_at)}` : "No upcoming allocation event"}
        tone={reserved ? "warn" : "neutral"}
      />
      <Metric
        label="Event capacity remaining"
        value={remaining != null ? `${remaining.toLocaleString()} ${unit}` : "—"}
        note={event ? (remaining != null ? "After current selections" : "No capacity set on the event") : "No upcoming allocation event"}
        tone={remaining ? "good" : "neutral"}
      />
    </div>
  );
}
