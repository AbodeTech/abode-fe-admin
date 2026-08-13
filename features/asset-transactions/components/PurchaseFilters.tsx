"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PURCHASE_STATUSES,
  PURCHASE_STATUS_LABELS,
  SALES_TYPES,
  SALES_TYPE_LABELS,
} from "../schemas/purchase.schema";

const STATUS_OPTIONS = PURCHASE_STATUSES.map((status) => ({
  label: PURCHASE_STATUS_LABELS[status],
  value: status,
}));

const SALES_TYPE_OPTIONS = SALES_TYPES.map((type) => ({
  label: SALES_TYPE_LABELS[type],
  value: type,
}));

const ASSET_TYPE_OPTIONS = ASSET_TYPES.map((type) => ({
  label: ASSET_TYPE_LABELS[type],
  value: type,
}));

/**
 * `system` is omitted: it marks internally-generated rows, not something an
 * admin filters a purchase queue by.
 */
const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.filter((method) => method !== "system").map(
  (method) => ({ label: PAYMENT_METHOD_LABELS[method], value: method })
);

/**
 * The full filter row, all of it live as of ticket 24d.
 *
 * Search is the odd one out: it matches the **asset's name or location, or the
 * payer** — the only search in this app that crosses into another collection.
 * The placeholder says both halves so an empty result isn't read as "no such
 * property" when the admin actually typed a buyer's name, or vice versa.
 */
export function PurchaseFilters() {
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
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debounced, urlSearch, router, searchParams]);

  return (
    <div className="space-y-3">
      <div className="relative min-w-0 max-w-2xl">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="pl-9 pr-9"
          placeholder="Search by property name or location, or by buyer"
          aria-label="Search asset transactions"
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All statuses" />
        <FilterSelect
          data={SALES_TYPE_OPTIONS}
          queryKey="sales_type"
          placeholder="All sales types"
        />
        <FilterSelect
          data={PAYMENT_METHOD_OPTIONS}
          queryKey="payment_method"
          placeholder="All payment methods"
        />
        <FilterSelect
          data={ASSET_TYPE_OPTIONS}
          queryKey="asset_type"
          placeholder="All asset types"
        />
        <DateFilter />
      </div>
    </div>
  );
}
