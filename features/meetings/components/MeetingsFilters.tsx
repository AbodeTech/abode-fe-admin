"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MEETING_ACCESS_TYPE_LABELS,
  MEETING_ACCESS_TYPES,
  MEETING_AUDIENCE_LABELS,
  MEETING_AUDIENCE_TYPES,
  type MeetingAccessType,
  type MeetingAudienceType,
} from "../schemas/meeting.schema";

/**
 * `session_kind` never existed on the real BE — still not a filter here.
 * `access_type` was removed here for the same reason as `cohort_id` in
 * `use-meetings.ts` (400'd on the real `ListMeetingsQueryDto`) but that
 * landed 2026-09-09 (`fee2e97`) — restored below.
 */
interface MeetingsFiltersProps {
  audienceType: MeetingAudienceType | null;
  onAudienceTypeChange: (value: MeetingAudienceType | null) => void;
  accessType: MeetingAccessType | null;
  onAccessTypeChange: (value: MeetingAccessType | null) => void;
  isActive: boolean | null;
  onIsActiveChange: (value: boolean | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function MeetingsFilters({
  audienceType,
  onAudienceTypeChange,
  accessType,
  onAccessTypeChange,
  isActive,
  onIsActiveChange,
  search,
  onSearchChange,
}: MeetingsFiltersProps) {
  // The input renders from local state so keystrokes never wait on a router
  // push; `onSearchChange` (which drives the URL + the query) only fires
  // 400ms after typing pauses. Re-sync when `search` changes from outside
  // (Clear button, back/forward nav) using the render-time compare pattern
  // instead of an effect, since this only needs to run when the prop itself
  // changes, not on every render.
  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => onSearchChange(searchInput), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-debounce when the typed value changes
  }, [searchInput]);

  const hasActiveFilters =
    audienceType !== null || accessType !== null || isActive !== null || searchInput.trim().length > 0;

  return (
    <div className="flex min-w-0 flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="w-full min-w-0 sm:w-52 sm:shrink-0">
        <Select
          value={audienceType ?? "all"}
          onValueChange={(value) =>
            onAudienceTypeChange(value === "all" ? null : (value as MeetingAudienceType))
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All audiences" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All audiences</SelectItem>
            {MEETING_AUDIENCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {MEETING_AUDIENCE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full min-w-0 sm:w-40 sm:shrink-0">
        <Select
          value={accessType ?? "all"}
          onValueChange={(value) =>
            onAccessTypeChange(value === "all" ? null : (value as MeetingAccessType))
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All access types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access types</SelectItem>
            {MEETING_ACCESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {MEETING_ACCESS_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full min-w-0 sm:w-40 sm:shrink-0">
        <Select
          value={isActive === null ? "all" : isActive ? "true" : "false"}
          onValueChange={(value) => {
            if (value === "all") onIsActiveChange(null);
            else onIsActiveChange(value === "true");
          }}
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative min-w-0 w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search name, slug, series, cohort..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full min-w-0 pl-10"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onAudienceTypeChange(null);
            onAccessTypeChange(null);
            onIsActiveChange(null);
            setSearchInput("");
            onSearchChange("");
          }}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
