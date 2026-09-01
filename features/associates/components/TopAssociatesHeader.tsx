"use client";

import React from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Download, Loader2 } from "lucide-react";
import { DateFilter } from "@/components/shared/DateFilter";
import { FilterSelect } from "@/components/shared/FilterSelect";

import {
  ASSOCIATE_SORT_FIELDS,
  ASSOCIATE_SORT_LABELS,
  LEADERBOARD_ASSET_TYPES,
  LEADERBOARD_ASSET_TYPE_LABELS,
  LEADERBOARD_TIERS,
  LEADERBOARD_TIER_LABELS,
  type AssociateSortField,
  type SortDirection,
} from "../schemas/top-associate.schema";

interface TopAssociatesHeaderProps {
  sortKey: AssociateSortField;
  sortDirection: SortDirection;
  onSortChange: (key: AssociateSortField, direction: SortDirection) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function TopAssociatesHeader({
  sortKey,
  sortDirection,
  onSortChange,
  onExport,
  isExporting = false,
}: TopAssociatesHeaderProps) {
  const toggleDirection = () =>
    onSortChange(sortKey, sortDirection === "asc" ? "desc" : "asc");

  return (
    <div className="flex flex-col gap-4">
      <CardHeader className="flex flex-col gap-3 px-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-xl font-bold sm:text-2xl">Top Associates</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Client counts are lifetime; revenue and commission follow the date range.
          </CardDescription>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select
            value={sortKey}
            onValueChange={(value) =>
              onSortChange(value as AssociateSortField, sortDirection)
            }
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {ASSOCIATE_SORT_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {ASSOCIATE_SORT_LABELS[field]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDirection}
            aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
          {onExport ? (
            <Button variant="outline" onClick={onExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export
            </Button>
          ) : null}
        </div>
      </CardHeader>

      {/*
        Every control here maps to a filter `TopAssociatesFilterDto` accepts.
        The old "Asset Name" select is gone — it listed hardcoded estate names
        and the endpoint has no asset-name filter to send them to.
      */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-4">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Filters
        </span>
        <DateFilter />
        <FilterSelect
          data={[
            { label: "All Asset Types", value: "all" },
            ...LEADERBOARD_ASSET_TYPES.map((type) => ({
              label: LEADERBOARD_ASSET_TYPE_LABELS[type],
              value: type,
            })),
          ]}
          queryKey="asset_type"
          placeholder="Asset Type"
        />
        <FilterSelect
          data={[
            { label: "All Tiers", value: "all" },
            ...LEADERBOARD_TIERS.map((tier) => ({
              label: LEADERBOARD_TIER_LABELS[tier],
              value: tier,
            })),
          ]}
          queryKey="referral_status"
          placeholder="Tier"
        />
        {/* Suspended associates are excluded by default; including them is an
            audit action, so it reads as a deliberate choice rather than a toggle. */}
        <FilterSelect
          data={[
            { label: "Active only", value: "all" },
            { label: "Include suspended", value: "true" },
          ]}
          queryKey="include_suspended"
          placeholder="Suspended"
        />
      </div>
    </div>
  );
}
