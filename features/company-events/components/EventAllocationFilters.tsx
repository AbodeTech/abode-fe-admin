"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { EligibilityTier } from "../schemas/company-event.schema";

interface EventAllocationFiltersProps {
  search: string;
  eligibilityTier: EligibilityTier | "all";
  onSearchChange: (value: string) => void;
  onEligibilityTierChange: (value: EligibilityTier | "all") => void;
}

const eligibilityFilters: { label: string; value: EligibilityTier | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Land", value: "land" },
  { label: "Land + Dev Levy", value: "land_and_dev_levy" },
];

export function EventAllocationFilters({
  search,
  eligibilityTier,
  onSearchChange,
  onEligibilityTierChange,
}: EventAllocationFiltersProps) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
      <div className="min-w-0 space-y-2 md:col-span-2">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          className="min-w-0"
          placeholder="Search by client name, email, or phone"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Eligibility</Label>
        <Select value={eligibilityTier} onValueChange={(value) => onEligibilityTierChange(value as EligibilityTier | "all")}>
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {eligibilityFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
