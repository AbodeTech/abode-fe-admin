"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format, isSameDay, subDays, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DateOption = "all" | "7days" | "2weeks" | "4weeks" | "custom";

const determineInitialOption = (from: Date | null, to: Date | null): DateOption => {
  if (!from || !to) return "all";

  const today = new Date();
  const differenceInDays = Math.round((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  if (differenceInDays >= 6 && differenceInDays <= 8 && isSameDay(today, to)) return "7days";
  if (differenceInDays >= 13 && differenceInDays <= 15 && isSameDay(today, to)) return "2weeks";
  if (differenceInDays >= 27 && differenceInDays <= 29 && isSameDay(today, to)) return "4weeks";

  return "custom";
};

export function AllocationBoughtDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateRange = useMemo(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    return {
      from: start ? new Date(start) : null,
      to: end ? new Date(end) : null,
    };
  }, [searchParams]);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const selectedOption = determineInitialOption(dateRange.from, dateRange.to);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrowScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.set("page", "1");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleOptionChange = (value: DateOption) => {
    const today = new Date();

    switch (value) {
      case "7days":
        setIsCalendarOpen(false);
        updateParams({
          startDate: subDays(today, 7).toISOString(),
          endDate: today.toISOString(),
        });
        break;
      case "2weeks":
        setIsCalendarOpen(false);
        updateParams({
          startDate: subWeeks(today, 2).toISOString(),
          endDate: today.toISOString(),
        });
        break;
      case "4weeks":
        setIsCalendarOpen(false);
        updateParams({
          startDate: subWeeks(today, 4).toISOString(),
          endDate: today.toISOString(),
        });
        break;
      case "custom":
        setIsCalendarOpen(true);
        break;
      default:
        setIsCalendarOpen(false);
        updateParams({ startDate: null, endDate: null });
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      updateParams({
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
      });
      setIsCalendarOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return "All time";
    if (isSameDay(dateRange.from, dateRange.to)) return format(dateRange.from, "MMM d, yyyy");
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  };

  return (
    <div className="min-w-0 space-y-2">
      <Label className="text-sm text-muted-foreground">Bought date</Label>
      <Select value={selectedOption} onValueChange={handleOptionChange}>
        <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Time range</SelectLabel>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="2weeks">Last 2 weeks</SelectItem>
            <SelectItem value="4weeks">Last 4 weeks</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {(selectedOption === "custom" || isCalendarOpen) && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-auto min-h-10 w-full justify-start px-3 py-2 text-left text-sm font-normal leading-snug sm:h-9 sm:min-h-0 sm:py-2",
                !dateRange.from || !dateRange.to ? "text-muted-foreground" : ""
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="min-w-0 wrap-break-word">{formatDateRange()}</span>
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
              defaultMonth={dateRange.from ?? new Date()}
              selected={{ from: dateRange.from ?? undefined, to: dateRange.to ?? undefined }}
              onSelect={handleCalendarSelect}
              numberOfMonths={isNarrowScreen ? 1 : 2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
