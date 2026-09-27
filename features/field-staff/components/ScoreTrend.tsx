"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useStaffTrend } from "../hooks/use-field-performance";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * One person's verified score over the last six months, as one bar per month.
 * Single series, so one hue and no legend — the title names it. A month with
 * no targets gets no bar and a dash, never a zero bar: "not measured" isn't
 * "scored nothing". The month on screen is drawn solid, the rest lighter.
 */
export function ScoreTrend({ staffId, year, month }: { staffId: string; year: number; month: number }) {
  const trend = useStaffTrend(staffId, 6);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-gray-600">Score, last 6 months</p>
        {trend.data && trend.data.months_compared > 0 && (
          <p className="text-xs text-gray-500">
            Average <span className="font-medium tabular-nums text-gray-900">{trend.data.average_score.toFixed(1)}</span>{" "}
            over {trend.data.months_compared} month{trend.data.months_compared === 1 ? "" : "s"} with targets
          </p>
        )}
      </div>

      {trend.isLoading ? (
        <div className="flex h-28 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : trend.error || !trend.data ? (
        <p className="text-sm text-[#AD1F2A]">{trend.error?.message ?? "Couldn't load the trend."}</p>
      ) : (
        <TooltipProvider delayDuration={100}>
          <ol className="grid grid-cols-6 items-end gap-2" aria-label="Score by month">
            {trend.data.points.map((p) => {
              const measured = p.scorecards > 0;
              const current = p.year === year && p.month === month;
              const name = `${MONTHS[p.month - 1]} ${p.year}`;
              return (
                <li key={`${p.year}-${p.month}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* The whole column is the hit target, not just the bar. */}
                      <button
                        type="button"
                        className="group flex w-full flex-col items-center gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                        aria-label={measured ? `${name}: ${p.score.toFixed(1)} of 100` : `${name}: no targets`}
                      >
                        {/* Only the month on screen is labelled; the rest read on hover. */}
                        <span className="h-4 text-[11px] font-medium tabular-nums text-gray-900">
                          {!measured ? <span className="font-normal text-gray-400">—</span> : current ? p.score.toFixed(0) : ""}
                        </span>
                        <span className="flex h-20 w-full items-end justify-center">
                          {measured && (
                            <span
                              className={cn(
                                "w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-100",
                                current ? "bg-[#00695C]" : "bg-[#00695C]/40"
                              )}
                              style={{ height: `${Math.max(Math.min(p.score, 100), 2)}%` }}
                            />
                          )}
                        </span>
                        <span className={cn("text-xs", current ? "font-semibold text-gray-900" : "text-gray-500")}>
                          {MONTHS[p.month - 1]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-medium">{name}</p>
                      {measured ? (
                        <>
                          <p>Verified score {p.score.toFixed(1)} / 100</p>
                          {p.projected_score !== p.score && <p>Projected {p.projected_score.toFixed(1)}</p>}
                          <p>
                            {p.scorecards} site{p.scorecards === 1 ? "" : "s"} with targets
                            {p.sites_without_targets > 0 && ` · ${p.sites_without_targets} without`}
                          </p>
                        </>
                      ) : (
                        <p>No targets that month</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ol>
        </TooltipProvider>
      )}
    </div>
  );
}
