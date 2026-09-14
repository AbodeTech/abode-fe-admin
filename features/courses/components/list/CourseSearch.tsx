"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function CourseSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("search") ?? "");
  const debounced = useDebounce(value, 400);

  const current = searchParams.get("search") ?? "";

  useEffect(() => {
    if (debounced === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("search", debounced);
    else params.delete("search");
    params.set("page", "1");

    router.push(`?${params.toString()}`, { scroll: false });
  }, [debounced, current, router, searchParams]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-9"
        placeholder="Search courses"
        aria-label="Search courses"
      />
    </div>
  );
}
