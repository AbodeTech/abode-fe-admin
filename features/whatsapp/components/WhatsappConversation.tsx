"use client";

import { format, isSameDay } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  BellOff,
  ChevronUp,
  ExternalLink,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  WhatsappContactIdentity,
  WhatsappMessage,
} from "../hooks/use-whatsapp-conversation";
import { contactName, formatPhone } from "./WhatsappContactList";

/**
 * Statuses worth colouring. `received` is deliberately absent: it means the
 * webhook wrote the row and the handler has not reported back, which for any
 * message older than a second or two is itself a sign the handler died — but the
 * useful signal there is the `failed` row, not a permanent amber tint on every
 * message that arrived.
 */
const STATUS_STYLES: Record<string, string> = {
  failed: "bg-red-100 text-red-800",
  rate_limited: "bg-red-100 text-red-800",
  skipped: "bg-amber-100 text-amber-800",
  rejected: "bg-amber-100 text-amber-800",
};

const messageBody = (message: WhatsappMessage) =>
  message.text || message.preview || "—";

interface Props {
  contact: WhatsappContactIdentity | null;
  messages: WhatsappMessage[];
  totalCount: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onBack?: () => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function WhatsappConversation({
  contact,
  messages,
  totalCount,
  page,
  limit,
  onPageChange,
  onBack,
  isLoading,
  error,
}: Props) {
  if (!contact && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Pick a conversation to read it.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          <h3 className="font-semibold">Could not load this conversation</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Page 1 is the newest slice, so "older" exists on any page but the last.
  const hasOlder = page * limit < totalCount;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start gap-3 border-b border-border p-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="min-w-0 flex-1">
          {contact && (
            <>
              <h2 className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                <span className="truncate">{contactName(contact)}</span>
                {contact.isSuspended && (
                  <Badge className="bg-red-100 text-[10px] text-red-800">
                    Suspended
                  </Badge>
                )}
                {contact.optedOut && (
                  <Badge className="gap-1 bg-gray-200 text-[10px] text-gray-800">
                    <BellOff className="h-2.5 w-2.5" />
                    Opted out
                  </Badge>
                )}
                {contact.referralStatus && (
                  <Badge className="bg-blue-100 text-[10px] text-blue-800">
                    {contact.referralStatus}
                  </Badge>
                )}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatPhone(contact.phoneNumber)}
                {contact.email ? ` · ${contact.email}` : ""}
                {!contact.userId && " · no matching account"}
              </p>
            </>
          )}
        </div>

        {contact?.userId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/users/${contact.userId}`}>
              View account
              <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {hasOlder && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronUp className="mr-1.5 h-3 w-3" />
                  Older messages
                </Button>
              </div>
            )}
            {page > 1 && (
              <p className="text-center text-xs text-muted-foreground">
                Showing older history — {" "}
                <button
                  type="button"
                  onClick={() => onPageChange(1)}
                  className="underline"
                >
                  jump to the latest
                </button>
              </p>
            )}

            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No messages on this page.
              </p>
            ) : (
              messages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  previous={messages[index - 1]}
                />
              ))
            )}
          </>
        )}
      </div>

      <footer className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        {totalCount} message{totalCount === 1 ? "" : "s"} on record. Messages age
        out after 90 days.
      </footer>
    </div>
  );
}

function MessageRow({
  message,
  previous,
}: {
  message: WhatsappMessage;
  previous?: WhatsappMessage;
}) {
  const timestamp = new Date(message.createdAt);
  const isOutbound = message.direction === "outbound";
  const statusStyle = STATUS_STYLES[message.status];

  // A transcript spanning days is unreadable without them, and page boundaries
  // mean the first row on any page needs one too.
  const showDayDivider =
    !previous || !isSameDay(new Date(previous.createdAt), timestamp);

  return (
    <>
      {showDayDivider && (
        <div className="flex justify-center py-1">
          <span className="rounded-full bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {format(timestamp, "EEEE, d MMM yyyy")}
          </span>
        </div>
      )}

      <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[min(36rem,85%)] rounded-lg px-3 py-2 text-sm shadow-sm",
            isOutbound
              ? "rounded-br-sm bg-emerald-50 text-foreground"
              : "rounded-bl-sm bg-background text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{messageBody(message)}</p>

          {message.templateName && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Template: {message.templateName}
            </p>
          )}

          {message.error && (
            <p className="mt-1.5 flex items-start gap-1 rounded bg-red-50 px-1.5 py-1 text-[11px] text-red-700">
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
              <span className="break-words">{message.error}</span>
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{format(timestamp, "HH:mm")}</span>
            {statusStyle && (
              <Badge className={cn("px-1.5 py-0 text-[10px]", statusStyle)}>
                {message.status}
              </Badge>
            )}
            {/* The step is what makes an out-of-context reply legible: a bare
                "YES" means nothing without CONFIRMING beside it. */}
            {message.conversationStep && message.conversationStep !== "IDLE" && (
              <span className="font-mono">{message.conversationStep}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
