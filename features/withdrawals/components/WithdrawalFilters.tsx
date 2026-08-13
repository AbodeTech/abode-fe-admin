"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import {
  ADMIN_STATUSES,
  ADMIN_STATUS_LABELS,
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABELS,
} from "../schemas/withdrawal.schema";

const STATUS_OPTIONS = ADMIN_STATUSES.map((status) => ({
  label: ADMIN_STATUS_LABELS[status],
  value: status,
}));

const PROVIDER_OPTIONS = PAYMENT_PROVIDERS.map((provider) => ({
  label: PAYMENT_PROVIDER_LABELS[provider],
  value: provider,
}));

/**
 * Search is server-side and matches the **requester** — name, email or
 * username. It does not reach the destination account name, so the placeholder
 * says whose details it looks at: an admin hunting a suspicious payout account
 * would otherwise read an empty result as "no such account".
 */
export function WithdrawalFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const [value, setValue] = useState(urlSearch);
  const debounced = useDebounce(value.trim(), 400);

  useEffect(() => {
    if (debounced === urlSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debounced) {
      params.set("search", debounced);
    } else {
      params.delete("search");
    }
    // A new search invalidates the page you were on.
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debounced, urlSearch, router, searchParams]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect data={STATUS_OPTIONS} queryKey="admin_status" placeholder="All statuses" />
      <FilterSelect
        data={PROVIDER_OPTIONS}
        queryKey="payment_provider"
        placeholder="All providers"
      />

      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9 pr-9"
          placeholder="Search requester name, email or username"
          aria-label="Search requesters"
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
