"use client";

import React from "react";
import { Download, Loader2, Search } from "lucide-react";

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

import {
  FLEX_LEAD_STATUSES,
  FLEX_LEAD_STATUS_LABELS,
  FLEX_LEAD_TYPES,
  FLEX_LEAD_TYPE_LABELS,
} from "../schemas/flex-lead.schema";

const STATUS_TABS = [
  ...FLEX_LEAD_STATUSES.map((value) => ({ label: FLEX_LEAD_STATUS_LABELS[value], value })),
  { label: "All", value: "all" },
];

interface FlexLeadsFiltersProps {
  status: string;
  type: string;
  search: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  /** The CSV export mirrors the current filters (FL-8). */
  onExport: () => void;
  isExporting: boolean;
}

export function FlexLeadsFilters({
  status,
  type,
  search,
  onStatusChange,
  onTypeChange,
  onSearchChange,
  onExport,
  isExporting,
}: FlexLeadsFiltersProps) {
  return (
    <section className="mt-2 flex min-w-0 flex-col gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(tab.value)}
            className={status === tab.value ? "pointer-events-none" : ""}
          >
            {tab.label}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="ml-auto gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Export CSV
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2 md:col-span-2">
          <Label className="text-sm text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="min-w-0 pl-9"
              placeholder="Search by name, email, or phone"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <Label className="text-sm text-muted-foreground">Lead type</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {FLEX_LEAD_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {FLEX_LEAD_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
