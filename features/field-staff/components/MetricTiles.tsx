"use client";

import { Fence, Grid3x3, Ruler, Shovel, Star, UserCheck } from "lucide-react";

import { KpiTile } from "@/components/shared/KpiTile";

import type { FieldMetricKey } from "../schemas/scorecard.schema";
import type { MetricPerformance } from "../schemas/performance.schema";
import { formatQuantity } from "../lib/format";

const LOOK: Record<FieldMetricKey, { icon: React.ElementType; color: string; bg: string }> = {
  fencing_new_metres: { icon: Fence, color: "text-[#00695C]", bg: "bg-[#E0F2F1]" },
  allocation_customers: { icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
  parcelation_plots: { icon: Grid3x3, color: "text-[#00695C]", bg: "bg-[#E0F2F1]" },
  clearing_sqm: { icon: Shovel, color: "text-amber-600", bg: "bg-amber-50" },
  boundary_metres: { icon: Ruler, color: "text-violet-600", bg: "bg-violet-50" },
};

/**
 * One target across the sites on screen — a person can do the same work on two
 * sites. Quantities add up; points stay per site, because the overall score
 * averages sites rather than adding them.
 */
export type MergedMetric = {
  metric_key: FieldMetricKey;
  label: string;
  unit: string;
  verified: number;
  target: number;
  pending: number;
  /** Verified records behind `verified`. */
  records: number;
  /** Per site: points earned out of the weight. */
  points: { earned: number; weight: number }[];
  /** True when any site went past its target — only 100% of it counts. */
  capped: boolean;
};

export function mergeMetrics(metrics: MetricPerformance[]): MergedMetric[] {
  const byKey = new Map<FieldMetricKey, MergedMetric>();
  for (const m of metrics) {
    const row = byKey.get(m.metric_key) ?? {
      metric_key: m.metric_key,
      label: m.label,
      unit: m.unit,
      verified: 0,
      target: 0,
      pending: 0,
      records: 0,
      points: [],
      capped: false,
    };
    row.verified += m.verified;
    row.target += m.target;
    row.pending += m.pending;
    row.records += m.verified_submissions;
    row.points.push({ earned: m.earned_score, weight: m.weight });
    row.capped ||= m.uncapped_achievement_pct > 100;
    byKey.set(m.metric_key, row);
  }
  return [...byKey.values()];
}

/** The overall score out of 100. `null` means nothing is scored — shown as "—", never 0. */
export function ScoreTile({ score, note, onOpen }: { score: number | null; note: string; onOpen?: () => void }) {
  return (
    <Clickable onOpen={score !== null ? onOpen : undefined} label="Performance score: view the records behind it">
    <KpiTile
      icon={Star}
      iconColor="text-amber-600"
      iconBg="bg-amber-50"
      label="Performance score"
      actualDisplay={score === null ? "—" : score.toFixed(1)}
      targetDisplay={score === null ? undefined : "100"}
      percent={score ?? undefined}
      tooltip="Each target's achievement (capped at 100%) times its weight, added up. Only verified work counts."
      noData={score === null}
      noDataLabel="No published targets"
      footer={
        score !== null ? (
          <>
            <p className="mt-2 text-xs text-gray-500">{note}</p>
            {onOpen && score !== null && <ViewRecords />}
          </>
        ) : undefined
      }
    />
    </Clickable>
  );
}

/**
 * Makes a tile open its source records. The whole tile is the hit target;
 * "View records →" says so without relying on hover.
 */
function Clickable({ onOpen, label, children }: { onOpen?: () => void; label: string; children: React.ReactNode }) {
  if (!onOpen) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="block w-full rounded-xl text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 [&>div]:h-full"
    >
      {children}
    </button>
  );
}

const ViewRecords = () => <p className="mt-2 text-xs font-medium text-[#00695C]">View records →</p>;

/** One tile per target, in the dashboard's KPI style: actual / target, bar, and an on-track tag. */
export function MetricTile({ metric, onOpen }: { metric: MergedMetric; onOpen?: () => void }) {
  const look = LOOK[metric.metric_key];
  const percent = metric.target > 0 ? (metric.verified / metric.target) * 100 : 0;
  return (
    <Clickable onOpen={onOpen} label={`${metric.label}: view the records behind it`}>
    <KpiTile
      icon={look.icon}
      iconColor={look.color}
      iconBg={look.bg}
      label={metric.label}
      actualDisplay={formatQuantity(metric.verified, metric.unit)}
      targetDisplay={formatQuantity(metric.target, metric.unit)}
      percent={percent}
      footer={
        <div className="mt-2 space-y-0.5 text-xs text-gray-500">
          <p>
            Earned{" "}
            <span className="font-medium tabular-nums text-gray-900">
              {metric.points.map((p) => `${p.earned.toFixed(1)} of ${p.weight}`).join(" · ")}
            </span>{" "}
            points
            {metric.capped && <span> · capped at 100%</span>}
          </p>
          <p>
            {metric.records} verified record{metric.records === 1 ? "" : "s"}
            {metric.pending > 0 && (
              <span className="text-amber-700"> · +{formatQuantity(metric.pending, metric.unit)} waiting</span>
            )}
          </p>
          {onOpen && <ViewRecords />}
        </div>
      }
    />
    </Clickable>
  );
}
