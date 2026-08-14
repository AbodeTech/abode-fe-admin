"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AssistantAudience } from "@/lib/gql/graphql";

interface Props {
  audience: AssistantAudience | null;
  onAudienceChange: (value: AssistantAudience | null) => void;
  answered: boolean | null;
  onAnsweredChange: (value: boolean | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const AUDIENCE_OPTIONS: {
  key: AssistantAudience | null;
  label: string;
}[] = [
  { key: null, label: "All" },
  { key: AssistantAudience.Customer, label: "Customer" },
  { key: AssistantAudience.Associate, label: "Associate" },
];

const ANSWERED_OPTIONS: { key: boolean | null; label: string }[] = [
  { key: null, label: "All" },
  { key: true, label: "Answered" },
  { key: false, label: "No answer" },
];

export function AssistantQueryFilters({
  audience,
  onAudienceChange,
  answered,
  onAnsweredChange,
  search,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <FilterGroup label="Audience">
          {AUDIENCE_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.key)}
              active={audience === opt.key}
              onClick={() => onAudienceChange(opt.key)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterGroup>
        <FilterGroup label="Status">
          {ANSWERED_OPTIONS.map((opt) => (
            <FilterChip
              key={String(opt.key)}
              active={answered === opt.key}
              onClick={() => onAnsweredChange(opt.key)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>
      <div className="relative w-full lg:w-72">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search question, answer or email…"
          className="pl-8 h-9 text-sm"
        />
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
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
        "rounded-full px-3 py-1 text-xs border transition-colors",
        active
          ? "bg-[#00695C] text-white border-[#00695C]"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
      )}
    >
      {children}
    </button>
  );
}
