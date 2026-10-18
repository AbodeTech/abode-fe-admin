"use client";

import { Loader2 } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { FieldMetricKey } from "../schemas/scorecard.schema";
import { useAllFieldSubmissions } from "../hooks/use-field-submissions";
import { formatQuantity } from "../lib/format";
import { monthWeeks, weeklyTotals } from "../lib/weeks";

type WeeklyMetric = { metric_key: FieldMetricKey; label: string; unit: string; target: number };

interface WeeklyBreakdownProps {
  staffId: string;
  /** One site, or undefined for all the person's sites. */
  assetId?: string;
  year: number;
  month: number;
  /** The targets in view — one row each. */
  metrics: WeeklyMetric[];
}

/**
 * The month's work week by week, one row per target: verified work solid,
 * work waiting for review stacked on top in a lighter step of the same hue.
 * Built from the submissions themselves, so it follows the site picker and
 * shows waiting work — but it's display only; the score stays monthly.
 * Each row is scaled to its own busiest week, since targets use different units.
 */
export function WeeklyBreakdown({ staffId, assetId, year, month, metrics }: WeeklyBreakdownProps) {
  const subs = useAllFieldSubmissions({ field_staff_id: staffId, asset_id: assetId, year, month });
  const weeks = monthWeeks(year, month);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600">This month by week</p>
          <p className="text-xs text-gray-500">By work date. The score is still worked out for the whole month.</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#00695C]" /> Verified
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#00695C]/30" /> Waiting
          </span>
        </div>
      </div>

      {subs.isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : subs.error ? (
        <p className="text-sm text-[#AD1F2A]">{subs.error.message}</p>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="space-y-5">
            {metrics.map((metric) => {
              const totals = weeklyTotals(subs.data?.items ?? [], metric.metric_key, weeks);
              const verified = totals.reduce((n, w) => n + w.verified, 0);
              const waiting = totals.reduce((n, w) => n + w.waiting, 0);
              const peak = Math.max(1, ...totals.map((w) => w.verified + w.waiting));

              return (
                <div key={metric.metric_key} className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-end">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                    <p className="text-xs tabular-nums text-gray-500">
                      {formatQuantity(verified, metric.unit)} of {formatQuantity(metric.target, metric.unit)}
                      {waiting > 0 && <span className="text-[#00695C]"> · +{formatQuantity(waiting, metric.unit)} waiting</span>}
                    </p>
                  </div>

                  <ol
                    className="grid items-end gap-2"
                    style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
                    aria-label={`${metric.label} by week`}
                  >
                    {weeks.map((week, i) => {
                      const w = totals[i];
                      const empty = w.verified + w.waiting === 0;
                      const summary = week.future
                        ? `${week.label}: not reached yet`
                        : `${week.label}: ${formatQuantity(w.verified, metric.unit)} verified${
                            w.waiting ? `, ${formatQuantity(w.waiting, metric.unit)} waiting` : ""
                          }`;
                      return (
                        <li key={week.index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {/* The whole column is the hit target. */}
                              <button
                                type="button"
                                aria-label={summary}
                                className="flex w-full flex-col items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                              >
                                <span className="flex h-14 w-full items-end justify-center">
                                  {week.future || empty ? (
                                    <span className="mb-0.5 text-xs text-gray-300">—</span>
                                  ) : (
                                    <span className="flex w-full max-w-8 flex-col-reverse gap-[2px]">
                                      {w.verified > 0 && (
                                        <span
                                          className={w.waiting > 0 ? "block bg-[#00695C]" : "block rounded-t-[4px] bg-[#00695C]"}
                                          style={{ height: `${Math.max((w.verified / peak) * 52, 3)}px` }}
                                        />
                                      )}
                                      {w.waiting > 0 && (
                                        <span
                                          className="block rounded-t-[4px] bg-[#00695C]/30"
                                          style={{ height: `${Math.max((w.waiting / peak) * 52, 3)}px` }}
                                        />
                                      )}
                                    </span>
                                  )}
                                </span>
                                <span className={week.future ? "text-[11px] text-gray-300" : "text-[11px] text-gray-500"}>
                                  {week.label}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{week.label}</p>
                              {week.future ? (
                                <p>Not reached yet</p>
                              ) : (
                                <>
                                  <p>Verified {formatQuantity(w.verified, metric.unit)}</p>
                                  <p>Waiting {formatQuantity(w.waiting, metric.unit)}</p>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
          {subs.data?.truncated && (
            <p className="mt-3 text-xs text-gray-500">Only the latest 1,000 records this month are included.</p>
          )}
        </TooltipProvider>
      )}
    </div>
  );
}
