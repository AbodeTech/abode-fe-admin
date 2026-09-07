"use client";

import {
  AlertTriangle,
  Circle,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import { TicketChannel, type GetTicketsQuery } from "@/lib/gql/graphql";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  STATUS_PILL_CLASS,
  TYPE_LABELS,
  TYPE_PILL_CLASS,
  categoryLabel,
} from "../lib/ticket-display";

type Row = GetTicketsQuery["getTickets"]["results"][number];

interface Props {
  rows: Row[];
  onOpen: (row: Row) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  /** Shown in the empty state so "nothing here" reads as scope, not as a bug. */
  canRoute: boolean;
}

const CHANNEL_ICON: Record<TicketChannel, React.ElementType> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  in_person: MapPin,
  other: Circle,
};

const ageInHours = (iso: string, now: number) =>
  (now - new Date(iso).getTime()) / 3600000;

/** Whole days once it stops being about hours — nobody reads "63h". */
const formatAge = (hours: number) => {
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
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

const Pill = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
      className
    )}
  >
    {children}
  </span>
);

/**
 * The queue as a table.
 *
 * The landing view, and deliberately a scan rather than a conversation: the
 * columns are the four things that decide which ticket to open next — who it is
 * about, what kind of thing it is, who owns it, and how long it has been
 * waiting. The conversation is one click away and is where the work happens.
 *
 * Age is the only column that is coloured. Everything else is a fact; age is a
 * judgement, and 48 hours is where it stops being fine.
 */
export function TicketsTable({
  rows,
  onOpen,
  isLoading,
  isError,
  errorMessage,
  canRoute,
}: Props) {
  // One clock for every row, ticking on its own rather than on whatever
  // happens to re-render the table.
  const now = useNow();

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading tickets…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[#AD1F2A]">
        Couldn&apos;t load tickets.
        {errorMessage && (
          <div className="mt-1 text-xs text-red-800">{errorMessage}</div>
        )}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm text-gray-600">No tickets match these filters.</p>
        <p className="mt-1 text-xs text-gray-500">
          {canRoute
            ? "You're seeing your own tickets and everything still waiting to be assigned."
            : "You're seeing tickets assigned to you and ones you've been pulled onto."}
        </p>
      </div>
    );
  }

  return (
    // Without a min-width the table just squeezes eight columns into whatever
    // width it is given and there is nothing to scroll — the page shell clips
    // horizontal overflow, so the scrolling has to happen inside the table's
    // own container. Same pattern as every other table in the app.
    <Table className="min-w-[1120px]">
      <TableHeader>
        <TableRow className="border-gray-200 hover:bg-transparent">
          <TableHead className="w-[7.5rem] text-xs font-medium text-gray-500">
            Ref
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Subject
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Customer
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Type
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Category
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Status
          </TableHead>
          <TableHead className="text-xs font-medium text-gray-500">
            Assigned
          </TableHead>
          <TableHead className="w-16 text-right text-xs font-medium text-gray-500">
            Age
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const Icon = CHANNEL_ICON[r.channel];
          const affected = formatUser(r.user_affected);
          const isMerged = !!r.merged_into;
          const ageHours = ageInHours(r.createdAt, now);
          const isStale = r.status !== "resolved" && ageHours > 48;

          return (
            <TableRow
              key={r._id}
              onClick={() => onOpen(r)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(r);
                }
              }}
              className={cn(
                "cursor-pointer border-gray-100 focus:outline-none focus-visible:bg-[#E0F2F1]/50",
                isMerged && "opacity-60"
              )}
            >
              <TableCell className="align-top">
                <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums text-gray-600">
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-gray-400"
                    aria-label={CHANNEL_LABELS[r.channel]}
                  />
                  {r.ticket_ref}
                </span>
              </TableCell>

              <TableCell className="max-w-[22rem] align-top">
                <p className="truncate text-sm font-medium text-gray-900">
                  {r.subject}
                  {isMerged && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gray-400">
                      merged
                    </span>
                  )}
                </p>
                {r.issue && (
                  <span
                    className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-[#AD1F2A]"
                    title={`Blocked on ${r.issue.title}`}
                  >
                    <Link2 className="h-3 w-3" />
                    {r.issue.issue_ref}
                  </span>
                )}
              </TableCell>

              <TableCell className="max-w-[12rem] align-top">
                {affected ? (
                  <span className="block truncate text-sm text-gray-700">
                    {affected}
                  </span>
                ) : (
                  <span className="text-xs italic text-amber-700">
                    Not linked
                  </span>
                )}
              </TableCell>

              <TableCell className="align-top">
                {r.type ? (
                  <Pill className={TYPE_PILL_CLASS[r.type]}>
                    {TYPE_LABELS[r.type]}
                  </Pill>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </TableCell>

              <TableCell className="max-w-[10rem] align-top">
                <span className="block truncate text-xs text-gray-600">
                  {categoryLabel(r.category) ?? "—"}
                </span>
              </TableCell>

              <TableCell className="align-top">
                <Pill className={STATUS_PILL_CLASS[r.status]}>
                  {STATUS_LABELS[r.status]}
                </Pill>
              </TableCell>

              <TableCell className="max-w-[10rem] align-top">
                {r.assigned_admin ? (
                  <span
                    className="block truncate text-xs text-gray-600"
                    title={r.assigned_admin.email ?? undefined}
                  >
                    {r.assigned_admin.userName}
                  </span>
                ) : (
                  <span className="text-xs text-amber-700">Unassigned</span>
                )}
              </TableCell>

              <TableCell className="align-top text-right">
                <span
                  className={cn(
                    "inline-flex items-center justify-end gap-1 text-xs tabular-nums",
                    isStale ? "font-medium text-[#AD1F2A]" : "text-gray-500"
                  )}
                  title={new Date(r.createdAt).toLocaleString()}
                >
                  {isStale && <AlertTriangle className="h-3 w-3" />}
                  {formatAge(ageHours)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
