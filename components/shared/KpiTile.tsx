import React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Shared KPI tile — target vs actual with a tone-coloured progress bar
 * and status pill. Used across the manager performance dashboards
 * (Associate Pro Manager, CS Manager, FLEX Manager).
 *
 * Semantics
 * - `noData` swaps in an empty-state message so 0-values don't read
 *   as real signal ("No ratings yet" beats "0.00").
 * - `footer` slot renders below the standard content — used for
 *   secondary signals like "N paid customers awaiting a plot" or a
 *   collections gap.
 * - Untargeted state (no `targetDisplay`) shows "No benchmark set"
 *   instead of a bar — 0-weight in a computed score should read as
 *   "not tracked here" not "failed".
 */

export type KpiTone = "exceeded" | "on-track" | "approaching" | "behind";

const toneFor = (pct: number): KpiTone => {
  if (pct >= 100) return "exceeded";
  if (pct >= 85) return "on-track";
  if (pct >= 50) return "approaching";
  return "behind";
};

const TONE_STYLES: Record<
  KpiTone,
  { bar: string; pillBg: string; pillText: string; label: string }
> = {
  exceeded: {
    bar: "bg-[#00695C]",
    pillBg: "bg-[#00695C]",
    pillText: "text-white",
    label: "Exceeded",
  },
  "on-track": {
    bar: "bg-[#00695C]",
    pillBg: "bg-[#E0F2F1]",
    pillText: "text-[#00695C]",
    label: "On track",
  },
  approaching: {
    bar: "bg-amber-500",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    label: "Approaching",
  },
  behind: {
    bar: "bg-[#AD1F2A]",
    pillBg: "bg-red-50",
    pillText: "text-[#AD1F2A]",
    label: "Below target",
  },
};

interface KpiTileProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  actualDisplay: string;
  targetDisplay?: string;
  percent?: number;
  tooltip?: string;
  /** When true, replace the value + bar with an empty-state message. */
  noData?: boolean;
  noDataLabel?: string;
  /** Extra content rendered below the standard tile footer — used for
   * secondary signals (obligation alerts, collection gaps, etc). */
  footer?: React.ReactNode;
}

export function KpiTile({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  actualDisplay,
  targetDisplay,
  percent,
  tooltip,
  noData = false,
  noDataLabel = "No data yet",
  footer,
}: KpiTileProps) {
  const hasTarget = targetDisplay !== undefined && percent !== undefined;
  const tone = hasTarget ? toneFor(percent) : null;
  const s = tone ? TONE_STYLES[tone] : null;
  const cappedPercent = hasTarget ? Math.min(percent, 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-2">{label}</p>

      {noData ? (
        <>
          <p className="text-2xl font-semibold text-gray-300 mb-3">—</p>
          <p className="text-xs text-gray-500">{noDataLabel}</p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">
              {actualDisplay}
            </span>
            {hasTarget && (
              <span className="text-sm text-gray-400 tabular-nums">
                / {targetDisplay}
              </span>
            )}
          </div>

          {hasTarget && s ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-2">
                <div
                  className={cn("h-full transition-all", s.bar)}
                  style={{ width: `${cappedPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    s.pillBg,
                    s.pillText
                  )}
                >
                  {s.label}
                </span>
                <span className="text-xs font-medium text-gray-500 tabular-nums">
                  {Math.round(percent)}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">No benchmark set</p>
          )}
        </>
      )}

      {footer}
    </div>
  );
}
