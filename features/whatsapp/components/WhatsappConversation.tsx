"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  BellOff,
  ChevronUp,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  contactName,
  FAILED_STATUSES,
  formatPhone,
  statusLabel,
  stepLabel,
} from "../lib/format";
import type {
  WhatsappContactIdentity,
  WhatsappMessage,
} from "../schemas/whatsapp.schema";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "./ContactAvatar";
import { DeliveryTicks } from "./DeliveryTicks";

/**
 * Media the customer sent, described from what we kept.
 *
 * The webhook stores Meta's media id and mime type and deliberately nothing
 * else — not the file, not the sender's filename. A Meta media id is not a url:
 * fetching it takes a server-side Graph call carrying the app token, and the
 * link that returns expires. So the pane names the attachment rather than
 * pretending it can show it; see the note in `MediaBlock`.
 */
const mediaKind = (message: WhatsappMessage) => {
  const mime = message.payload?.media_mime_type ?? "";
  const type = message.messageType ?? "";

  if (type === "image" || mime.startsWith("image/")) return "image" as const;
  if (type === "document" || mime === "application/pdf")
    return "document" as const;
  return null;
};

/**
 * `preview` is the backend's stand-in for an empty body — "[image]", "[buttons]".
 * Where a media block already says that visually, repeating the bracketed text
 * under it is noise, so the body falls back to nothing rather than the preview.
 */
const messageBody = (message: WhatsappMessage) =>
  message.text || (mediaKind(message) ? "" : message.preview || "—");

/**
 * Inbound statuses worth a word under the bubble. `received` is deliberately
 * absent: it means the handler hasn't reported back yet, and the useful signal
 * is the `failed` row, not a permanent tint on every message that arrived.
 */
const INBOUND_FLAGGED = new Set([
  "failed",
  "rate_limited",
  "skipped",
  "rejected",
]);

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
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Open a conversation at its newest message, the way opening a chat does.
   * Page 1 is the end of the transcript and later pages are older slices, but
   * both are read bottom-up — the row nearest the fold is the one that follows
   * on from what you were just reading — so every page lands at the bottom.
   */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || isLoading) return;
    node.scrollTop = node.scrollHeight;
  }, [contact?.phoneNumber, page, isLoading, messages.length]);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
          <h3 className="font-semibold">
            Couldn&apos;t load this conversation.
          </h3>
          <p className="mt-1 text-xs text-red-800">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <MessageSquare className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">Pick a conversation to read it.</p>
      </div>
    );
  }

  // Page 1 is the newest slice, so "older" exists on any page but the last.
  const hasOlder = page * limit < totalCount;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-3 lg:px-6">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="-ml-1 shrink-0 lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <ContactAvatar contact={contact} size="md" />

        <div className="min-w-0 flex-1">
          <h2 className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span className="truncate">{contactName(contact)}</span>
            {contact.isSuspended && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-[#AD1F2A]">
                Suspended
              </span>
            )}
            {contact.optedOut && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                <BellOff className="h-2.5 w-2.5" />
                Opted out
              </span>
            )}
            {contact.referralStatus && (
              <span className="rounded-full bg-[#E0F2F1] px-1.5 py-0.5 text-[10px] font-medium capitalize text-[#004D40]">
                {contact.referralStatus.replace(/-/g, " ")}
              </span>
            )}
          </h2>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            <span className="tabular-nums">
              {formatPhone(contact.phoneNumber)}
            </span>
            {contact.email && <span className="ml-2">{contact.email}</span>}
            {!contact.userId && (
              <span className="ml-2 text-amber-700">No matching account</span>
            )}
          </p>
        </div>

        {contact.userId && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/users/${contact.userId}`}>
              <span className="hidden sm:inline">View account</span>
              <ExternalLink className="h-3.5 w-3.5 sm:ml-1.5" />
            </Link>
          </Button>
        )}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F9FAFB] [scrollbar-width:thin]"
      >
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2 px-4 pb-6 pt-3 lg:px-8 lg:pt-4">
          {hasOlder && (
            <div className="flex justify-center pb-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-white text-xs"
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronUp className="mr-1 h-3.5 w-3.5" />
                Older messages
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
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

          {page > 1 && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-white text-xs"
                onClick={() => onPageChange(1)}
              >
                Jump to latest
              </Button>
            </div>
          )}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-center gap-1.5 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
        <Lock className="h-3 w-3 shrink-0" />
        <span>
          Read-only. {totalCount} message{totalCount === 1 ? "" : "s"} on
          record; messages are deleted after 90 days.
        </span>
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
  const failed = FAILED_STATUSES.has(message.status);
  const media = mediaKind(message);
  const body = messageBody(message);
  const step = stepLabel(message.conversationStep);

  // A transcript spanning days is unreadable without them, and page boundaries
  // mean the first row on any page needs one too.
  const showDayDivider =
    !previous || !isSameDay(new Date(previous.createdAt), timestamp);
  // Consecutive messages from the same side sit closer together.
  const continues =
    !showDayDivider && previous?.direction === message.direction;

  return (
    <>
      {showDayDivider && (
        <div className="flex items-center gap-3 py-3" role="separator">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400">
            {format(timestamp, "EEEE, d MMM yyyy")}
          </span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      <div
        className={cn(
          "flex",
          isOutbound ? "justify-end" : "justify-start",
          !continues && "mt-1.5",
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[15px] [overflow-wrap:anywhere]",
            isOutbound
              ? "rounded-br-md bg-[#E0F2F1] text-gray-900"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-900",
            failed && "border-l-2 border-l-[#AD1F2A]",
          )}
        >
          {message.templateName && (
            <p className="mb-1 text-[11px] font-medium text-[#00695C]">
              Template: {message.templateName.replace(/_/g, " ")}
            </p>
          )}

          {media && <MediaBlock message={message} kind={media} />}

          {body && (
            <p
              className={cn(
                "whitespace-pre-wrap break-words leading-relaxed",
                media && "mt-1.5",
              )}
            >
              {body}
            </p>
          )}

          {(message.error || message.errorCode) && (
            <p className="mt-1.5 flex items-start gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] text-[#AD1F2A]">
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
              <span className="break-words">
                {/* Meta's numeric reason is what support quotes and groups by. */}
                {message.errorCode ? (
                  <span className="font-semibold tabular-nums">
                    {message.errorCode}
                  </span>
                ) : null}
                {message.errorCode && message.error ? " · " : null}
                {message.error}
              </span>
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5 text-[11px] text-gray-500">
            {/* The step is what makes an out-of-context reply legible: a bare
                "YES" means nothing without "Confirming" beside it. */}
            {step && <span className="mr-auto text-gray-400">{step}</span>}
            {!isOutbound && INBOUND_FLAGGED.has(message.status) && (
              <span
                className={cn(
                  "font-medium",
                  failed ? "text-[#AD1F2A]" : "text-amber-700",
                )}
              >
                {statusLabel(message.status)}
              </span>
            )}
            <span className="tabular-nums">{format(timestamp, "HH:mm")}</span>
            {isOutbound && <DeliveryTicks status={message.status} />}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * An attachment named, not shown.
 *
 * Showing it is not a frontend change: the message log keeps Meta's media id and
 * mime type and nothing more, and that id only resolves through a server-side
 * Graph call carrying the app token, into a link that expires. Rendering the id
 * as a src would give every media message a broken-image icon, which reads as a
 * bug in the inbox rather than a deliberate limit on what is stored. The id is
 * surfaced because it is what a support request to the backend needs to quote.
 */
function MediaBlock({
  message,
  kind,
}: {
  message: WhatsappMessage;
  kind: "image" | "document";
}) {
  const Icon = kind === "image" ? ImageIcon : FileText;
  const mime = message.payload?.media_mime_type;
  const mediaId = message.payload?.media_id;

  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-[#F9FAFB] px-2.5 py-2 ring-1 ring-gray-200">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-gray-200">
        <Icon className="h-4 w-4 text-gray-500" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-900">
          {kind === "image" ? "Photo" : "Document"}
          {mime ? (
            <span className="ml-1 font-normal text-gray-500">{mime}</span>
          ) : null}
        </p>
        <p className="text-[11px] text-gray-500">
          Not stored here. WhatsApp keeps the file.
        </p>
        {mediaId && (
          <p
            className="mt-0.5 truncate text-[10px] tabular-nums text-gray-400"
            title="Meta media id"
          >
            ID {mediaId}
          </p>
        )}
      </div>
    </div>
  );
}
