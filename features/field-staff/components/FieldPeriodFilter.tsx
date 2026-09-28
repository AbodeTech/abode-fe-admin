"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatPeriod } from "../lib/format";

const HISTORY_LENGTH = 12;

/** Reads `?year=&month=`, defaulting to the current month. */
export function useFieldPeriod() {
  const searchParams = useSearchParams();
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  return { year, month };
}

/** Month picker for the field performance pages. Writes `?year=&month=`. */
export function FieldPeriodFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { year, month } = useFieldPeriod();

  // Next month first, so targets can be set before the month starts.
  const options = useMemo(() => {
    const now = new Date();
    return Array.from({ length: HISTORY_LENGTH + 1 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + 1 - i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1, next: i === 0 };
    });
  }, []);

  const handleChange = (value: string) => {
    const [y, m] = value.split("-").map(Number);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    params.set("month", String(m));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={`${year}-${month}`} onValueChange={handleChange}>
      <SelectTrigger className="w-fit min-w-44 bg-white" aria-label="Month">
        <SelectValue placeholder="Select month" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
            {formatPeriod(o.year, o.month)}
            {o.next && <span className="ml-1.5 text-xs text-muted-foreground">· next month</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
