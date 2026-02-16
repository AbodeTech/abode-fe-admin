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

export function FilterSelect({ data, queryKey, placeholder }: FilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("all");

  useEffect(() => {
    const filterValue = searchParams.get(queryKey);
    setValue(filterValue || "all");
  }, [queryKey, searchParams]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    const params = new URLSearchParams(searchParams.toString());

    if (newValue === "all") {
      params.delete(queryKey);
    } else {
      params.set(queryKey, newValue);
    }

    // Reset to page 1 when filter changes
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-fit min-w-[140px] bg-white">
        <SelectValue placeholder={placeholder || "Select"} />
      </SelectTrigger>
      <SelectContent>
        {data.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
