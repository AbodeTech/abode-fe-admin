"use client";

import {
  differenceInCalendarDays,
  format,
  isToday,
  isYesterday,
} from "date-fns";
import {
  BellOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessagesSquare,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { contactName, stepLabel } from "../lib/format";
import type { WhatsappContact } from "../schemas/whatsapp.schema";
import { Input } from "@/components/ui/input";
import { ContactAvatar } from "./ContactAvatar";
import { DeliveryTicks } from "./DeliveryTicks";

type Group = "Today" | "Yesterday" | "Last 7 days" | "Older";
const GROUPS: Group[] = ["Today", "Yesterday", "Last 7 days", "Older"];

/** Same buckets as the customer-side Amaris history, in the viewer's local time. */
function groupOf(date: Date): Group {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return differenceInCalendarDays(new Date(), date) < 7
    ? "Last 7 days"
    : "Older";
}

/** The group heading already says the day, so the row only needs what's left. */
function timeLabel(date: Date, group: Group) {
  if (group === "Today" || group === "Yesterday")
    return format(date, "h:mm a").toLowerCase();
  if (group === "Last 7 days") return format(date, "EEE");
  return format(date, "d MMM");
}

interface Props {
  contacts: WhatsappContact[];
  selected: string | null;
  onSelect: (phoneNumber: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  unresolvedOnly: boolean;
  onUnresolvedOnlyChange: (value: boolean) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

/**
 * The left column: heading, filters and who has been talking to the Abode
 * number, grouped by day. It sits on the page background rather than in a
 * card — only the transcript is a card — following the customer-side Amaris
 * page, so the two read as the same product.
 */
export function WhatsappContactList({
  contacts,
  selected,
  onSelect,
  search,
  onSearchChange,
  unresolvedOnly,
  onUnresolvedOnlyChange,
  page,
  limit,
  total,
  onPageChange,
  isLoading,
  isFetching,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const dated = contacts.map((contact) => ({
    contact,
    date: contact.lastMessageAt ? new Date(contact.lastMessageAt) : null,
  }));
  const groups = GROUPS.map((group) => ({
    group,
    rows: dated.filter((row) => row.date && groupOf(row.date) === group),
  })).filter((g) => g.rows.length > 0);
  // A contact with no timestamp can't be bucketed; keep it rather than lose it.
  const undated = dated.filter((row) => !row.date);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 px-1 pb-4">
        {/* The same 64px band as the transcript card's header, so the page
            title and the open contact sit on one line across the layout. */}
        <div className="mt-px flex h-16 items-center gap-2 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">WhatsApp</h1>
          {!isLoading && total > 0 && (
            <span
              className="rounded-full bg-[#E0F2F1] px-2 py-0.5 text-xs font-medium tabular-nums text-[#004D40]"
              aria-label={`${total} conversations`}
            >
              {total}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by phone number"
            inputMode="tel"
            maxLength={20}
            className="h-10 bg-white pl-8 text-sm"
            aria-label="Search WhatsApp conversations by phone number"
          />
          {isFetching && !isLoading && (
            <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        <div
          role="radiogroup"
          aria-label="Which conversations to show"
          className="grid grid-cols-2 rounded-lg bg-gray-200/60 p-0.5 text-[13px] font-medium"
        >
          {[
            { value: false, label: "All" },
            { value: true, label: "Needs attention" },
          ].map((option) => {
            const active = unresolvedOnly === option.value;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onUnresolvedOnlyChange(option.value)}
                className={cn(
                  "rounded-md px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00695C]/40",
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        {isLoading ? (
          <div
            className="flex flex-col gap-4 px-2 pt-2"
            aria-label="Loading conversations"
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <span className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                </span>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="mt-1 flex flex-col items-start gap-1.5 rounded-lg bg-white p-4 ring-1 ring-gray-200">
            <span className="mb-1 grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-gray-500">
              <MessagesSquare className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-gray-900">
              {search
                ? "No number matches"
                : unresolvedOnly
                  ? "Nothing needs attention"
                  : "No messages yet"}
            </p>
            <p className="text-[13px] leading-snug text-gray-500">
              {search
                ? "Check the digits, or search part of the number."
                : unresolvedOnly
                  ? "Every recent message went through."
                  : "Conversations show up here once someone messages the Abode number."}
            </p>
          </div>
        ) : (
          <>
            {groups.map(({ group, rows }) => (
              <section key={group}>
                <h2 className="mx-2 mb-1 mt-3 text-[13px] font-medium text-gray-500 first:mt-0">
                  {group}
                </h2>
                <ul className="space-y-0.5">
                  {rows.map(({ contact, date }) => (
                    <ContactRow
                      key={contact.phoneNumber}
                      contact={contact}
                      time={date ? timeLabel(date, group) : ""}
                      active={contact.phoneNumber === selected}
                      onSelect={() => onSelect(contact.phoneNumber)}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {undated.length > 0 && (
              <ul className="mt-3 space-y-0.5">
                {undated.map(({ contact }) => (
                  <ContactRow
                    key={contact.phoneNumber}
                    contact={contact}
                    time=""
                    active={contact.phoneNumber === selected}
                    onSelect={() => onSelect(contact.phoneNumber)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 px-1 pt-2.5">
        <span className="text-[13px] tabular-nums text-gray-500">
          {isLoading
            ? "…"
            : total === 0
              ? "No conversations"
              : `${from}–${to} of ${total}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
              className="grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-gray-200/60 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00695C]/40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
              className="grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-gray-200/60 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00695C]/40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

function ContactRow({
  contact,
  time,
  active,
  onSelect,
}: {
  contact: WhatsappContact;
  time: string;
  active: boolean;
  onSelect: () => void;
}) {
  const step = stepLabel(contact.conversationStep);
  const outbound = contact.lastMessageDirection === "outbound";
  const hasTags = contact.failedCount > 0 || contact.optedOut || !!step;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full gap-3 rounded-lg px-2 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00695C]/40",
          active
            ? "bg-[#E0F2F1]/70"
            : "hover:bg-gray-100",
        )}
      >
        <ContactAvatar contact={contact} />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {contactName(contact)}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">
              {time}
            </span>
          </span>

          <span className="mt-0.5 flex items-center gap-1 text-[13px] text-gray-500">
            {outbound && <DeliveryTicks status={contact.lastMessageStatus} />}
            <span className="truncate">
              {contact.lastMessagePreview || "No text"}
            </span>
          </span>

          {hasTags && (
            <span className="mt-1.5 flex flex-wrap items-center gap-1">
              {contact.failedCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-[#AD1F2A]">
                  {contact.failedCount} failed
                </span>
              )}
              {step && (
                <span className="inline-flex items-center rounded-full bg-[#E0F2F1] px-1.5 py-0.5 text-[10px] font-medium text-[#004D40]">
                  {step}
                </span>
              )}
              {contact.optedOut && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                  <BellOff className="h-2.5 w-2.5" />
                  Opted out
                </span>
              )}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
