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
import { CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { format, subDays, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

type DateOption = "all" | "7days" | "2weeks" | "4weeks" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initializeFromURL = () => {
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (startDate && endDate) {
      const from = new Date(startDate);
      const to = new Date(endDate);
      const today = new Date();
      const daysDiff = Math.round((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      let option: DateOption = "custom";
      if (daysDiff === 7) option = "7days";
      else if (daysDiff === 14) option = "2weeks";
      else if (daysDiff === 28) option = "4weeks";

      return { option, range: { from, to } };
    }

    return {
      option: "all" as DateOption,
      range: { from: subDays(new Date(), 7), to: new Date() },
    };
  };

  const { option: initialOption, range: initialRange } = initializeFromURL();
  const [selectedOption, setSelectedOption] = useState<DateOption>(initialOption);
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrowScreen(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const updateURL = (from: Date | null, to: Date | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (from && to) {
      params.set("start_date", from.toISOString().split("T")[0]);
      params.set("end_date", to.toISOString().split("T")[0]);
    } else {
      params.delete("start_date");
      params.delete("end_date");
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOptionChange = (value: DateOption) => {
    setSelectedOption(value);
    const today = new Date();

    switch (value) {
      case "7days": {
        const from = subDays(today, 7);
        setDateRange({ from, to: today });
        updateURL(from, today);
        break;
      }
      case "2weeks": {
        const from = subWeeks(today, 2);
        setDateRange({ from, to: today });
        updateURL(from, today);
        break;
      }
      case "4weeks": {
        const from = subWeeks(today, 4);
        setDateRange({ from, to: today });
        updateURL(from, today);
        break;
      }
      case "custom":
        setIsCalendarOpen(true);
        break;
      default:
        updateURL(null, null);
    }
  };

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

      {selectedOption === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-auto min-h-10 w-full justify-start whitespace-normal px-3 py-2 text-left text-sm font-normal leading-snug sm:h-9 sm:min-h-0 sm:w-fit sm:whitespace-nowrap sm:py-2 bg-white",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="min-w-0 wrap-break-word">
                {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-1.5rem,36rem)] max-w-[calc(100vw-1.5rem)] p-0 sm:w-auto" align="start" sideOffset={4}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ from: range.from, to: range.to });
                  updateURL(range.from, range.to);
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={isNarrowScreen ? 1 : 2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
