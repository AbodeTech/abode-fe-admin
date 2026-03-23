"use client";

import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";

export type AssociateSortKey =
  | "sales_person"
  | "no_of_clients"
  | "units_sold"
  | "size_sold"
  | "expected_revenue"
  | "received_revenue"
  | "commission"
  | "defaulting_rate";

interface TopAssociatesHeaderProps {
  sortKey: AssociateSortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: AssociateSortKey, direction: "asc" | "desc") => void;
}

export function TopAssociatesHeader({
  sortKey,
  sortDirection,
  onSortChange,
}: TopAssociatesHeaderProps) {
  const toggleDirection = () =>
    onSortChange(sortKey, sortDirection === "asc" ? "desc" : "asc");

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-0">
        <div>
          <CardTitle className="text-2xl font-bold">Top Associates</CardTitle>
          <CardDescription>
            Ranked by revenue with flexible sorting for performance comparisons.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortKey}
            onValueChange={(value) => onSortChange(value as AssociateSortKey, sortDirection)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales_person">Sales Person</SelectItem>
              <SelectItem value="no_of_clients">Number of Clients</SelectItem>
              <SelectItem value="units_sold">Units Sold</SelectItem>
              <SelectItem value="size_sold">Total Size</SelectItem>
              <SelectItem value="expected_revenue">Expected Revenue</SelectItem>
              <SelectItem value="received_revenue">Received Revenue</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="defaulting_rate">Defaulting Rate</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={toggleDirection} aria-label="Toggle sort direction">
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filters</span>
        <DateFilter />
        <FilterSelect
          data={[
            { label: "All Asset Types", value: "all" },
            { label: "Flex", value: "flex" },
            { label: "Full Ownership", value: "full-ownership" },
          ]}
          queryKey="assettype"
          placeholder="Asset Type"
        />
        <FilterSelect
          data={[
            { label: "All Assets", value: "all" },
            { label: "Abode Heights Ph I", value: "abode-heights-ph-i" },
            { label: "Greenfield Estate", value: "greenfield-estate" },
            { label: "The Vantage Flex", value: "the-vantage-flex" },
            { label: "Epe Heritage Gardens", value: "epe-heritage-gardens" },
            { label: "Lekki Pride", value: "lekki-pride" },
          ]}
          queryKey="assetname"
          placeholder="Asset Name"
        />
      </div>
    </div>
  );
}
