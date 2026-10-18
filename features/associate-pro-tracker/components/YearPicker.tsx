"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useYearsList } from "../hooks/use-years-list";

/**
 * The page's primary axis, held in the URL as `?year=` so a link can be shared
 * and a refresh keeps the selection.
 */
export function YearPicker({ year }: { year: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useYearsList();

  if (isLoading) return <Skeleton className="h-9 w-32" />;

  // The BE always includes the current year, so this only fires if the whole
  // request failed — in which case the selected year is still worth showing.
  const years = data?.years?.length ? data.years : [year];

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={String(year)} onValueChange={handleChange}>
      <SelectTrigger className="w-36 bg-white" aria-label="Year">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
            {option === data?.current_year ? " (current)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
