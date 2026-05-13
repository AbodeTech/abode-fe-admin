"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Period } from "../mock-data";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = (searchParams.get("period") as Period | null) ?? "month";

  const handleSelect = (value: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    // Custom range overrides period — clear it when a preset is picked
    params.delete("start_date");
    params.delete("end_date");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center rounded-lg bg-white border border-gray-200 p-1">
      {PERIODS.map((p) => {
        const isActive = current === p.value;
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => handleSelect(p.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-[#00695C] text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
