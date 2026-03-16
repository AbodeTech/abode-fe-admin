"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { useMemo } from "react";

interface Asset {
  _id: string;
  asset_name: string;
  asset_location: string;
  asset_type: string;
}

const MOCK_ASSETS: Asset[] = [
  { _id: "1", asset_name: "Abode Heights Ph I", asset_location: "Epe, Lagos", asset_type: "Flex" },
  { _id: "2", asset_name: "Greenfield Estate", asset_location: "Ibeju-Lekki", asset_type: "Full Ownership" },
  { _id: "3", asset_name: "The Vantage Flex", asset_location: "Lekki Ph 1", asset_type: "Flex" },
  { _id: "4", asset_name: "Epe Heritage Gardens", asset_location: "Epe, Lagos", asset_type: "Flex" },
  { _id: "5", asset_name: "Lekki Pride", asset_location: "Lekki Ph 1", asset_type: "Full Ownership" },
];

export function AnalyticsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const assets = MOCK_ASSETS;
  const isLoading = false;

  const currentAssetType = searchParams.get("assetType") || "all";
  const currentLocation = searchParams.get("location") || "all";
  const currentAssetName = searchParams.get("assetName") || "all";

  const filteredByAssetType = useMemo(() => {
    if (!currentAssetType || currentAssetType === "all") return assets;
    return assets.filter((a) => a?.asset_type === currentAssetType);
  }, [assets, currentAssetType]);

  const uniqueLocations = useMemo(() => {
    const locations = filteredByAssetType
      .map((a) => a?.asset_location)
      .filter((loc): loc is string => !!loc);
    return ["all", ...Array.from(new Set(locations))];
  }, [filteredByAssetType]);

  const filteredByLocation = useMemo(() => {
    if (!currentLocation || currentLocation === "all") return filteredByAssetType;
    return filteredByAssetType.filter((a) => a?.asset_location === currentLocation);
  }, [filteredByAssetType, currentLocation]);

  const uniqueAssetNames = useMemo(() => {
    const names = filteredByLocation
      .map((a) => a?.asset_name)
      .filter((name): name is string => !!name);
    return ["all", ...Array.from(new Set(names))];
  }, [filteredByLocation]);

const updateFilters = (key: string, value: string) => {
    // This is now purely for design demonstration
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-20 flex w-full flex-col gap-4 border-b bg-background/95 pb-4 pt-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-4 px-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Type</span>
          <FilterSelect
            data={[
              { label: "All Types", value: "all" },
              { label: "Flex", value: "Flex" },
              { label: "Full Ownership", value: "Full Ownership" },
            ]}
            queryKey="assetType"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</span>
          <FilterSelect
            data={uniqueLocations.map((loc) => ({
              label: loc === "all" ? "All Locations" : loc,
              value: loc,
            }))}
            queryKey="location"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Name</span>
          <FilterSelect
            data={uniqueAssetNames.map((name) => ({
              label: name === "all" ? "All Assets" : name,
              value: name,
            }))}
            queryKey="assetName"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time Period</span>
          <DateFilter />
        </div>
      </div>
    </div>
  );
}
