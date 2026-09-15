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

import type {
  EventAllocationStatus,
  EventAttendeeType,
  RegistrationCategory,
} from "../schemas/company-event.schema";

interface EventRegistrationFiltersProps {
  search: string;
  category: RegistrationCategory | "all";
  attendeeType: EventAttendeeType | "all";
  status: EventAllocationStatus | "all";
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: RegistrationCategory | "all") => void;
  onAttendeeTypeChange: (value: EventAttendeeType | "all") => void;
  onStatusChange: (value: EventAllocationStatus | "all") => void;
}

const categoryFilters: { label: string; value: RegistrationCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Associate Pro", value: "associate_pro" },
  { label: "Associate", value: "associate" },
  { label: "Client", value: "client" },
];

/**
 * The split an organiser plans around. "Visitor" on its own is the bus list for
 * people getting no land; "Getting land" on its own is who must be at their
 * plot.
 */
const attendeeTypeFilters: { label: string; value: EventAttendeeType | "all" }[] = [
  { label: "Everyone", value: "all" },
  { label: "Getting land", value: "allocated" },
  { label: "Visitors", value: "visitor" },
];

const statusFilters: { label: string; value: EventAllocationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Invited", value: "invited" },
  { label: "Registered", value: "registered" },
  { label: "Checked in", value: "checked_in" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

export function EventRegistrationFilters({
  search,
  category,
  attendeeType,
  status,
  onSearchChange,
  onCategoryChange,
  onAttendeeTypeChange,
  onStatusChange,
}: EventRegistrationFiltersProps) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4">
      <div className="min-w-0 space-y-2 md:col-span-4 lg:col-span-1">
        <Label className="text-sm text-muted-foreground">Search</Label>
        <Input
          className="min-w-0"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Attendee</Label>
        <Select
          value={attendeeType}
          onValueChange={(value) => onAttendeeTypeChange(value as EventAttendeeType | "all")}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="Everyone" />
          </SelectTrigger>
          <SelectContent>
            {attendeeTypeFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Status</Label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as EventAllocationStatus | "all")}
        >
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
