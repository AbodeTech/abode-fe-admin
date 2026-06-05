"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AgencyTransactionDateFilter = "all" | "today" | "week" | "month";

interface AgencyTransactionFiltersProps {
  search: string;
  status: string;
  date: AgencyTransactionDateFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: AgencyTransactionDateFilter) => void;
  onReset: () => void;
}

export function AgencyTransactionFilters({
  search,
  status,
  date,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onReset,
}: AgencyTransactionFiltersProps) {
  return (
    <div className="min-w-0 rounded-lg border border-[#E5EAEF] bg-white p-3 sm:p-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 space-y-2 md:col-span-2 xl:col-span-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by transaction id, reference or description"
              className="h-10 min-w-0 pl-9 pr-10 sm:h-9"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2">
          <Label>Date</Label>
          <Select value={date} onValueChange={(value) => onDateChange(value as AgencyTransactionDateFilter)}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
