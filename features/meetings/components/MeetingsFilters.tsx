"use client";

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
  MEETING_SESSION_KIND_LABELS,
  MEETING_SESSION_KINDS,
  type MeetingAccessType,
  type MeetingAudienceType,
  type MeetingSessionKind,
} from "../schemas/meeting.schema";

interface MeetingsFiltersProps {
  audienceType: MeetingAudienceType | null;
  onAudienceTypeChange: (value: MeetingAudienceType | null) => void;
  sessionKind: MeetingSessionKind | null;
  onSessionKindChange: (value: MeetingSessionKind | null) => void;
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
  sessionKind,
  onSessionKindChange,
  accessType,
  onAccessTypeChange,
  isActive,
  onIsActiveChange,
  search,
  onSearchChange,
}: MeetingsFiltersProps) {
  const hasActiveFilters =
    audienceType !== null ||
    sessionKind !== null ||
    accessType !== null ||
    isActive !== null ||
    search.trim().length > 0;

  return (
    <div className="flex min-w-0 flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="w-full min-w-0 sm:w-44 sm:shrink-0">
        <Select
          value={sessionKind ?? "all"}
          onValueChange={(value) =>
            onSessionKindChange(value === "all" ? null : (value as MeetingSessionKind))
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="All kinds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            {MEETING_SESSION_KINDS.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {MEETING_SESSION_KIND_LABELS[kind]}
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
            <SelectValue placeholder="All access" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All access</SelectItem>
            {MEETING_ACCESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {MEETING_ACCESS_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full min-w-0 pl-10"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onAudienceTypeChange(null);
            onSessionKindChange(null);
            onAccessTypeChange(null);
            onIsActiveChange(null);
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
