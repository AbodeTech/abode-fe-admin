import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconColor = "text-gray-900",
  iconBg = "bg-gray-100",
  label,
  value,
  hint,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
