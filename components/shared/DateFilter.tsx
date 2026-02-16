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
    router.push(`?${params.toString()}`);
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
    <div className="flex items-center gap-2">
      <Select value={selectedOption} onValueChange={handleOptionChange}>
        <SelectTrigger className="w-fit min-w-[120px] bg-white">
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
                "justify-start text-left font-normal bg-white",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
