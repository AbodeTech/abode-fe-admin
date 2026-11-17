"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Search the commission ledger. The backend matches part of a name, a full
 * name or an email on either party — who earned it or who bought — plus asset
 * name and TIN. Debounced and kept in the URL (`q`) so a search is linkable
 * and the export can apply it too.
 */
export function CommissionSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("q") ?? "");
  const debounced = useDebounce(value.trim(), 400);

  const current = searchParams.get("q") ?? "";

  useEffect(() => {
    if (debounced === current) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("q", debounced);
    else params.delete("q");
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
        placeholder="Search name, email, asset or TIN"
        aria-label="Search commission transactions"
      />
    </div>
  );
}
