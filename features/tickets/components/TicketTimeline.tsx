"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { AlertTriangle, Loader2, Lock, MailWarning, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FragmentType, graphql, useFragment } from "@/lib/gql";
import {
  MatchSignal,
  MessageDeliveryStatus,
  MessageDirection,
  type TicketTimeline_MessageFragment,
  type TicketTimeline_NoteFragment,
} from "@/lib/gql/graphql";

/**
 * The conversation, and the internal record, in one column.
 *
 * A ticket carries two streams — what we said to the customer (`messages`) and
 * what we said to each other (`notes`). Keeping them in separate sections, as
 * the old drawer did, means reconstructing "we promised them X, then found out
 * Y" by reading two lists against a clock. Interleaved they read as one
 * account, which is the reason for this redesign.
 *
 * Notes are styled to be unmistakably internal. The cost of a colleague
 * mistaking a note for something the customer saw is far higher than the cost
 * of the timeline looking busy.
 */

export const TicketTimeline_message = graphql(`
  fragment TicketTimeline_message on TicketMessage {
    _id
    direction
    channel
    body
    from_address
    sent_at
    author_admin { _id userName email }
    author_user { _id firstName lastName email }
    delivery { status error }
    match { signal conflict }
  }
`);

export const TicketTimeline_note = graphql(`
  fragment TicketTimeline_note on TicketNote {
    _id
    body
    createdAt
    admin { _id userName email }
  }
`);

type Message = TicketTimeline_MessageFragment;
type Note = TicketTimeline_NoteFragment;

interface Props {
  messages: readonly FragmentType<typeof TicketTimeline_message>[];
  notes: readonly FragmentType<typeof TicketTimeline_note>[];
  /** Re-scroll to the newest entry when the open ticket changes. */
  ticketId: string;
  /**
   * Shown as the opening message when `messages` is empty. Ingestion writes a
   * message per ticket, but a ticket logged by hand before the backfill ran has
   * none — and a conversation view that renders nothing for those would read as
   * "no complaint here" rather than "this predates threading".
   */
  fallbackBody?: string | null;
  fallbackAt?: string | null;
  fallbackFrom?: string | null;
}

type Entry =
  | { kind: "message"; at: Date; key: string; data: Message }
  | { kind: "note"; at: Date; key: string; data: Note }
  | { kind: "fallback"; at: Date; key: string; body: string; from?: string | null };

const dayLabel = (d: Date) => {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMMM yyyy");
};

const adminName = (a?: { userName?: string | null; email?: string | null } | null) =>
  a?.userName || a?.email || "Unknown admin";

const userName = (
  u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
) => {
  if (!u) return null;
  const name = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  return name || u.email || null;
};

/** Only worth surfacing when something other than the obvious happened. */
const MATCH_NOTE: Partial<Record<MatchSignal, string>> = {
  [MatchSignal.Headers]: "Threaded by mail headers",
  [MatchSignal.ReplyAddress]: "Matched by the reply address",
  [MatchSignal.SubjectTag]: "Matched by the subject tag",
  [MatchSignal.Manual]: "Placed on this ticket by hand",
};

export function TicketTimeline({
  messages,
  notes,
  ticketId,
  fallbackBody,
  fallbackAt,
  fallbackFrom,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgs = useFragment(TicketTimeline_message, messages);
  const nts = useFragment(TicketTimeline_note, notes);

  const entries: Entry[] = [
    ...msgs.map<Entry>((m) => ({
      kind: "message",
      at: new Date(m.sent_at),
      key: `m-${m._id}`,
      data: m,
    })),
    ...nts.map<Entry>((n) => ({
      kind: "note",
      at: new Date(n.createdAt),
      key: `n-${n._id}`,
      data: n,
    })),
  ];

  // Needs a real timestamp to place it — `createdAt` always has one, and
  // inventing `now` here would both lie and re-render unstably.
  if (msgs.length === 0 && fallbackBody && fallbackAt) {
    entries.push({
      kind: "fallback",
      at: new Date(fallbackAt),
      key: "fallback",
      body: fallbackBody,
      from: fallbackFrom,
    });
  }

  entries.sort((a, b) => a.at.getTime() - b.at.getTime());

  /**
   * Open at the newest entry, the way opening a chat does. Keyed on the ticket
   * and the entry count so sending a reply scrolls to it, but re-rendering for
   * an unrelated reason does not yank the reader back down.
   */
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [ticketId, entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-400">
          Nothing on this ticket yet.
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {entries.map((entry, i) => {
        const prev = entries[i - 1];
        const newDay = !prev || !isSameDay(prev.at, entry.at);
        return (
          <div key={entry.key} className="space-y-3">
            {newDay && <DaySeparator label={dayLabel(entry.at)} />}
            {entry.kind === "note" ? (
              <NoteRow note={entry.data} at={entry.at} />
            ) : entry.kind === "fallback" ? (
              <MessageBubble
                inbound
                body={entry.body}
                at={entry.at}
                author={entry.from ?? "the customer"}
                legacy
              />
            ) : (
              <MessageRow message={entry.data} at={entry.at} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">
        {label}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function MessageRow({ message, at }: { message: Message; at: Date }) {
  const inbound = message.direction === MessageDirection.Inbound;
  const author = inbound
    ? userName(message.author_user) ?? message.from_address ?? "the customer"
    : adminName(message.author_admin);

  const delivery = message.delivery;
  const failed = delivery?.status === MessageDeliveryStatus.Failed;
  const pending = delivery?.status === MessageDeliveryStatus.Pending;
  const matchNote = message.match ? MATCH_NOTE[message.match.signal] : undefined;

  return (
    <MessageBubble
      inbound={inbound}
      body={message.body}
      at={at}
      author={author}
      channel={message.channel}
      failed={failed}
      failedReason={delivery?.error ?? null}
      pending={pending}
      matchNote={matchNote}
      conflict={message.match?.conflict}
    />
  );
}

function MessageBubble({
  inbound,
  body,
  at,
  author,
  channel,
  failed,
  failedReason,
  pending,
  matchNote,
  conflict,
  legacy,
}: {
  inbound: boolean;
  body: string;
  at: Date;
  author: string;
  channel?: string;
  failed?: boolean;
  failedReason?: string | null;
  pending?: boolean;
  matchNote?: string;
  conflict?: boolean;
  legacy?: boolean;
}) {
  return (
    <div className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[80%] min-w-0", inbound ? "items-start" : "items-end")}>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px] mb-1",
            inbound ? "text-gray-500" : "text-gray-500 justify-end"
          )}
        >
          <span className="font-medium truncate">{author}</span>
          <span>· {format(at, "HH:mm")}</span>
          {channel && channel !== "email" && (
            <span className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
              {channel.replace("_", "-")}
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
            /* A failed reply must not read as a sent one. Red border rather
               than a tint, so the text stays legible while the row is clearly
               not "done". */
            failed
              ? "border border-red-300 bg-red-50 text-red-950"
              : inbound
                ? "bg-gray-100 text-gray-900"
                : "bg-[#E0F2F1] text-gray-900",
            pending && "opacity-70"
          )}
        >
          {body || <span className="text-gray-400 italic">(empty message)</span>}
        </div>

        {legacy && (
          <p className="text-[10px] text-gray-400 mt-1">
            Logged before threading — the ticket body, shown as the opening message.
          </p>
        )}

        {pending && (
          <p className="flex items-center gap-1 text-[10px] text-gray-500 mt-1 justify-end">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Sending…
          </p>
        )}

        {failed && (
          <p className="flex items-start gap-1 text-[10px] text-[#AD1F2A] mt-1 justify-end text-right">
            <MailWarning className="h-3 w-3 shrink-0 mt-px" />
            <span>
              <span className="font-medium">Not delivered.</span>
              {failedReason ? ` ${failedReason}` : " The customer did not receive this."}
            </span>
          </p>
        )}

        {matchNote && (
          <p
            className="flex items-center gap-1 text-[10px] text-gray-400 mt-1"
            title="How this message was tied to this ticket"
          >
            <Link2 className="h-2.5 w-2.5" />
            {matchNote}
          </p>
        )}

        {conflict && (
          <p className="flex items-center gap-1 text-[10px] text-amber-700 mt-1">
            <AlertTriangle className="h-2.5 w-2.5" />
            Two signals named different tickets — the header won.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Full width and visually unlike either bubble, because the one mistake worth
 * designing against is reading an internal note as something the customer saw.
 */
function NoteRow({ note, at }: { note: Note; at: Date }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] text-amber-800 mb-1">
        <Lock className="h-2.5 w-2.5" />
        <span className="font-medium uppercase tracking-wide">Internal note</span>
        <span>· {adminName(note.admin)}</span>
        <span>· {format(at, "HH:mm")}</span>
      </div>
      <p className="text-sm text-amber-950 whitespace-pre-wrap break-words">
        {note.body}
      </p>
    </div>
  );
}
