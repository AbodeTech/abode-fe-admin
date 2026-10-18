"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUPON_STATUSES, type CouponStatus } from "../schemas/coupon.schema";

interface CouponFiltersProps {
  status: CouponStatus | null;
  onStatusChange: (value: CouponStatus | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function CouponFilters({ status, onStatusChange, search, onSearchChange }: CouponFiltersProps) {
  const hasActiveFilters = status !== null || search.trim().length > 0;

  const clearFilters = () => {
    onStatusChange(null);
    onSearchChange("");
  };

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center">
      <div className="w-full min-w-0 sm:w-64 sm:shrink-0">
        <Select
          value={status ?? "all"}
          onValueChange={(value) =>
            onStatusChange(value === "all" ? null : (value as CouponStatus))
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {COUPON_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative min-w-0 w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full min-w-0 pl-10"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
