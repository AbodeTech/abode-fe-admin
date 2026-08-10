"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AllocationBoughtDateFilter } from "./AllocationBoughtDateFilter";

export const AllocationAssetOptionFragment = graphql(`
  fragment AllocationAssetOptionFragment on Asset {
    _id
    asset_name
    asset_type
    asset_option {
      size
    }
  }
`);

interface AllocationFiltersProps {
  assets?: (FragmentType<typeof AllocationAssetOptionFragment> | null)[] | null;
  search: string;
  percentage: string;
  assetName: string | null;
  allocationStatus: string;
  onSearchChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onAssetNameChange: (value: string | null) => void;
  onAllocationStatusChange: (value: string) => void;
}

const percentageFilters = [
  { label: "All percentages", value: "all" },
  { label: "0% - 25%", value: "0-25" },
  { label: "26% - 50%", value: "26-50" },
  { label: "51% - 75%", value: "51-75" },
  { label: "76% - 100%", value: "76-100" },
];

// Must match the BE whitelist in eligibleClientsForLand.
const allocationStatusFilters = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Allocated", value: "allocated" },
  { label: "Email sent", value: "email_sent" },
];

export function AllocationFilters({
  assets,
  search,
  percentage,
  assetName,
  allocationStatus,
  onSearchChange,
  onPercentageChange,
  onAssetNameChange,
  onAllocationStatusChange,
}: AllocationFiltersProps) {
  const safeAssets = (assets ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  const mappedAssets = safeAssets
    .map((asset) => getFragmentData(AllocationAssetOptionFragment, asset))
    .filter((asset) => (asset.asset_option?.length ?? 0) > 0);

  return (
    <section className="mt-2 grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-6">
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Filter by asset</Label>
        <Select
          value={assetName ?? "all"}
          onValueChange={(value) => onAssetNameChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assets</SelectItem>
            {mappedAssets.map((asset) => (
              <SelectItem key={asset._id} value={asset.asset_name ?? asset._id ?? ""}>
                {asset.asset_name}
                {asset.asset_type ? ` (${asset.asset_type})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Percentage paid</Label>
        <Select
          value={percentage}
          onValueChange={(value) => onPercentageChange(value)}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="Select percentage" />
          </SelectTrigger>
          <SelectContent>
            {percentageFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Allocation status</Label>
        <Select
          value={allocationStatus}
          onValueChange={(value) => onAllocationStatusChange(value)}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {allocationStatusFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2 md:col-span-2 lg:col-span-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          className="min-w-0"
          placeholder="Search by name, email, or asset"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="min-w-0">
        <AllocationBoughtDateFilter />
      </div>
    </section>
  );
}
