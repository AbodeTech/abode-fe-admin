"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useAssetAnalytics } from "../../hooks/use-asset-analytics";
import type { AnalyticsFilter } from "../../schemas/asset-analytics.schema";
import { AssetHealthBar } from "./AssetHealthBar";
import { PaymentPlanMatrix } from "./PaymentPlanMatrix";

function DateRange({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        type="date"
        aria-label="From"
        className="h-9 w-full sm:w-auto"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
      />
      <span className="hidden text-sm text-muted-foreground sm:inline">to</span>
      <Input
        type="date"
        aria-label="To"
        className="h-9 w-full sm:w-auto"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
      />
    </div>
  );
}

export function AssetPerformance({ assetId }: { assetId: string }) {
  const [filter, setFilter] = useState<AnalyticsFilter>("all_time");
  const [range, setRange] = useState({ startDate: "", endDate: "" });

  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_analytics");

  const { data, isLoading, isFetching, error } = useAssetAnalytics(assetId, {
    filter,
    startDate: range.startDate,
    endDate: range.endDate,
    enabled: canView,
  });

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view asset analytics.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            An admin can grant the view_asset_analytics permission.
          </p>
        </CardContent>
      </Card>
    );
  }

  // A custom range only takes effect once both ends are set — the BE rejects a
  // half-open range, so the hook holds at all_time until then. Say so rather
  // than letting the figures silently ignore the dates.
  const rangeIncomplete =
    filter === "custom" && !(range.startDate && range.endDate);

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["all_time", "custom"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                filter === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {option === "all_time" ? "All time" : "Custom range"}
            </button>
          ))}
        </div>
        {filter === "custom" && (
          <DateRange startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
        )}
      </div>

      {rangeIncomplete && (
        <p className="text-sm text-muted-foreground">
          Pick both a start and an end date — until then these are all-time figures.
        </p>
      )}

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">Could not load performance for this asset.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      ) : (
        <div className={cn("space-y-6", isFetching && "opacity-60 transition-opacity")}>
          <AssetHealthBar data={data} />
          <PaymentPlanMatrix data={data.size_plan_breakdown} />
          <p className="text-xs text-muted-foreground">
            Customer counts are all-time and do not move with the date range. Figures as of{" "}
            {new Date(data.as_of).toLocaleString("en-NG")}.
          </p>
        </div>
      )}
    </div>
  );
}
