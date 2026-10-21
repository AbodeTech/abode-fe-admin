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

export type InvitedAttendanceFilter = "all" | "invited" | "registered" | "checked_in" | "confirmed";

const attendanceFilters: { label: string; value: InvitedAttendanceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Invited (not replied)", value: "invited" },
  { label: "Registered", value: "registered" },
  { label: "Checked in", value: "checked_in" },
  { label: "Confirmed", value: "confirmed" },
];

interface InvitedClientsFiltersProps {
  search: string;
  attendance: InvitedAttendanceFilter;
  onSearchChange: (value: string) => void;
  onAttendanceChange: (value: InvitedAttendanceFilter) => void;
}

/** Search and attendance filter for the Invited clients table; both run on the server. */
export function InvitedClientsFilters({
  search,
  attendance,
  onSearchChange,
  onAttendanceChange,
}: InvitedClientsFiltersProps) {
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
        <Label className="text-sm text-muted-foreground">Attendance</Label>
        <Select value={attendance} onValueChange={(value) => onAttendanceChange(value as InvitedAttendanceFilter)}>
          <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {attendanceFilters.map((option) => (
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
