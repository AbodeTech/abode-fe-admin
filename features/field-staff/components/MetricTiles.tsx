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

/** One target across the sites on screen — a person can do the same work on two sites. */
export type MergedMetric = {
  metric_key: FieldMetricKey;
  label: string;
  unit: string;
  verified: number;
  target: number;
  weights: number[];
  pending: number;
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
      weights: [],
      pending: 0,
    };
    row.verified += m.verified;
    row.target += m.target;
    row.weights.push(m.weight);
    row.pending += m.pending;
    byKey.set(m.metric_key, row);
  }
  return [...byKey.values()];
}

/** The overall score out of 100. `null` means nothing is scored — shown as "—", never 0. */
export function ScoreTile({ score, note }: { score: number | null; note: string }) {
  return (
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
      footer={score !== null ? <p className="mt-2 text-xs text-gray-500">{note}</p> : undefined}
    />
  );
}

/** One tile per target, in the dashboard's KPI style: actual / target, bar, and an on-track tag. */
export function MetricTile({ metric }: { metric: MergedMetric }) {
  const look = LOOK[metric.metric_key];
  const percent = metric.target > 0 ? (metric.verified / metric.target) * 100 : 0;
  return (
    <KpiTile
      icon={look.icon}
      iconColor={look.color}
      iconBg={look.bg}
      label={metric.label}
      actualDisplay={formatQuantity(metric.verified, metric.unit)}
      targetDisplay={formatQuantity(metric.target, metric.unit)}
      percent={percent}
      footer={
        <p className="mt-2 text-xs text-gray-500">
          {metric.weights.map((w) => `${w}%`).join(" / ")} of the score
          {metric.pending > 0 && (
            <span className="text-amber-700"> · +{formatQuantity(metric.pending, metric.unit)} waiting</span>
          )}
        </p>
      }
    />
  );
}
