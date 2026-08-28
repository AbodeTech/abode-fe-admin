"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, BellOff, Loader2, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { WhatsappContact } from "../hooks/use-whatsapp-contacts";

/**
 * A number that matched no account, or matched several, comes back with no name
 * at all — see the backend's identity rule. Showing the number in the name slot
 * is honest about that; inventing "Unknown" would read as a fact about the
 * customer rather than about our records.
 */
export const contactName = (contact: {
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
}) => {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  return name || formatPhone(contact.phoneNumber);
};

/** Meta sends E.164 without a plus; the plus is what makes it read as a number. */
export const formatPhone = (phoneNumber: string) =>
  phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

const relativeTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  // Absolute past a week: "8 days ago" stops being the useful framing once the
  // question shifts from "is this live?" to "when was this?".
  const age = Date.now() - date.getTime();
  return age > 7 * 24 * 60 * 60 * 1000
    ? format(date, "d MMM")
    : formatDistanceToNowStrict(date, { addSuffix: true });
};

interface Props {
  contacts: WhatsappContact[];
  selected: string | null;
  onSelect: (phoneNumber: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  unresolvedOnly: boolean;
  onUnresolvedOnlyChange: (value: boolean) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  count: number;
}

export function WhatsappContactList({
  contacts,
  selected,
  onSelect,
  search,
  onSearchChange,
  unresolvedOnly,
  onUnresolvedOnlyChange,
  isLoading,
  isFetching,
  count,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Conversations
            {!isLoading && (
              <span className="ml-2 font-normal text-muted-foreground">{count}</span>
            )}
          </h2>
          {isFetching && !isLoading && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by phone number"
            className="pl-9"
            aria-label="Search WhatsApp conversations by phone number"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={unresolvedOnly}
            onChange={(event) => onUnresolvedOnlyChange(event.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Only conversations with a failed or rate-limited message
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {search || unresolvedOnly
              ? "No conversations match this filter."
              : "No WhatsApp messages recorded yet."}
          </p>
        ) : (
          <ul>
            {contacts.map((contact) => {
              const isSelected = contact.phoneNumber === selected;

              return (
                <li key={contact.phoneNumber}>
                  <button
                    type="button"
                    onClick={() => onSelect(contact.phoneNumber)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/60",
                      isSelected && "bg-muted"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                        <span className="truncate">{contactName(contact)}</span>
                        {contact.userId && (
                          <User
                            className="h-3 w-3 shrink-0 text-muted-foreground"
                            aria-label="Matched to an account"
                          />
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {relativeTime(contact.lastMessageAt)}
                      </span>
                    </div>

                    <p className="truncate text-xs text-muted-foreground">
                      {/* Whose turn it was is most of the meaning of a preview. */}
                      {contact.lastMessageDirection === "outbound" && (
                        <span className="text-foreground/70">You: </span>
                      )}
                      {contact.lastMessagePreview || "—"}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {formatPhone(contact.phoneNumber)} · {contact.messageCount} msg
                      </span>
                      {contact.failedCount > 0 && (
                        <Badge className="gap-1 bg-red-100 px-1.5 py-0 text-[10px] text-red-800">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {contact.failedCount}
                        </Badge>
                      )}
                      {contact.optedOut && (
                        <Badge className="gap-1 bg-gray-200 px-1.5 py-0 text-[10px] text-gray-800">
                          <BellOff className="h-2.5 w-2.5" />
                          Opted out
                        </Badge>
                      )}
                      {contact.conversationStep &&
                        contact.conversationStep !== "IDLE" && (
                          <Badge className="bg-blue-100 px-1.5 py-0 text-[10px] text-blue-800">
                            {contact.conversationStep}
                          </Badge>
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
