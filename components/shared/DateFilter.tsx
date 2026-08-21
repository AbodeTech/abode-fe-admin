"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { format, isSameDay, startOfDay, subDays, subWeeks } from "date-fns";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type DateOption = "all" | "7days" | "2weeks" | "4weeks" | "custom";

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function presetBounds(option: Exclude<DateOption, "all" | "custom">): DateRange {
  const to = startOfDay(new Date());
  const from =
    option === "7days"
      ? subDays(to, 7)
      : option === "2weeks"
        ? subWeeks(to, 2)
        : subWeeks(to, 4);
  return { from: startOfDay(from), to };
}

function matchPreset(from: Date, to: Date): DateOption {
  const today = startOfDay(new Date());
  if (!isSameDay(to, today)) return "custom";

  for (const option of ["7days", "2weeks", "4weeks"] as const) {
    const preset = presetBounds(option);
    if (preset.from && isSameDay(from, preset.from)) return option;
  }
  return "custom";
}

function subscribeNarrowScreen(onChange: () => void) {
  const mq = window.matchMedia("(max-width: 640px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getNarrowScreenSnapshot() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function getNarrowScreenServerSnapshot() {
  return false;
}

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startDateParam = searchParams.get("start_date");
  const endDateParam = searchParams.get("end_date");

  const appliedRange = useMemo(() => {
    if (!startDateParam || !endDateParam) return undefined;
    return {
      from: parseLocalDate(startDateParam),
      to: parseLocalDate(endDateParam),
    };
  }, [startDateParam, endDateParam]);

  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  /** Keeps the range picker visible only after "Custom range" is chosen. */
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const isNarrowScreen = useSyncExternalStore(
    subscribeNarrowScreen,
    getNarrowScreenSnapshot,
    getNarrowScreenServerSnapshot
  );

  const urlOption: DateOption =
    appliedRange?.from && appliedRange?.to
      ? matchPreset(appliedRange.from, appliedRange.to)
      : "all";

  const selectedOption: DateOption = showCustomPicker || isCalendarOpen ? "custom" : urlOption;

  const updateURL = (from: Date | null, to: Date | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (from && to) {
      params.set("start_date", formatLocalDate(from));
      params.set("end_date", formatLocalDate(to));
    } else {
      params.delete("start_date");
      params.delete("end_date");
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const openCalendar = () => {
    setShowCustomPicker(true);
    setDraftRange(undefined);
    setIsCalendarOpen(true);
  };

  const handleReset = () => {
    setDraftRange(undefined);
    setIsCalendarOpen(false);
    setShowCustomPicker(false);
    updateURL(null, null);
  };

  const handleOptionChange = (value: DateOption) => {
    switch (value) {
      case "7days":
      case "2weeks":
      case "4weeks": {
        const range = presetBounds(value);
        setDraftRange(undefined);
        setIsCalendarOpen(false);
        setShowCustomPicker(false);
        if (range.from && range.to) updateURL(range.from, range.to);
        break;
      }
      case "custom":
        openCalendar();
        break;
      default:
        handleReset();
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDraftRange(range);
    if (range?.from && range?.to) {
      updateURL(startOfDay(range.from), startOfDay(range.to));
      setIsCalendarOpen(false);
      setDraftRange(undefined);
      setShowCustomPicker(true);
    }
  };

  const hasCompleteRange = Boolean(appliedRange?.from && appliedRange?.to);
  const showRangeControls = showCustomPicker || isCalendarOpen || urlOption === "custom";

  const rangeLabel =
    isCalendarOpen && draftRange?.from && !draftRange?.to
      ? `${format(draftRange.from, "MMM d")} – Pick end date`
      : appliedRange?.from && appliedRange?.to && urlOption === "custom"
        ? `${format(appliedRange.from, "MMM d")} – ${format(appliedRange.to, "MMM d, yyyy")}`
        : "Pick start and end date";

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <Select value={selectedOption} onValueChange={handleOptionChange}>
        <SelectTrigger className="h-10 w-full min-w-0 bg-white sm:h-9 sm:w-fit sm:min-w-[120px]">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Time Range</SelectLabel>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="2weeks">Last 2 weeks</SelectItem>
            <SelectItem value="4weeks">Last 4 weeks</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {showRangeControls && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Popover
            open={isCalendarOpen}
            onOpenChange={(open) => (open ? openCalendar() : setIsCalendarOpen(false))}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-auto min-h-10 w-full justify-start whitespace-normal px-3 py-2 text-left text-sm font-normal leading-snug sm:h-9 sm:min-h-0 sm:w-fit sm:whitespace-nowrap sm:py-2 bg-white",
                  !hasCompleteRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="min-w-0 wrap-break-word">{rangeLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[min(100vw-1.5rem,20.5rem)] max-w-[calc(100vw-1.5rem)] overflow-x-hidden p-0 sm:w-auto sm:max-w-none"
              align="center"
              side="bottom"
              sideOffset={8}
              collisionPadding={12}
            >
              <Calendar
                className="mx-auto"
                initialFocus
                mode="range"
                min={1}
                defaultMonth={new Date()}
                selected={draftRange}
                onSelect={handleRangeSelect}
                numberOfMonths={isNarrowScreen ? 1 : 2}
              />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-full gap-1.5 sm:h-9 sm:w-auto"
            onClick={handleReset}
          >
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
