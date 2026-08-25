"use client";

import { Loader2, Mail, Phone, MessageCircle, MapPin, Circle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TicketChannel,
  type GetTicketsQuery,
} from "@/lib/gql/graphql";
import {
  STATUS_LABELS,
  STATUS_PILL_CLASS,
  TYPE_LABELS,
  TYPE_PILL_CLASS,
  categoryLabel,
} from "../lib/ticket-display";

type Row = GetTicketsQuery["getTickets"]["results"][number];

interface Props {
  rows: Row[];
  activeTicketId?: string | null;
  onRowClick: (row: Row) => void;
  isLoading: boolean;
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

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? `${d.getDate()} ${MONTHS[d.getMonth()]}`
    : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatUser = (u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
  if (!u) return null;
  const name = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  return name || u.email || null;
};

export function TicketsTable({
  rows,
  activeTicketId,
  onRowClick,
  isLoading,
  isError,
  errorMessage,
}: Props) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tickets…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn&apos;t load tickets.
        {errorMessage && <div className="mt-1 text-xs text-red-800">{errorMessage}</div>}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        No tickets match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
              <th className="px-3 py-2.5 font-medium w-14">Ref</th>
              <th className="px-3 py-2.5 font-medium w-8"></th>
              <th className="px-3 py-2.5 font-medium">Subject</th>
              <th className="px-3 py-2.5 font-medium">Affected</th>
              <th className="px-3 py-2.5 font-medium">Sender</th>
              <th className="px-3 py-2.5 font-medium">Assigned</th>
              <th className="px-3 py-2.5 font-medium">Issue</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isActive = activeTicketId === r._id;
              const isMerged = !!r.merged_into;
              const Icon = CHANNEL_ICON[r.channel];
              const affected = formatUser(r.user_affected);
              const senderDifferent =
                r.sender &&
                r.user_affected &&
                r.sender._id !== r.user_affected._id;
              return (
                <tr
                  key={r._id}
                  onClick={() => onRowClick(r)}
                  className={cn(
                    "border-t border-gray-100 cursor-pointer align-top",
                    isActive && "bg-[#E0F2F1]/60",
                    !isActive && "hover:bg-gray-50/60",
                    isMerged && "opacity-60"
                  )}
                >
                  <td className="px-3 py-3 text-[11px] font-medium text-gray-500 tabular-nums whitespace-nowrap">
                    {r.ticket_ref}
                  </td>
                  <td className="px-3 py-3">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </td>
                  <td className="px-3 py-3 max-w-md">
                    <p className="font-medium text-gray-900 leading-tight line-clamp-1">
                      {r.subject}
                      {isMerged && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-gray-400">
                          merged
                        </span>
                      )}
                    </p>
                    {(r.type || r.category) && (
                      <span className="flex flex-wrap items-center gap-1 mt-1">
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
                        {r.category && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.5 text-[10px]">
                            {categoryLabel(r.category)}
                          </span>
                        )}
                      </span>
                    )}
                    {r.body && (
                      <p className="text-xs text-gray-500 leading-tight line-clamp-1 mt-0.5">
                        {r.body}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                    {affected ?? (
                      <span className="text-gray-400 text-xs italic">Unlinked</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {r.sender ? (
                      <span
                        className={cn(
                          "text-sm",
                          senderDifferent ? "text-gray-800" : "text-gray-400"
                        )}
                        title={
                          senderDifferent
                            ? "Raised on behalf of the affected user"
                            : "Sender is the affected user"
                        }
                      >
                        {formatUser(r.sender)}
                        {!senderDifferent && (
                          <span className="text-[10px] text-gray-400 ml-1">= affected</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                    {r.assigned_admin?.userName ?? (
                      <span className="text-amber-700 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {r.issue ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#00695C]">
                        <ExternalLink className="h-3 w-3" />
                        {r.issue.issue_ref}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_PILL_CLASS[r.status]
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                    {formatDate(r.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
