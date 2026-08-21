"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TicketChannel,
  TicketSort,
} from "@/lib/gql/graphql";
import { CHANNEL_OPTIONS, SORT_OPTIONS } from "../lib/ticket-display";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  sort: TicketSort;
  onSortChange: (value: TicketSort) => void;
  channel: TicketChannel | null;
  onChannelChange: (value: TicketChannel | null) => void;
}

const CHANNEL_ANY = "__any__";

/** Search + secondary filters row below the chip strip. */
export function TicketsToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  channel,
  onChannelChange,
}: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search ref, subject, body or source address…"
          className="pl-8 h-9 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={channel ?? CHANNEL_ANY}
          onValueChange={(v) =>
            onChannelChange(v === CHANNEL_ANY ? null : (v as TicketChannel))
          }
        >
          <SelectTrigger className="h-9 text-sm w-40 bg-white">
            <SelectValue placeholder="Any channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CHANNEL_ANY}>Any channel</SelectItem>
            {CHANNEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => onSortChange(v as TicketSort)}>
          <SelectTrigger className="h-9 text-sm w-44 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
