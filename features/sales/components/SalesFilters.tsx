"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { SALES_ASSET_TYPES, SALES_PLAN_STATUSES, SALES_SOURCE_TYPES } from "../schemas/sales.schema";

const ASSET_TYPE_OPTIONS = SALES_ASSET_TYPES.map((value) => ({
  label: value === "developer_plot" ? "Developer plot" : value,
  value,
}));

const PLAN_STATUS_OPTIONS = SALES_PLAN_STATUSES.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

const SOURCE_TYPE_OPTIONS = SALES_SOURCE_TYPES.map((value) => ({
  label: value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
  value,
}));

export function SalesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentSearch = searchParams.get("q") || "";

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = searchInputRef.current?.value?.trim() || "";
    if (nextSearch) params.set("q", nextSearch);
    else params.delete("q");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex w-full min-w-0 max-w-full gap-2 sm:max-w-md">
        <Input
          ref={searchInputRef}
          key={currentSearch}
          defaultValue={currentSearch}
          placeholder="Search buyer, asset, referrer…"
          className="min-w-0"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button type="button" onClick={handleSearch} size="icon" className="shrink-0">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <FilterSelect data={ASSET_TYPE_OPTIONS} queryKey="assettype" placeholder="Asset type" />
        <FilterSelect data={PLAN_STATUS_OPTIONS} queryKey="status" placeholder="Plan status" />
        <FilterSelect data={SOURCE_TYPE_OPTIONS} queryKey="source" placeholder="Source" />
        <div className="w-full min-w-0 sm:w-auto">
          <DateFilter />
        </div>
      </div>
    </div>
  );
}
