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

import type { RegistrationCategory } from "../schemas/company-event.schema";

interface EventRegistrationFiltersProps {
  search: string;
  category: RegistrationCategory | "all";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: RegistrationCategory | "all") => void;
}

const categoryFilters: { label: string; value: RegistrationCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Associate Pro", value: "associate_pro" },
  { label: "Associate", value: "associate" },
  { label: "Client", value: "client" },
];

export function EventRegistrationFilters({
  search,
  category,
  onSearchChange,
  onCategoryChange,
}: EventRegistrationFiltersProps) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
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
        <Label className="text-sm text-muted-foreground">Category</Label>
        <Select value={category} onValueChange={(value) => onCategoryChange(value as RegistrationCategory | "all")}>
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {categoryFilters.map((option) => (
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
