"use client";

import {
  Circle,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TicketChannel, type GetTicketsQuery } from "@/lib/gql/graphql";
import {
  STATUS_LABELS,
  STATUS_PILL_CLASS,
  TYPE_PILL_CLASS,
  TYPE_LABELS,
} from "../lib/ticket-display";

type Row = GetTicketsQuery["getTickets"]["results"][number];

interface Props {
  rows: Row[];
  activeTicketId?: string | null;
  onSelect: (row: Row) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  errorMessage?: string;
}

const CHANNEL_ICON: Record<TicketChannel, React.ElementType> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  in_person: MapPin,
  other: Circle,
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Time for today, date for anything older — the shape a mail client uses. */
const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? `${d.getDate()} ${MONTHS[d.getMonth()]}`
    : `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
};

const formatUser = (
  u?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null
) => {
  if (!u) return null;
  const name = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  return name || u.email || null;
};

/**
 * The queue, narrow.
 *
 * A 22rem column cannot carry the nine columns the old table did, so each row
 * keeps only what decides whether to open it: who it is about, what it says,
 * how long it has been waiting, and whether anyone owns it. Assignee, issue and
 * type survive as markers rather than columns.
 */
export function TicketList({
  rows,
  activeTicketId,
  onSelect,
  search,
  onSearchChange,
  isLoading,
  isFetching,
  isError,
  errorMessage,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-2.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search ref, subject, body or address…"
            className="pl-8 h-9 text-sm"
          />
          {isFetching && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : isError ? (
          <div className="m-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[#AD1F2A]">
            Couldn&apos;t load tickets.
            {errorMessage && (
              <div className="mt-1 text-xs text-red-800">{errorMessage}</div>
            )}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No tickets match these filters.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => {
              const isActive = activeTicketId === r._id;
              const isMerged = !!r.merged_into;
              const Icon = CHANNEL_ICON[r.channel];
              const affected = formatUser(r.user_affected);
              return (
                <li key={r._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(r)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 transition-colors",
                      isActive
                        ? "bg-[#E0F2F1]/70"
                        : "hover:bg-gray-50",
                      isMerged && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <Icon className="h-3 w-3 shrink-0 text-gray-400" />
                      <span className="tabular-nums font-medium">
                        {r.ticket_ref}
                      </span>
                      {r.issue && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[#AD1F2A]"
                          title={`Blocked on ${r.issue.issue_ref}`}
                        >
                          <Link2 className="h-2.5 w-2.5" />
                          {r.issue.issue_ref}
                        </span>
                      )}
                      <span className="ml-auto tabular-nums shrink-0">
                        {formatWhen(r.updatedAt)}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-900 leading-tight truncate mt-0.5">
                      {r.subject}
                      {isMerged && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gray-400">
                          merged
                        </span>
                      )}
                    </p>

                    <p className="text-xs text-gray-500 leading-tight truncate">
                      {affected ?? (
                        <span className="text-amber-700 italic">
                          No user linked
                        </span>
                      )}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          STATUS_PILL_CLASS[r.status]
                        )}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.type && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            TYPE_PILL_CLASS[r.type]
                          )}
                        >
                          {TYPE_LABELS[r.type]}
                        </span>
                      )}
                      {r.assigned_admin ? (
                        <span
                          className="text-[10px] text-gray-500 truncate"
                          title={r.assigned_admin.email ?? undefined}
                        >
                          {r.assigned_admin.userName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
