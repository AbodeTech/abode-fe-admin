"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, ChartPie, TriangleAlert, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useAssetAnalytics } from "../../hooks/use-asset-analytics";
import { useEstateProfitability } from "../../hooks/use-estate-profitability";
import type { AnalyticsFilter } from "../../schemas/asset-analytics.schema";
import { AssetHealthBar } from "./AssetHealthBar";
import { PaymentPlanMatrix } from "./PaymentPlanMatrix";
import { PlanProfitabilityTable } from "./PlanProfitabilityTable";
import { ProductProfitabilityComparison } from "./ProductProfitabilityComparison";
import { ProfitabilityCalculationDrawer } from "./ProfitabilityCalculationDrawer";

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

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      <h3 className="text-lg font-semibold tracking-tight">{children}</h3>
    </div>
  );
}

/**
 * The Performance tab, in the asset-detail design's order:
 *
 *   date filter → summary / defaults / customer health → payment plan
 *   performance → profitability by product
 *
 * Two endpoints feed it. Everything down to the plan table is
 * GET /admin/assets/:id/analytics, which the date filter narrows (customer
 * counts stay all-time — the backend's rule, repeated in the footnote). The
 * profitability section is GET .../profitability, always current: the
 * backend has no date range for it, so the filter above does not move it.
 */
export function AssetPerformance({ assetId }: { assetId: string }) {
  const [filter, setFilter] = useState<AnalyticsFilter>("all_time");
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [calcOpen, setCalcOpen] = useState(false);

  const permissions = useAdminPermissions();
  const canView = permissions.has("view_asset_analytics");
  const canViewProfitability = permissions.has("view_asset_profitability");

  const { data, isLoading, isFetching, error } = useAssetAnalytics(assetId, {
    filter,
    startDate: range.startDate,
    endDate: range.endDate,
    enabled: canView,
  });
  const { data: profitability } = useEstateProfitability(assetId, undefined, {
    enabled: canViewProfitability,
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

  // The backend's own list of what makes the profit figure incomplete.
  const profitWarnings = profitability?.warnings ?? [];

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["all_time", "custom"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs",
                filter === option
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-muted"
              )}
            >
              {option === "all_time" ? "All time" : "Custom range"}
            </button>
          ))}
          {filter === "custom" && (
            <DateRange startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
          )}
        </div>
        {data ? (
          <span className="text-[11px] text-muted-foreground">
            Figures as of{" "}
            {new Date(data.as_of).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : null}
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
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      ) : (
        <div className={cn("space-y-4", isFetching && "opacity-60 transition-opacity")}>
          <AssetHealthBar data={data} />

          <SectionTitle icon={ChartPie}>Payment plan performance</SectionTitle>
          <PaymentPlanMatrix data={data.size_plan_breakdown} />
        </div>
      )}

      {canViewProfitability ? (
        <>
          <SectionTitle icon={Banknote}>Profitability</SectionTitle>

          {profitWarnings.length > 0 ? (
            <aside className="flex flex-col items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 sm:flex-row">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0">
                <strong className="block text-[13px] font-semibold">Profit is provisional</strong>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {profitWarnings.join(" ")} A missing value stays unknown and is not treated as zero.
                </p>
              </div>
              <Link
                href={`/assets/${assetId}/costs`}
                className="shrink-0 whitespace-nowrap text-xs font-medium hover:underline sm:ml-auto"
              >
                Review cost coverage →
              </Link>
            </aside>
          ) : null}

          <ProductProfitabilityComparison assetId={assetId} onViewCalculation={() => setCalcOpen(true)} />
          <PlanProfitabilityTable assetId={assetId} />
          <ProfitabilityCalculationDrawer assetId={assetId} open={calcOpen} onOpenChange={setCalcOpen} />
        </>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Customer counts remain all-time when a custom date range is selected. Profitability is always
        current and does not move with the date range.
      </p>
    </div>
  );
}
