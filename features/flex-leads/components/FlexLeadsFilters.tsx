"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_TABS = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Completed", value: "completed" },
  { label: "Closed", value: "closed" },
  { label: "All", value: "all" },
];

const TYPE_OPTIONS = [
  { label: "All types", value: "all" },
  { label: "Brochure download", value: "brochure" },
  { label: "Site inspection", value: "site_inspection" },
];

interface FlexLeadsFiltersProps {
  status: string;
  type: string;
  search: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function FlexLeadsFilters({
  status,
  type,
  search,
  onStatusChange,
  onTypeChange,
  onSearchChange,
}: FlexLeadsFiltersProps) {
  return (
    <section className="mt-2 flex min-w-0 flex-col gap-3 sm:gap-4">
      <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2 md:col-span-2">
          <Label className="text-sm text-muted-foreground">Search</Label>
          <Input
            className="min-w-0"
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label className="text-sm text-muted-foreground">Lead type</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
