"use client";

import { FilterSelect } from "@/components/shared/FilterSelect";

const SUSPENDED_OPTIONS = [
  { label: "Active", value: "false" },
  { label: "Suspended", value: "true" },
];

export function CommercialPlansFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect
        data={SUSPENDED_OPTIONS}
        queryKey="suspended"
        placeholder="All plans"
      />
    </div>
  );
}
