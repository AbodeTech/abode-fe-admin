"use client";

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
  sort: TicketSort;
  onSortChange: (value: TicketSort) => void;
  channel: TicketChannel | null;
  onChannelChange: (value: TicketChannel | null) => void;
}

const CHANNEL_ANY = "__any__";

/**
 * Channel and sort. Search lives inside the list pane, next to the rows it
 * filters, the way a mail client puts it.
 */
export function TicketsToolbar({
  sort,
  onSortChange,
  channel,
  onChannelChange,
}: Props) {
  return (
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
  );
}
