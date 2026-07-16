import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** One segment of a stacked breakdown bar under the value. */
export interface BreakdownSegment {
  /** Short label shown in the legend (e.g. "managed" or "Tunde Akinbode"). */
  label: string;
  /** Raw value (count or currency). Segments are widthed proportionally. */
  value: number;
  /** Tailwind background class for the segment + legend swatch. */
  color: string;
  /** Optional pre-formatted display string (e.g. "₦6.2M") shown next to the label. */
  display?: string;
  /** Optional click handler → typically opens a drill-down drawer. */
  onClick?: () => void;
}

interface StatCardProps {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  /** Makes the card clickable. Shows a chevron in the top-right and hover styles. */
  onClick?: () => void;
  /** Optional attribution breakdown — stacked bar + legend under the value.
   * Segments whose total is 0 are treated as "no data" and skipped. */
  breakdown?: BreakdownSegment[];
}

const sum = (segments: BreakdownSegment[]) =>
  segments.reduce((acc, s) => acc + (s.value || 0), 0);

function BreakdownBar({ segments }: { segments: BreakdownSegment[] }) {
  const total = sum(segments);
  if (total <= 0) return null;
  return (
    <>
      <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        {segments.map((s, i) => {
          const pct = ((s.value || 0) / total) * 100;
          if (pct <= 0) return null;
          const clickable = Boolean(s.onClick);
          return (
            <button
              key={`${s.label}-${i}`}
              type="button"
              disabled={!clickable}
              onClick={
                clickable
                  ? (e) => {
                      e.stopPropagation();
                      s.onClick?.();
                    }
                  : undefined
              }
              title={`${s.label} · ${s.display ?? s.value}`}
              aria-label={`${s.label}: ${s.display ?? s.value}`}
              className={cn(
                "h-full transition-opacity",
                s.color,
                clickable
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-default"
              )}
              style={{ width: `${pct}%` }}
            />
          );
        })}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
        {segments.map((s, i) => {
          if ((s.value || 0) <= 0) return null;
          const clickable = Boolean(s.onClick);
          return (
            <li key={`${s.label}-legend-${i}`}>
              <button
                type="button"
                disabled={!clickable}
                onClick={
                  clickable
                    ? (e) => {
                        e.stopPropagation();
                        s.onClick?.();
                      }
                    : undefined
                }
                className={cn(
                  "inline-flex items-center gap-1.5 tabular-nums",
                  clickable && "cursor-pointer hover:text-gray-900"
                )}
              >
                <span
                  className={cn("h-2 w-2 rounded-sm", s.color)}
                  aria-hidden="true"
                />
                <span className="font-medium text-gray-700">
                  {s.display ?? s.value.toLocaleString()}
                </span>
                <span>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function StatCard({
  icon: Icon,
  iconColor = "text-gray-900",
  iconBg = "bg-gray-100",
  label,
  value,
  hint,
  className,
  onClick,
  breakdown,
}: StatCardProps) {
  const clickable = Boolean(onClick);
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "bg-white rounded-xl p-6 border border-gray-200 transition-shadow",
        clickable
          ? "cursor-pointer hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00695C]/30"
          : "hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        {clickable && (
          <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {breakdown && breakdown.length > 0 && <BreakdownBar segments={breakdown} />}
    </div>
  );
}
