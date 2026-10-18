"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface FilterSelectProps {
  data: { label: string; value: string }[];
  queryKey: string;
  placeholder?: string;
}

/**
 * Radix's `Select` looks up the current `value` against its registered
 * `SelectItem`s to know what to display, and only falls back to `placeholder`
 * when `value` is empty. This component's reset state is the sentinel
 * `"all"` — until now, callers that didn't supply their own `data` item with
 * `value: "all"` had nothing for that lookup to find, so the trigger rendered
 * blank (not the placeholder) on first load and after every "back to
 * unfiltered" action, with no way to pick that state deliberately from the
 * dropdown either.
 *
 * Some existing callers already work around this by putting their own
 * `{ value: "all", ... }` entry in `data` — that's still honoured verbatim
 * (see `OverrideFilters`'s scope toggle, which gives "all" a real label of its
 * own). This only fills the gap when nothing already claims it.
 */
const ALL_VALUE = "all";

export function FilterSelect({ data, queryKey, placeholder }: FilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(ALL_VALUE);

  useEffect(() => {
    const filterValue = searchParams.get(queryKey);
    setValue(filterValue || ALL_VALUE);
  }, [queryKey, searchParams]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    const params = new URLSearchParams(searchParams.toString());

    if (newValue === ALL_VALUE) {
      params.delete(queryKey);
    } else {
      params.set(queryKey, newValue);
    }

    // Reset to page 1 when filter changes
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const allLabel = placeholder || "All";
  const hasOwnAllItem = data.some((item) => item.value === ALL_VALUE);

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-full min-w-0 bg-white sm:h-9 sm:w-fit sm:min-w-40">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        {!hasOwnAllItem && <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>}
        {data.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
