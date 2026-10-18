"use client";

import type { ComponentType } from "react";
import { CircleCheck, Clock, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import type { Campaign } from "../../schemas/campaign.schema";
import type { CampaignDashboard } from "../../schemas/dashboard-response.schema";
import { formatDate } from "../../utils/format-period";
import { formatCount, formatSqm } from "../../utils/format-metrics";

type PaceTone = "good" | "warning" | "serious" | "neutral";

const PACE_STYLES: Record<PaceTone, string> = {
  good: "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]",
  warning: "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]",
  serious: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  neutral: "border-border bg-muted text-muted-foreground",
};

/** How far behind an even pace still reads as a nudge, not an alarm. */
const WARNING_BAND = 0.1;

function paceOf(
  progress: CampaignDashboard["progress"],
  period: CampaignDashboard["period"]
): { tone: PaceTone; label: string; icon: ComponentType<{ className?: string }>; expected: number | null } | null {
  const target = progress.total_sqm_target;
  if (!target || target <= 0) return null;
  if (!period.has_started) return { tone: "neutral", label: "Not started", icon: Clock, expected: null };
  if (progress.total_sqm_sold >= target) {
    return { tone: "good", label: "Target reached", icon: CircleCheck, expected: target };
  }

  const expected = target * period.percent_elapsed;
  const gap = progress.total_sqm_sold - expected;
  if (gap >= 0) {
    return { tone: "good", label: `Ahead of pace by ${formatSqm(gap)}`, icon: TrendingUp, expected };
  }
  return {
    tone: -gap <= target * WARNING_BAND ? "warning" : "serious",
    label: `Behind pace by ${formatSqm(-gap)}`,
    icon: TrendingDown,
    expected,
  };
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  flex: "Flex",
  "full-ownership": "Full ownership",
  commercial: "Commercial",
};

export function LandProgressCard({
  campaign,
  data,
  isLoading,
}: {
  campaign: Pick<Campaign, "eligible_asset_types">;
  data?: Pick<CampaignDashboard, "progress" | "period">;
  isLoading?: boolean;
}) {
  if (isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (!data) return null;

  const { progress, period } = data;
  const target = progress.total_sqm_target;
  const hasTarget = target != null && target > 0;
  const pct = Math.min(100, Math.max(0, (progress.percent ?? 0) * 100));
  // The BE caps `percent` at 1 for the bar; the sentence tells the real ratio.
  const ratio = hasTarget ? progress.total_sqm_sold / target : null;
  const pace = paceOf(progress, period);
  // The tick marks where an even pace would put us today; once the target is
  // met there is no pace left to measure against.
  const expectedPct =
    hasTarget && pace?.expected != null && progress.total_sqm_sold < target
      ? Math.min(100, (pace.expected / target) * 100)
      : null;
  const productTypes = (campaign.eligible_asset_types ?? []).map((type) => ASSET_TYPE_LABELS[type] ?? type);
  const products =
    productTypes.length > 1
      ? `${productTypes.slice(0, -1).join(", ")} and ${productTypes[productTypes.length - 1]}`
      : productTypes[0];

  return (
    <Card className="min-w-0 gap-0 border-border bg-card py-0 shadow-none">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Land sold</p>
            <p className="mt-1 text-5xl font-semibold leading-none tracking-tight text-foreground">
              {formatCount(progress.total_sqm_sold)}
              <span className="ml-2 text-xl font-medium text-muted-foreground">sqm</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasTarget
                ? `${formatPercent(ratio, ratio != null && ratio >= 1 ? 0 : 1)} of the ${formatSqm(target)} target`
                : "No sqm target set for this campaign"}
            </p>
          </div>
          {pace ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs font-medium",
                PACE_STYLES[pace.tone]
              )}
            >
              <pace.icon className="h-3.5 w-3.5" aria-hidden />
              {pace.label}
            </span>
          ) : null}
        </div>

        {hasTarget ? (
          <div className="space-y-2">
            <div
              className="relative h-3 w-full rounded-full"
              style={{ backgroundColor: "color-mix(in oklab, var(--chart-2) 16%, transparent)" }}
              role="meter"
              aria-label="Land sold against target"
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={progress.total_sqm_sold}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: "var(--chart-2)" }}
              />
              {expectedPct != null ? (
                <div
                  className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
                  style={{ left: `calc(${expectedPct}% - 1px)` }}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{formatSqm(target)}</span>
            </div>
            {expectedPct != null ? (
              // A legend line rather than a label pinned under the tick: pinned,
              // it collides with the scale ends on a narrow screen.
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-0.5 rounded-full bg-foreground" aria-hidden />
                Even pace would be {formatSqm(pace?.expected)} by today
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Counts every {products ? `${products} ` : ""}purchase made {formatDate(period.start_date)} –{" "}
          {formatDate(period.end_date)}
          {products ? "" : " on any product"}, whether or not it earned a reward.
        </p>
      </CardContent>
    </Card>
  );
}
