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

import type { AgencySortField, AgencyStatus } from "../schemas/agency.schema";

/**
 * `q` matches agency name or code only — not email or phone, which v1's search
 * covered. Sorting is limited to the three fields the BE indexes.
 *
 * "All" maps to `null`, not `""`: an empty `status` fails the BE's `IsEnum`
 * with a 400 rather than reading as "no filter".
 */
const ALL = "all";

interface AgencyListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: AgencyStatus | null;
  onStatusChange: (value: AgencyStatus | null) => void;
  sort: AgencySortField;
  onSortChange: (value: AgencySortField) => void;
  order: "asc" | "desc";
  onOrderChange: (value: "asc" | "desc") => void;
}

const SORT_LABELS: Record<AgencySortField, string> = {
  created_at: "Date created",
  name: "Name",
  commission_percentage: "Commission",
};

export function AgencyListFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  order,
  onOrderChange,
}: AgencyListFiltersProps) {
  return (
    <div className="grid w-full min-w-0 gap-3 rounded-lg border border-[#E5EAEF] bg-white p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
      <div className="min-w-0 sm:col-span-2 lg:col-span-2">
        <Label className="text-sm text-muted-foreground">Search agencies</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="min-w-0 pl-9 pr-10"
            placeholder="Search by agency name or code"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search && (
            <Button
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

      <div className="min-w-0">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select
          value={status ?? ALL}
          onValueChange={(value) => onStatusChange(value === ALL ? null : (value as AgencyStatus))}
        >
          <SelectTrigger className="mt-2 h-10 w-full min-w-0 sm:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0">
        <Label className="text-sm text-muted-foreground">Sort by</Label>
        <div className="mt-2 flex min-w-0 gap-2">
          <Select value={sort} onValueChange={(value) => onSortChange(value as AgencySortField)}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={(value) => onOrderChange(value as "asc" | "desc")}>
            <SelectTrigger className="h-10 w-24 shrink-0 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
