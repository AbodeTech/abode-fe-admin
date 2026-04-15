"use client";

import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useSalesAssetBreakdown, type SalesAnalyticsFilters } from "@/features/analytics";

interface AnalyticsFiltersProps {
  filters: SalesAnalyticsFilters;
}

const ASSET_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Flex", value: "flex" },
  { label: "Full Ownership", value: "full-ownership" },
];

export function AnalyticsFilters({ filters }: AnalyticsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data } = useSalesAssetBreakdown({
    startDate: filters.startDate,
    endDate: filters.endDate,
    assetType: filters.assetType,
    location: null,
  });

  const locationOptions = useMemo(() => {
    const set = new Set<string>();

    (data || []).forEach((entry) => {
      if (entry?.location) set.add(entry.location);
    });

    return [
      { label: "All Locations", value: "all" },
      ...Array.from(set).sort((a, b) => a.localeCompare(b)).map((location) => ({
        label: location,
        value: location,
      })),
    ];
  }, [data]);

  useEffect(() => {
    if (!filters.location || filters.location === "all") return;

    const isLocationAvailable = locationOptions.some(
      (option) => option.value === filters.location
    );

    if (!isLocationAvailable) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("location");
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [filters.location, locationOptions, pathname, router, searchParams]);

  return (
    <div className="sticky top-0 z-20 flex w-full flex-col gap-4 border-b bg-background/95 pb-4 pt-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-4 px-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Type</span>
          <FilterSelect data={ASSET_TYPE_OPTIONS} queryKey="assetType" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</span>
          <FilterSelect data={locationOptions} queryKey="location" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Period</span>
          <DateFilter />
        </div>
      </div>
    </div>
  );
}
