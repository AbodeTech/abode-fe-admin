"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateFilter } from "@/components/shared/DateFilter";
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
  onStatusChange: (value: string | null) => void;
  onPaymentStatusChange: (value: string | null) => void;
  onSearchChange: (value: string) => void;
  showPaymentStatus?: boolean;
  statusOptions?: FilterOption[];
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
  onStatusChange,
  onPaymentStatusChange,
  onSearchChange,
  showPaymentStatus = true,
  statusOptions = defaultStatusOptions,
}: RequestsFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showPaymentStatus && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Payment Status</Label>
          <Select
            value={paymentStatus ?? "all"}
            onValueChange={(value) => onPaymentStatusChange(value === "all" ? null : value)}
          >
            <SelectTrigger>
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
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          placeholder="Search by request ID, user or email"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Date</Label>
        <DateFilter />
      </div>
    </div>
  );
}
