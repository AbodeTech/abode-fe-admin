"use client";

import React from "react";
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
import type { AllocationAssetOption, AllocationStatus } from "../schemas/allocation.schema";

interface AllocationFiltersProps {
  assets?: AllocationAssetOption[];
  search: string;
  percentage: string;
  assetId: string | null;
  allocationStatus: AllocationStatus | "all";
  onSearchChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onAssetIdChange: (value: string | null) => void;
  onAllocationStatusChange: (value: AllocationStatus | "all") => void;
}

/**
 * Bucket labels stay as a UX affordance, but the backend only accepts a
 * floor (`payment_percentage_min`, `$gte`) — there is no upper-bound param.
 * "26%+" sends `26` and matches everything ≥26, not a 26-50 band.
 */
const percentageFilters = [
  { label: "All percentages", value: "all" },
  { label: "0%+", value: "0" },
  { label: "26%+", value: "26" },
  { label: "51%+", value: "51" },
  { label: "76%+", value: "76" },
];

const allocationStatusFilters: { label: string; value: AllocationStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Not assigned yet", value: "pending" },
  { label: "Allocated", value: "allocated" },
  { label: "Email sent", value: "email_sent" },
];

export function AllocationFilters({
  assets,
  search,
  percentage,
  assetId,
  allocationStatus,
  onSearchChange,
  onPercentageChange,
  onAssetIdChange,
  onAllocationStatusChange,
}: AllocationFiltersProps) {
  const safeAssets = assets ?? [];

  return (
    <section className="mt-2 grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-6">
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Filter by asset</Label>
        <Select
          value={assetId ?? "all"}
          onValueChange={(value) => onAssetIdChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assets</SelectItem>
            {safeAssets.map((asset) => (
              <SelectItem key={asset._id} value={asset._id}>
                {asset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Allocation status</Label>
        <Select
          value={allocationStatus}
          onValueChange={(value) => onAllocationStatusChange(value as AllocationStatus | "all")}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All statuses" />
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

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Payment %</Label>
        <Select value={percentage} onValueChange={onPercentageChange}>
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

      <div className="min-w-0 space-y-2 md:col-span-2 lg:col-span-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          className="min-w-0"
          placeholder="Search by client name, email, or phone"
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
