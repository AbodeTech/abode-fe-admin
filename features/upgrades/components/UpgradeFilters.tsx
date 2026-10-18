"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import {
  UPGRADE_PAYMENT_METHODS,
  UPGRADE_PAYMENT_METHOD_LABELS,
  UPGRADE_STATUSES,
  UPGRADE_STATUS_LABELS,
  UPGRADE_TARGET_TIERS,
  USER_TIER_LABELS,
} from "../schemas/upgrade.schema";

const STATUS_OPTIONS = UPGRADE_STATUSES.map((status) => ({
  label: UPGRADE_STATUS_LABELS[status],
  value: status,
}));

const METHOD_OPTIONS = UPGRADE_PAYMENT_METHODS.map((method) => ({
  label: UPGRADE_PAYMENT_METHOD_LABELS[method],
  value: method,
}));

const TIER_OPTIONS = UPGRADE_TARGET_TIERS.map((tier) => ({
  label: USER_TIER_LABELS[tier],
  value: tier,
}));

/**
 * Search is server-side and matches the **applicant** only — name, email or
 * username (`findUserIdsBySearch`). The placeholder says so, because a referrer
 * name typed here returns an empty queue, and an unlabelled empty result reads
 * as "that person has no upgrades" rather than "wrong field".
 */
export function UpgradeFilters() {
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
      <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All statuses" />
      <FilterSelect data={METHOD_OPTIONS} queryKey="payment_method" placeholder="All methods" />
      <FilterSelect data={TIER_OPTIONS} queryKey="to_tier" placeholder="All tiers" />

      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9 pr-9"
          placeholder="Search applicant name, email or username"
          aria-label="Search applicants"
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
