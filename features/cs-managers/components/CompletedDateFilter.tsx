"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** URL params the CS page owns for the payment completed range (`YYYY-MM-DD`). */
export const COMPLETED_FROM_PARAM = "completed_from";
export const COMPLETED_TO_PARAM = "completed_to";

const parseDay = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * "Payment completed" range for the CS plans table. Picks whole days and writes
 * them to the URL; one click then closing the calendar takes that single day.
 */
export function CompletedDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get(COMPLETED_FROM_PARAM);
  const to = searchParams.get(COMPLETED_TO_PARAM);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  const push = (nextFrom: Date | null, nextTo: Date | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextFrom && nextTo) {
      params.set(COMPLETED_FROM_PARAM, format(nextFrom, "yyyy-MM-dd"));
      params.set(COMPLETED_TO_PARAM, format(nextTo, "yyyy-MM-dd"));
    } else {
      params.delete(COMPLETED_FROM_PARAM);
      params.delete(COMPLETED_TO_PARAM);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelect = (range: DateRange | undefined) => {
    setDraft(range);
    if (range?.from && range?.to) {
      push(range.from, range.to);
      setDraft(undefined);
      setOpen(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && draft?.from && !draft.to) push(draft.from, draft.from);
    if (!next) setDraft(undefined);
    setOpen(next);
  };

  const label =
    from && to
      ? from === to
        ? format(parseDay(from), "MMM d, yyyy")
        : `${format(parseDay(from), "MMM d")} – ${format(parseDay(to), "MMM d, yyyy")}`
      : "Any date";

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 gap-1.5 bg-white text-xs font-normal", !(from && to) && "text-gray-600")}
            aria-label="Filter by payment completed date"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="text-gray-500">Payment completed:</span>
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" sideOffset={4} collisionPadding={12}>
          <Calendar
            mode="range"
            min={1}
            defaultMonth={from ? parseDay(from) : new Date()}
            selected={draft ?? (from && to ? { from: parseDay(from), to: parseDay(to) } : undefined)}
            onSelect={handleSelect}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      {from && to && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Clear payment completed date"
          onClick={() => push(null, null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
