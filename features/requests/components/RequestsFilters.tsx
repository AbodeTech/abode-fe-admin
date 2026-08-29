"use client";

import React from "react";
import { Search } from "lucide-react";

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

import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type PaymentStatus,
  type RequestStatus,
} from "../schemas/request.schema";

/**
 * Exactly `AdminRequestsFiltersDto`: status, payment status, search, dates.
 * (`request_type` is fixed by the page.) v1's per-type extras — asset type,
 * category, update type — have no v2 params; they went with the flat
 * `details` bag the old API returned. Every filter here also narrows the
 * analytics block above the table.
 *
 * Search is real: request_id, or the user's name/email against the joined
 * user document.
 */
interface RequestsFiltersProps {
  status: RequestStatus | null;
  paymentStatus: PaymentStatus | null;
  searchQuery: string;
  onStatusChange: (value: RequestStatus | null) => void;
  onPaymentStatusChange: (value: PaymentStatus | null) => void;
  onSearchChange: (value: string) => void;
  /** Custom requests are free — hide the payment filter where it can't apply. */
  showPaymentStatus?: boolean;
}

export function RequestsFilters({
  status,
  paymentStatus,
  searchQuery,
  onStatusChange,
  onPaymentStatusChange,
  onSearchChange,
  showPaymentStatus = true,
}: RequestsFiltersProps) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[160px]">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</Label>
          <Select
            value={status ?? "all"}
            onValueChange={(value) => onStatusChange(value === "all" ? null : (value as RequestStatus))}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REQUEST_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {REQUEST_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showPaymentStatus && (
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:min-w-[190px]">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment</Label>
            <Select
              value={paymentStatus ?? "all"}
              onValueChange={(value) =>
                onPaymentStatusChange(value === "all" ? null : (value as PaymentStatus))
              }
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All payment states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payment states</SelectItem>
                {PAYMENT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PAYMENT_STATUS_LABELS[value]}
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
              placeholder="Request ID, name or email"
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
