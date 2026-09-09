"use client";

import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChannel, TicketSort, TicketType } from "@/lib/gql/graphql";
import {
  CHANNEL_OPTIONS,
  SORT_OPTIONS,
  TYPE_LABELS,
  categoryLabel,
} from "../lib/ticket-display";
import { useTicketCategories } from "../hooks/use-tickets";
import { useTicketManagerPicker } from "../hooks/use-ticket-manager-picker";

interface Props {
  sort: TicketSort;
  onSortChange: (value: TicketSort) => void;
  channel: TicketChannel | null;
  onChannelChange: (value: TicketChannel | null) => void;
  /**
   * Table-view only. In the mail view, search and the two classification
   * filters are omitted: search belongs in the list rail next to the rows it
   * filters, and re-filtering the rail while reading a thread only moves the
   * thread out from under the reader.
   */
  search?: string;
  onSearchChange?: (value: string) => void;
  type?: TicketType | null;
  onTypeChange?: (value: TicketType | null) => void;
  category?: string | null;
  onCategoryChange?: (value: string | null) => void;
  /**
   * The two manager filters. Passed only to a reader who can see past their own
   * work — for anyone else the viewer scope ANDs with these, so every choice
   * but themselves returns an empty table, and a control that can only ever
   * return nothing is worse than no control.
   *
   * They are separate on purpose. `assignedAdminId` is who is WORKING the
   * ticket; `csManagerId` is whose book the customer sits in. A payment fault
   * raised by a manager's customer and handed to a developer answers to the
   * second and not the first.
   */
  assignedAdminId?: string | null;
  onAssignedAdminChange?: (value: string | null) => void;
  csManagerId?: string | null;
  onCsManagerChange?: (value: string | null) => void;
  isFetching?: boolean;
}

const ANY = "__any__";

/** Everything that narrows the queue, in one row above it. */
export function TicketsToolbar({
  sort,
  onSortChange,
  channel,
  onChannelChange,
  search,
  onSearchChange,
  type,
  onTypeChange,
  category,
  onCategoryChange,
  assignedAdminId,
  onAssignedAdminChange,
  csManagerId,
  onCsManagerChange,
  isFetching,
}: Props) {
  const showSearch = !!onSearchChange;
  const showType = !!onTypeChange;
  const showCategory = !!onCategoryChange;
  const showManagers = !!onAssignedAdminChange && !!onCsManagerChange;

  // Both only fetched where the dropdowns are actually rendered.
  const { data: categories } = useTicketCategories(showCategory);
  const { options: managers } = useTicketManagerPicker(showManagers);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showSearch && (
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange!(e.target.value)}
            placeholder="Search ref, subject, body or address…"
            className="h-9 bg-white pl-8 text-sm"
          />
          {isFetching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
      )}

      {showType && (
        <Select
          value={type ?? ANY}
          onValueChange={(v) =>
            onTypeChange!(v === ANY ? null : (v as TicketType))
          }
        >
          <SelectTrigger className="h-9 w-36 bg-white text-sm">
            <SelectValue placeholder="Any type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any type</SelectItem>
            {(Object.keys(TYPE_LABELS) as TicketType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showCategory && (
        <Select
          value={category ?? ANY}
          onValueChange={(v) => onCategoryChange!(v === ANY ? null : v)}
        >
          <SelectTrigger className="h-9 w-44 bg-white text-sm">
            <SelectValue placeholder="Any category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any category</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showManagers && (
        <>
          <Select
            value={assignedAdminId ?? ANY}
            onValueChange={(v) => onAssignedAdminChange!(v === ANY ? null : v)}
          >
            <SelectTrigger className="h-9 w-44 bg-white text-sm">
              <SelectValue placeholder="Anyone assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Anyone assigned</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  Assigned to {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={csManagerId ?? ANY}
            onValueChange={(v) => onCsManagerChange!(v === ANY ? null : v)}
          >
            <SelectTrigger className="h-9 w-48 bg-white text-sm">
              <SelectValue placeholder="Any customer's manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any customer&apos;s manager</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}&apos;s customers
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <Select
        value={channel ?? ANY}
        onValueChange={(v) =>
          onChannelChange(v === ANY ? null : (v as TicketChannel))
        }
      >
        <SelectTrigger className="h-9 w-36 bg-white text-sm">
          <SelectValue placeholder="Any channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any channel</SelectItem>
          {CHANNEL_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as TicketSort)}>
        <SelectTrigger className="h-9 w-44 bg-white text-sm">
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
