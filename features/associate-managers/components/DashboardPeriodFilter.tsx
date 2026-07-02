"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PresetPeriod = "week" | "month" | "year";
type QuickRange = "all" | "7days" | "14days" | "28days";
type FilterValue = PresetPeriod | QuickRange | "custom";

const LABELS: Record<FilterValue, string> = {
  all: "All time",
  week: "This week",
  month: "This month",
  year: "This year",
  "7days": "Last 7 days",
  "14days": "Last 14 days",
  "28days": "Last 28 days",
  custom: "Custom range",
};

const QUICK_DAYS: Record<Extract<FilterValue, "7days" | "14days" | "28days">, number> = {
  "7days": 7,
  "14days": 14,
  "28days": 28,
};

interface Active {
  value: FilterValue;
  customRange?: { from: Date; to: Date };
}

const parseDate = (raw: string | null) => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Derive which option is currently active from the URL. Custom ranges are
 * fingerprinted against the rolling presets so "Last 7 days" stays selected
 * when the URL shows the equivalent start_date/end_date. */
const deriveActive = (searchParams: URLSearchParams): Active => {
  const period = searchParams.get("period");
  const from = parseDate(searchParams.get("start_date"));
  const to = parseDate(searchParams.get("end_date"));

  if (from && to) {
    const today = new Date();
    const days = Math.round(
      (today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 7) return { value: "7days", customRange: { from, to } };
    if (days === 14) return { value: "14days", customRange: { from, to } };
    if (days === 28) return { value: "28days", customRange: { from, to } };
    return { value: "custom", customRange: { from, to } };
  }

  if (period === "week" || period === "year") return { value: period };
  if (period === "month") return { value: "month" };
  // Historical default was "This month" — preserve so filters read predictably.
  return { value: "month" };
};

const rangeLabel = (from: Date, to: Date) =>
  `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;

export function DashboardPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = useMemo(() => deriveActive(searchParams), [searchParams]);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<
    { from: Date; to: Date } | undefined
  >(active.customRange);
  const shouldAutoOpenCalendar = useRef(false);

  // Keep the draft range synced when the URL changes externally (e.g. back nav).
  useEffect(() => {
    setDraftRange(active.customRange);
  }, [active.customRange]);

  // If the user just picked "Custom range…" from the select, open the calendar
  // right away — otherwise they'd have to hunt for the extra trigger.
  useEffect(() => {
    if (shouldAutoOpenCalendar.current && active.value === "custom") {
      setIsCalendarOpen(true);
      shouldAutoOpenCalendar.current = false;
    }
  }, [active.value]);

  const write = (params: URLSearchParams) => {
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearAll = (params: URLSearchParams) => {
    params.delete("period");
    params.delete("start_date");
    params.delete("end_date");
  };

  const handleSelect = (raw: string) => {
    const value = raw as FilterValue;
    const params = new URLSearchParams(searchParams.toString());
    clearAll(params);

    if (value === "all") {
      write(params);
      return;
    }
    if (value === "week" || value === "month" || value === "year") {
      params.set("period", value);
      write(params);
      return;
    }
    if (value === "7days" || value === "14days" || value === "28days") {
      const days = QUICK_DAYS[value];
      params.set("start_date", format(subDays(new Date(), days), "yyyy-MM-dd"));
      params.set("end_date", format(new Date(), "yyyy-MM-dd"));
      write(params);
      return;
    }
    // custom → keep URL as-is until the user picks concrete dates, but
    // flag the picker so the calendar opens next render.
    shouldAutoOpenCalendar.current = true;
    // Force a re-derive by writing an explicit "start_date"/"end_date" only when
    // the user actually picks dates below. For now, transition into custom UI:
    // we do that by writing a placeholder so the value reflects "custom".
    // But we don't want to lie about the URL — instead, just open the calendar
    // and let apply() handle the URL change.
    setIsCalendarOpen(true);
  };

  const applyCustomRange = (range: { from: Date; to: Date }) => {
    const params = new URLSearchParams(searchParams.toString());
    clearAll(params);
    params.set("start_date", format(range.from, "yyyy-MM-dd"));
    params.set("end_date", format(range.to, "yyyy-MM-dd"));
    write(params);
    setIsCalendarOpen(false);
  };

  const triggerLabel =
    active.value === "custom" && active.customRange
      ? rangeLabel(active.customRange.from, active.customRange.to)
      : LABELS[active.value];

  return (
    <div className="inline-flex items-center gap-2">
      <Select value={active.value} onValueChange={handleSelect}>
        <SelectTrigger className="h-10 w-fit min-w-44 bg-white">
          <SelectValue>
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              {triggerLabel}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Period</SelectLabel>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Rolling</SelectLabel>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="14days">Last 14 days</SelectItem>
            <SelectItem value="28days">Last 28 days</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="custom">Custom range…</SelectItem>
        </SelectContent>
      </Select>

      {/* The calendar sits behind an invisible trigger — the Select opens it
          automatically when the user picks "Custom range…". Users viewing a
          custom range can click "Change" to reopen and edit. */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-10 bg-white",
              active.value !== "custom" && "hidden"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Change dates
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-1.5rem,36rem)] max-w-[calc(100vw-1.5rem)] p-0 sm:w-auto"
          align="start"
          sideOffset={4}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={draftRange?.from ?? new Date()}
            selected={draftRange}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDraftRange({ from: range.from, to: range.to });
                applyCustomRange({ from: range.from, to: range.to });
              } else {
                setDraftRange(range as { from: Date; to: Date } | undefined);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
