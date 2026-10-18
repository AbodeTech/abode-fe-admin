import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatHours } from "../lib/format";

interface Props {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  /** Weekday hours; null when nothing was decided. */
  avgHours: number | null;
  targetHours: number;
  tooltip: string;
  /** Counts line under the bar, e.g. "142 decided · 14 declined". */
  footer: string;
}

/**
 * KpiTile's twin for a lower-is-better number. KpiTile reads its bar as
 * attainment (fuller = better); here the bar is how much of the 24-hour
 * allowance the average uses, so fuller is worse, and anything past the
 * target turns red.
 */
export function ApprovalTimeTile({ icon: Icon, iconColor, iconBg, label, avgHours: avg, targetHours, tooltip, footer }: Props) {
  const over = avg != null && avg > targetHours;
  const used = avg == null ? 0 : Math.min(100, (avg / targetHours) * 100);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
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
      </div>

      <p className="text-sm text-gray-600 mb-2">{label}</p>

      {avg == null ? (
        <>
          <p className="text-2xl font-semibold text-gray-300 mb-3">—</p>
          <p className="text-xs text-gray-500">No decisions this period</p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatHours(avg)}</span>
            <span className="text-sm text-gray-400 tabular-nums">/ {targetHours} h target</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-2">
            <div
              className={cn("h-full transition-all", over ? "bg-[#AD1F2A]" : "bg-[#00695C]")}
              style={{ width: `${used}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500 tabular-nums">{footer}</span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                over ? "bg-red-50 text-[#AD1F2A]" : "bg-[#E0F2F1] text-[#00695C]"
              )}
            >
              {over ? "Over target" : "Under target"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
