"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  AMARIS_AUDIENCES,
  AMARIS_AUDIENCE_LABELS,
  AMARIS_CHANNELS,
  AMARIS_CHANNEL_LABELS,
  type AmarisAudience,
  type AmarisChannel,
} from "../schemas/amaris.schema";

interface Props {
  audience: AmarisAudience | null;
  onAudienceChange: (value: AmarisAudience | null) => void;
  channel: AmarisChannel | null;
  onChannelChange: (value: AmarisChannel | null) => void;
  answered: boolean | null;
  onAnsweredChange: (value: boolean | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const ANSWERED_OPTIONS: { key: boolean | null; label: string }[] = [
  { key: null, label: "All" },
  { key: true, label: "Answered" },
  { key: false, label: "No answer" },
];

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      )}
    >
      {children}
    </button>
  );
}

export function AmarisQueryFilters({
  audience,
  onAudienceChange,
  channel,
  onChannelChange,
  answered,
  onAnsweredChange,
  search,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <FilterGroup label="Audience">
          <FilterChip active={audience === null} onClick={() => onAudienceChange(null)}>
            All
          </FilterChip>
          {AMARIS_AUDIENCES.map((value) => (
            <FilterChip
              key={value}
              active={audience === value}
              onClick={() => onAudienceChange(value)}
            >
              {AMARIS_AUDIENCE_LABELS[value]}
            </FilterChip>
          ))}
        </FilterGroup>

        {/* New with the REST module — v1 had no channel. */}
        <FilterGroup label="Channel">
          <FilterChip active={channel === null} onClick={() => onChannelChange(null)}>
            All
          </FilterChip>
          {AMARIS_CHANNELS.map((value) => (
            <FilterChip
              key={value}
              active={channel === value}
              onClick={() => onChannelChange(value)}
            >
              {AMARIS_CHANNEL_LABELS[value]}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Status">
          {ANSWERED_OPTIONS.map((option) => (
            <FilterChip
              key={String(option.key)}
              active={answered === option.key}
              onClick={() => onAnsweredChange(option.key)}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>

      <div className="relative w-full lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-9"
          placeholder="Search question, answer, email or phone"
          aria-label="Search Amaris questions"
        />
      </div>
    </div>
  );
}
