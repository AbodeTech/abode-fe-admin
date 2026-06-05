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

interface UpgradeFiltersProps {
  search: string;
  status: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string | null) => void;
}

export function UpgradeFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: UpgradeFiltersProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
      <div className="min-w-0 space-y-2 md:col-span-2">
        <Label className="text-sm text-muted-foreground">Search by user or referral</Label>
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full min-w-0"
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select
          value={status ?? "all"}
          onValueChange={(value) => onStatusChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
