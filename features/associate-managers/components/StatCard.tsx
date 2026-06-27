import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    </div>
  );
}
