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

import type { EventAllocationStatus, PickupLocation, RegistrationCategory } from "../schemas/company-event.schema";

interface EventRegistrationFiltersProps {
  search: string;
  category: RegistrationCategory | "all";
  status: EventAllocationStatus | "all";
  pickupLocationId: string;
  pickupLocations: PickupLocation[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: RegistrationCategory | "all") => void;
  onStatusChange: (value: EventAllocationStatus | "all") => void;
  onPickupChange: (value: string) => void;
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
  status,
  pickupLocationId,
  pickupLocations,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPickupChange,
}: EventRegistrationFiltersProps) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-5">
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
        <Label className="text-sm text-muted-foreground">Attendance</Label>
        <Select value={status} onValueChange={(value) => onStatusChange(value as EventAllocationStatus | "all")}>
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {([['all', 'All'], ['invited', 'Invited'], ['registered', 'Registered'], ['checked_in', 'Checked in'], ['confirmed', 'Confirmed'], ['cancelled', 'Cancelled']] as const).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-0 space-y-2">
        <Label className="text-sm text-muted-foreground">Pickup</Label>
        <Select value={pickupLocationId || 'all'} onValueChange={(value) => onPickupChange(value === 'all' ? '' : value)}>
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pickups</SelectItem>
            {pickupLocations.map((location) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}
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
