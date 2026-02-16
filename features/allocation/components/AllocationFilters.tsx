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

export const AllocationAssetOptionFragment = graphql(`
  fragment AllocationAssetOptionFragment on Asset {
    _id
    asset_name
    asset_type
  }
`);

interface AllocationFiltersProps {
  assets?: (FragmentType<typeof AllocationAssetOptionFragment> | null)[] | null;
  search: string;
  percentage: string;
  assetName: string | null;
  onSearchChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onAssetNameChange: (value: string | null) => void;
}

const percentageFilters = [
  { label: "All percentages", value: "all" },
  { label: "0% - 25%", value: "0-25" },
  { label: "26% - 50%", value: "26-50" },
  { label: "51% - 75%", value: "51-75" },
  { label: "76% - 100%", value: "76-100" },
];

export function AllocationFilters({
  assets,
  search,
  percentage,
  assetName,
  onSearchChange,
  onPercentageChange,
  onAssetNameChange,
}: AllocationFiltersProps) {
  const safeAssets = (assets ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  const mappedAssets = safeAssets.map((asset) =>
    getFragmentData(AllocationAssetOptionFragment, asset)
  );

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mt-2">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Filter by asset</Label>
        <Select
          value={assetName ?? "all"}
          onValueChange={(value) => onAssetNameChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full">
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

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Percentage paid</Label>
        <Select
          value={percentage}
          onValueChange={(value) => onPercentageChange(value)}
        >
          <SelectTrigger className="w-full">
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

      <div className="space-y-2 md:col-span-2 lg:col-span-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          placeholder="Search by name, email, or asset"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </section>
  );
}
