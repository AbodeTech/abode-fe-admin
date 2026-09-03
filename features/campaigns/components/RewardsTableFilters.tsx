"use client";

import { FilterSelect } from "@/components/shared/FilterSelect";

export function RewardsTableFilters() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <FilterSelect
        data={[
          { label: "Buyer", value: "buyer" },
          { label: "Referrer", value: "referrer" },
        ]}
        queryKey="role"
        placeholder="All roles"
      />
      <FilterSelect
        data={[
          { label: "Active", value: "true" },
          { label: "Invalidated", value: "false" },
        ]}
        queryKey="is_active"
        placeholder="Any status"
      />
    </div>
  );
}
