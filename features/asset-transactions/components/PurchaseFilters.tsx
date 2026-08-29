"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/use-debounce";

import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  SALES_TYPES,
  SALES_TYPE_LABELS,
} from "../schemas/purchase.schema";

const STATUS_OPTIONS = [
  { label: "All Transactions Status", value: "all" },
  { label: "Approved", value: "completed" },
  { label: "Rejected", value: "failed" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Cancelled", value: "cancelled" },
];

const SALES_TYPE_OPTIONS = [
  { label: "All Sales Type", value: "all" },
  ...SALES_TYPES.filter((type) => type !== "dp").map((type) => ({
    label: type === "ap" ? "Asset Purchase" : SALES_TYPE_LABELS[type],
    value: type,
  })),
  { label: "Document fee", value: "dp" },
];

const ASSET_TYPE_OPTIONS = [
  { label: "All Asset Type", value: "all" },
  ...ASSET_TYPES.map((type) => ({
    label: type === "full-ownership" ? "Full-Ownership" : ASSET_TYPE_LABELS[type],
    value: type,
  })),
];

const PAYMENT_METHOD_OPTIONS = [
  { label: "All Transactions Type", value: "all" },
  { label: "Transfer", value: "transfer" },
  { label: "Wallet", value: "wallet" },
  { label: "Paystack", value: "paystack" },
];

export function PurchaseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") ?? "";

  const [value, setValue] = useState(urlSearch);
  const debounced = useDebounce(value.trim(), 500);

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
    <div className="space-y-4 mt-20">
      <div className="relative min-w-0 max-w-2xl bg-white">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for asset by name, location..."
          className="h-11 bg-white pl-8"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label="Search asset transactions"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <FilterSelect data={SALES_TYPE_OPTIONS} queryKey="sales_type" placeholder="All Sales Type" />
        <FilterSelect data={STATUS_OPTIONS} queryKey="status" placeholder="All Transactions Status" />
        <FilterSelect
          data={PAYMENT_METHOD_OPTIONS}
          queryKey="payment_method"
          placeholder="All Transactions Type"
        />
        <FilterSelect data={ASSET_TYPE_OPTIONS} queryKey="asset_type" placeholder="All Asset Type" />
        <DateFilter />
      </div>
    </div>
  );
}
