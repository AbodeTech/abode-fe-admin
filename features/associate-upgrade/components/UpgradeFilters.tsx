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
  transactionType: string | null;
  upgradeType: string | null;
  startDate: string | null;
  endDate: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string | null) => void;
  onTransactionTypeChange: (value: string | null) => void;
  onUpgradeTypeChange: (value: string | null) => void;
  onDateRangeChange: (start: string | null, end: string | null) => void;
}

// user_upgrade_type values match BE's ReferralUpgrade docs. Verify with the
// current BE list if adding new types.
const UPGRADE_TYPE_OPTIONS = [
  { value: "all", label: "All upgrade types" },
  { value: "user to associate", label: "User → Associate" },
  { value: "user to associate pro", label: "User → Associate Pro" },
  { value: "associate to associate pro", label: "Associate → Associate Pro" },
];

export function UpgradeFilters({
  search,
  status,
  transactionType,
  upgradeType,
  startDate,
  endDate,
  onSearchChange,
  onStatusChange,
  onTransactionTypeChange,
  onUpgradeTypeChange,
  onDateRangeChange,
}: UpgradeFiltersProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-7">
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
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Channel</Label>
        <Select
          value={transactionType ?? "all"}
          onValueChange={(value) =>
            onTransactionTypeChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="paystack">Paystack</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Upgrade type</Label>
        <Select
          value={upgradeType ?? "all"}
          onValueChange={(value) =>
            onUpgradeTypeChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All upgrade types" />
          </SelectTrigger>
          <SelectContent>
            {UPGRADE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Start date</Label>
        <Input
          type="date"
          value={startDate ?? ""}
          onChange={(e) => onDateRangeChange(e.target.value || null, endDate)}
          className="w-full min-w-0"
          max={endDate ?? undefined}
        />
      </div>
      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">End date</Label>
        <Input
          type="date"
          value={endDate ?? ""}
          onChange={(e) => onDateRangeChange(startDate, e.target.value || null)}
          className="w-full min-w-0"
          min={startDate ?? undefined}
        />
      </div>
    </div>
  );
}
