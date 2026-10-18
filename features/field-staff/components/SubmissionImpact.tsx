"use client";

import { ArrowRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { assetName } from "../schemas/field-staff.schema";
import type { SubmissionDetail } from "../schemas/submission.schema";
import { useAssetPlotsByBlocks, useFieldCosts, useSiteSetup, useStaffMonth } from "../hooks/use-field-performance";
import { formatNaira, formatPeriod, formatQuantity } from "../lib/format";
import { blockOf, costImpact, plotImpact, scoreImpact, siteSetupImpact, type ImpactRow } from "../lib/impact";

const EFFECT_LABELS: Record<SubmissionDetail["effects"][number]["effect_type"], string> = {
  performance_actual: "Performance",
  site_setup: "Site setup",
  plot_history: "Plot history",
  asset_cost: "Estate costs",
  audit_timeline: "Timeline",
};

/** Plots listed one by one before the rest collapse into "and N more". */
const MAX_PLOT_ROWS = 6;

function Row({ label, before, after, note }: ImpactRow) {
  const changed = before !== after;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="col-start-2 flex items-center gap-2 text-sm tabular-nums sm:col-start-auto sm:contents">
        <span className="text-gray-500 sm:text-right">{before}</span>
        <ArrowRight className="h-3.5 w-3.5 text-gray-400" aria-label="becomes" />
        <span className={cn("sm:text-right", changed ? "font-semibold text-gray-900" : "text-gray-500")}>{after}</span>
      </span>
      {note && <span className="col-span-full text-xs text-amber-700">{note}</span>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <div className="divide-y">{children}</div>
    </div>
  );
}

const Line = ({ children }: { children: React.ReactNode }) => (
  <p className="px-3 py-2 text-sm text-gray-600">{children}</p>
);

/**
 * Exactly what verifying changes — performance, Site Setup, plot history and
 * cost — as before → after. For waiting work it's the preview; for verified
 * work, what it did ("before" takes this work back out of today's figures).
 */
export function SubmissionImpact({ detail }: { detail: SubmissionDetail }) {
  const { submission: sub, effects, plots: selected } = detail;
  const applied = sub.status === "verified";
  const relevant = applied || sub.status === "submitted";
  const assetId = sub.asset?.id;
  const needsPlots = sub.status === "submitted" && selected.length > 0;

  const month = useStaffMonth(relevant ? sub.field_staff?.id : null, sub.year, sub.month);
  const costs = useFieldCosts(assetId, { enabled: relevant && sub.amount_spent !== null });
  const setup = useSiteSetup(assetId, { enabled: relevant && sub.metric_key !== "allocation_customers" });
  const plotState = useAssetPlotsByBlocks(assetId, [...new Set(selected.map((p) => blockOf(p.label)))], {
    enabled: needsPlots,
  });

  if (!relevant) return null;

  const score = scoreImpact(sub, month.data);
  const cost = costImpact(sub, costs.data);
  const siteRows = siteSetupImpact(sub, setup.data);
  const plotRows = plotImpact(sub, selected, plotState.plots);
  const loading =
    month.isLoading ||
    setup.isLoading ||
    (sub.amount_spent !== null && costs.isLoading) ||
    (needsPlots && plotState.isLoading);
  const written = effects.filter((e) => !e.is_reversed).map((e) => EFFECT_LABELS[e.effect_type]);

  return (
    <section className="overflow-hidden rounded-lg border">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-sm font-semibold">{applied ? "What verification changed" : "If you verify"}</h3>
        <span className="text-xs text-gray-500">Before → after</span>
      </header>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="divide-y">
          <Group title="Performance">
            {score?.kind === "change" ? (
              <>
                <Row
                  label={`${score.metricLabel} · ${formatPeriod(sub.year, sub.month)}`}
                  before={`${formatQuantity(score.verified[0], score.unit)} / ${formatQuantity(score.target, score.unit)}`}
                  after={`${formatQuantity(score.verified[1], score.unit)} / ${formatQuantity(score.target, score.unit)}`}
                />
                <Row
                  label="Points for this target"
                  before={`${score.points[0].toFixed(1)} of ${score.weight}`}
                  after={`${score.points[1].toFixed(1)} of ${score.weight}`}
                  note={score.capped ? "Goes past the target — anything over 100% adds no points." : undefined}
                />
                <Row
                  label={`Score on ${assetName(sub.asset)}`}
                  before={score.siteScore[0].toFixed(1)}
                  after={score.siteScore[1].toFixed(1)}
                />
                {score.overall && (
                  <Row label="Overall score" before={score.overall[0].toFixed(1)} after={score.overall[1].toFixed(1)} />
                )}
              </>
            ) : score?.kind === "none" ? (
              <Line>{score.reason}</Line>
            ) : (
              <Line>Couldn&apos;t work out the score impact.</Line>
            )}
          </Group>

          {sub.metric_key !== "allocation_customers" && (
            <Group title={`Site setup · ${assetName(sub.asset)}`}>
              {siteRows.length ? (
                siteRows.map((row) => <Row key={row.label} {...row} />)
              ) : (
                <Line>{setup.error ? "Couldn't load the estate's site setup." : "No site setup figure changes."}</Line>
              )}
            </Group>
          )}

          {plotRows.length > 0 && (
            <Group title="Plot history">
              {plotRows.slice(0, MAX_PLOT_ROWS).map((row) => (
                <Row key={row.label} {...row} />
              ))}
              {plotRows.length > MAX_PLOT_ROWS && <Line>and {plotRows.length - MAX_PLOT_ROWS} more plots</Line>}
              <Line>Sales and allocation status don&apos;t change.</Line>
            </Group>
          )}
          {applied && selected.length > 0 && (
            <Group title="Plot history">
              <Line>Written for {selected.map((p) => p.label).join(", ")}.</Line>
            </Group>
          )}

          <Group title="Cost">
            {cost ? (
              <Row
                label={`Field costs on ${assetName(sub.asset)}`}
                before={formatNaira(cost.before)}
                after={formatNaira(cost.after)}
                note={
                  applied
                    ? `Includes this ${formatNaira(cost.amount)}, sent to finance as a claim.`
                    : `+${formatNaira(cost.amount)}, sent to finance as a claim to accept.`
                }
              />
            ) : (
              <Line>
                {sub.amount_spent === null || sub.amount_spent <= 0
                  ? "No amount was reported, so no cost changes."
                  : "Couldn't load the estate's costs."}
              </Line>
            )}
          </Group>

          <p className="px-3 py-2 text-xs text-gray-500">
            {applied && written.length
              ? `Written: ${written.join(" · ")}.`
              : "Also adds an entry to the estate timeline. Nothing changes until you verify; then it all updates together."}
          </p>
        </div>
      )}
    </section>
  );
}
