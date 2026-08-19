"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Period control for the CS dashboard.
 *
 * Deliberately month/year only — `getCSManagerDashboard` accepts nothing
 * else. The APM dashboard's filter also offers week / rolling-day / custom
 * ranges, but those would silently resolve to the wrong window here, so
 * they're not offered. Restore them if the BE ever grows a period filter.
 *
 * Writes `?month=&year=`; "This month" clears both and lets the BE default.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Sentinel meaning "no explicit month/year — take the BE default". */
const CURRENT = "current";

const HISTORY_LENGTH = 12;

export function CSPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = useMemo(() => {
    const now = new Date();
    return Array.from({ length: HISTORY_LENGTH }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return {
        value: `${year}-${String(month).padStart(2, "0")}`,
        label: `${MONTHS[month - 1]} ${year}`,
        month,
        year,
      };
    });
  }, []);

  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const value =
    monthParam && yearParam
      ? `${yearParam}-${String(Number(monthParam)).padStart(2, "0")}`
      : CURRENT;

  const handleChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // A different period returns a different plan set — restart paging.
    params.set("page", "1");
    if (next === CURRENT) {
      params.delete("month");
      params.delete("year");
    } else {
      const picked = options.find((o) => o.value === next);
      if (!picked) return;
      params.set("month", String(picked.month));
      params.set("year", String(picked.year));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-fit min-w-44 bg-white">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CURRENT}>This month</SelectItem>
        <SelectSeparator />
        {/* index 0 is the current month, already covered by the sentinel */}
        {options.slice(1).map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
