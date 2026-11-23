"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import { REFUND_PAYOUT_STATUSES, REFUND_PAYOUT_STATUS_LABELS } from "../schemas/refund-payout.schema";

const STATUS_OPTIONS = REFUND_PAYOUT_STATUSES.map((status) => ({
  label: REFUND_PAYOUT_STATUS_LABELS[status],
  value: status,
}));

/** Status and search live in the URL, as on Withdrawals. */
export function RefundPayoutFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(urlSearch);
  const debounced = useDebounce(value.trim(), 400);

  useEffect(() => {
    if (debounced === urlSearch) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("search", debounced);
    else params.delete("search");
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debounced, urlSearch, router, searchParams]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All statuses" />
      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9 pr-9"
          placeholder="Search customer, estate or reference"
          aria-label="Search refunds"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setValue("")}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
