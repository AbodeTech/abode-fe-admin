"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateFilter } from "@/components/shared/DateFilter";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface RequestsFiltersProps {
  status: string | null;
  paymentStatus: string | null;
  searchQuery: string;
  category?: string | null;
  assetType?: string | null;
  updateType?: string | null;
  hasAsset?: string | null;
  onStatusChange: (value: string | null) => void;
  onPaymentStatusChange: (value: string | null) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange?: (value: string | null) => void;
  onAssetTypeChange?: (value: string | null) => void;
  onUpdateTypeChange?: (value: string | null) => void;
  onHasAssetChange?: (value: string | null) => void;
  showPaymentStatus?: boolean;
  statusOptions?: FilterOption[];
  categoryOptions?: FilterOption[];
  assetTypeOptions?: FilterOption[];
  updateTypeOptions?: FilterOption[];
  hasAssetOptions?: FilterOption[];
}

const defaultStatusOptions: FilterOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
  { label: "Under Review", value: "under_review" },
];

export function RequestsFilters({
  status,
  paymentStatus,
  searchQuery,
  category,
  assetType,
  updateType,
  hasAsset,
  onStatusChange,
  onPaymentStatusChange,
  onSearchChange,
  onCategoryChange,
  onAssetTypeChange,
  onUpdateTypeChange,
  onHasAssetChange,
  showPaymentStatus = true,
  statusOptions = defaultStatusOptions,
  categoryOptions,
  assetTypeOptions,
  updateTypeOptions,
  hasAssetOptions,
}: RequestsFiltersProps) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[160px]">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</Label>
          <Select
            value={status ?? "all"}
            onValueChange={(value) => onStatusChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showPaymentStatus && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[160px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment Status</Label>
            <Select
              value={paymentStatus ?? "all"}
              onValueChange={(value) => onPaymentStatusChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {categoryOptions && onCategoryChange && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[170px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</Label>
            <Select
              value={category ?? "all"}
              onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {updateTypeOptions && onUpdateTypeChange && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[170px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Update Type</Label>
            <Select
              value={updateType ?? "all"}
              onValueChange={(value) => onUpdateTypeChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All update types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {updateTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {assetTypeOptions && onAssetTypeChange && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[170px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asset Type</Label>
            <Select
              value={assetType ?? "all"}
              onValueChange={(value) => onAssetTypeChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All asset types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {assetTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasAssetOptions && onHasAssetChange && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[170px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Asset Status</Label>
            <Select
              value={hasAsset ?? "all"}
              onValueChange={(value) => onHasAssetChange(value === "all" ? null : value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All asset status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {hasAssetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-full min-w-0 space-y-2 sm:min-w-[260px] sm:flex-[2]">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Search by request ID, user or email"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[160px]">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</Label>
          <DateFilter />
        </div>
      </div>
    </div>
  );
}
