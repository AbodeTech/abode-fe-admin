"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CouponFiltersProps {
  status: string | null;
  onStatusChange: (value: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function CouponFilters({ status, onStatusChange, search, onSearchChange }: CouponFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select
          value={status ?? "all"}
          onValueChange={(value) => onStatusChange(value === "all" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          placeholder="Search by code"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
