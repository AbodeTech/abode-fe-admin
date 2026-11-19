"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Period control for the manager dashboards: a month and a year, which is what
 * targets and the performance score are set against, plus a custom date range
 * for anyone who needs exact dates.
 *
 * URL: `?month=&year=` for a month (no params = the current month), or
 * `?start_date=&end_date=` (yyyy-MM-dd) for a custom range. Once the BE scores
 * longer periods (`manager_long_periods`), also `?period=year&year=` for a
 * whole year and `?period=all_time`.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** How many years back the Year select offers. Older months: use a custom range. */
const YEARS_BACK = 4;

type Active =
  | { kind: "month"; month: number; year: number }
  | { kind: "year"; year: number }
  | { kind: "all_time" }
  | { kind: "custom"; from: Date; to: Date };

/** yyyy-MM-dd as a local calendar date (new Date("yyyy-MM-dd") would be UTC midnight). */
const parseDay = (raw: string | null): Date | null => {
  const m = raw ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw) : null;
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
};

const deriveActive = (searchParams: URLSearchParams, now: Date): Active => {
  const from = parseDay(searchParams.get("start_date"));
  const to = parseDay(searchParams.get("end_date"));
  if (from && to) return { kind: "custom", from, to };

  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const period = searchParams.get("period");
  if (period === "all_time") return { kind: "all_time" };
  if (period === "year") {
    return { kind: "year", year: year > 1970 ? year : now.getFullYear() };
  }
  if (month >= 1 && month <= 12 && year > 1970) return { kind: "month", month, year };

  return { kind: "month", month: now.getMonth() + 1, year: now.getFullYear() };
};

const rangeLabel = (from: Date, to: Date) =>
  `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;

export function DashboardPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = useMemo(() => new Date(), []);
  const active = useMemo(() => deriveActive(searchParams, now), [searchParams, now]);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) => currentYear - i);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  // react-day-picker reports a complete range ({ from: day, to: day }) on the
  // very first click, so the filter counts the clicks itself: the first click
  // starts a range, the second finishes it.
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const writePeriod = (set: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["period", "start_date", "end_date", "month", "year"]) params.delete(key);
    set(params);
    // A new period is a new roster; a later page of the old one may not exist.
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const selectMonth = (month: number, year: number) => {
    // No future months: nothing has happened in them yet.
    const clamped = year === currentYear ? Math.min(month, currentMonth) : month;
    writePeriod((params) => {
      params.set("month", String(clamped));
      params.set("year", String(year));
    });
  };

  const selectYear = (year: number) =>
    writePeriod((params) => {
      params.set("period", "year");
      params.set("year", String(year));
    });

  const selectView = (view: string) => {
    if (view === "all_time") writePeriod((params) => params.set("period", "all_time"));
    else if (view === "year") selectYear(active.kind === "month" || active.kind === "year" ? active.year : currentYear);
    else selectMonth(currentMonth, active.kind === "year" ? active.year : currentYear);
  };

  // Picking either half while a custom range is showing starts from the current month.
  const shownMonth = active.kind === "month" ? active.month : currentMonth;
  const shownYear = active.kind === "month" || active.kind === "year" ? active.year : currentYear;

  const handleCalendarOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    setRangeStart(null);
    // Each open starts from the applied range, never a half-picked one.
    setDraftRange(active.kind === "custom" ? { from: active.from, to: active.to } : undefined);
  };

  const handleDayClick = (day: Date) => {
    if (!rangeStart) {
      setRangeStart(day);
      setDraftRange({ from: day, to: undefined });
      return;
    }
    const [from, to] = day < rangeStart ? [day, rangeStart] : [rangeStart, day];
    setRangeStart(null);
    setDraftRange({ from, to });
    writePeriod((params) => {
      params.set("start_date", format(from, "yyyy-MM-dd"));
      params.set("end_date", format(to, "yyyy-MM-dd"));
    });
    setIsCalendarOpen(false);
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <Select value={active.kind === "custom" ? "" : active.kind} onValueChange={selectView}>
        <SelectTrigger className="h-10 w-32 bg-white" aria-label="Period">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Whole year</SelectItem>
          <SelectItem value="all_time">All time</SelectItem>
        </SelectContent>
      </Select>

      {(active.kind === "month" || active.kind === "custom") && (
        <Select
          value={active.kind === "month" ? String(active.month) : ""}
          onValueChange={(value) => selectMonth(Number(value), shownYear)}
        >
          <SelectTrigger className="h-10 w-36 bg-white" aria-label="Month">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem
                key={name}
                value={String(i + 1)}
                disabled={shownYear === currentYear && i + 1 > currentMonth}
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {active.kind !== "all_time" && (
        <Select
          value={active.kind === "month" || active.kind === "year" ? String(active.year) : ""}
          onValueChange={(value) =>
            active.kind === "year" ? selectYear(Number(value)) : selectMonth(shownMonth, Number(value))
          }
        >
          <SelectTrigger className="h-10 w-24 bg-white" aria-label="Year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 bg-white",
              active.kind === "custom" &&
                "border-[#00695C] bg-[#E0F2F1] text-[#00695C] hover:bg-[#E0F2F1]"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {active.kind === "custom" ? rangeLabel(active.from, active.to) : "Custom range"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-1.5rem,36rem)] max-w-[calc(100vw-1.5rem)] p-0 sm:w-auto"
          align="end"
          sideOffset={4}
        >
          <Calendar
            initialFocus
            mode="range"
            // Last month and this one, and no paging into the future.
            defaultMonth={active.kind === "custom" ? active.from : subMonths(now, 1)}
            endMonth={now}
            selected={draftRange}
            onSelect={(_range, day) => handleDayClick(day)}
            disabled={{ after: now }}
            numberOfMonths={2}
          />
          <p className="border-t px-3 py-2 text-xs text-gray-500">
            {rangeStart
              ? `From ${format(rangeStart, "MMM d")} — now pick the end date`
              : "Pick the start date. Targets are set per month, so a month or a whole year compares against them."}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
