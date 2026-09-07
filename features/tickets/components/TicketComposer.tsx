"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TicketChannel } from "@/lib/gql/graphql";
import { useAddTicketNote } from "../hooks/use-ticket-mutations";
import { useReplyToTicket } from "../hooks/use-ticket-reply";
import { CHANNEL_LABELS } from "../lib/ticket-display";

interface Props {
  ticketId: string;
  channel: TicketChannel;
  mergedInto?: string | null;
}

type Mode = "reply" | "note";

/**
 * Reply to the customer, or write for the record.
 *
 * The BE refuses a reply on a non-email ticket and on a merged one. Both
 * refusals are mirrored here so the operator learns it before writing, rather
 * than after — and in both cases the note field stays open, because "we phoned
 * her back" is exactly the thing that still needs recording.
 */
export function TicketComposer({ ticketId, channel, mergedInto }: Props) {
  const isEmail = channel === TicketChannel.Email;
  const isMerged = !!mergedInto;
  const canReply = isEmail && !isMerged;

  const [mode, setMode] = useState<Mode>(canReply ? "reply" : "note");
  const [body, setBody] = useState("");

  const reply = useReplyToTicket();
  const addNote = useAddTicketNote();
  const isPending = reply.isPending || addNote.isPending;

  // A ticket can stop being repliable while open (it gets merged), so the mode
  // is corrected at render rather than trusted from state.
  const activeMode: Mode = canReply ? mode : "note";

  const handleSend = async () => {
    const text = body.trim();
    if (!text || isPending) return;
    try {
      if (activeMode === "reply") {
        await reply.mutateAsync({ ticketId, body: text });
        toast.success("Reply sent to the customer");
      } else {
        await addNote.mutateAsync({ ticketId, body: text });
        toast.success("Note added");
      }
      setBody("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : activeMode === "reply"
            ? "Failed to send reply"
            : "Failed to add note"
      );
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50/60 p-3 space-y-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <ModeTab
          active={activeMode === "reply"}
          disabled={!canReply}
          onClick={() => setMode("reply")}
          title={
            isMerged
              ? "This ticket was merged — reply on the one it was merged into"
              : !isEmail
                ? `This ticket came in by ${CHANNEL_LABELS[channel]} — there is no address to reply to`
                : undefined
          }
        >
          Reply to customer
        </ModeTab>
        <ModeTab active={activeMode === "note"} onClick={() => setMode("note")}>
          <Lock className="h-3 w-3 mr-1" />
          Internal note
        </ModeTab>
      </div>

      {!canReply && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          {isMerged ? (
            <>
              This ticket was merged.{" "}
              <Link
                href={`/tickets?ticket=${mergedInto}`}
                className="underline hover:text-[#AD1F2A]"
              >
                Reply on the ticket it was merged into
              </Link>
              . A note here still records against this one.
            </>
          ) : (
            <>
              Came in by {CHANNEL_LABELS[channel]}, so there is no address to
              reply to. Log what you told them as a note.
            </>
          )}
        </p>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Send on ⌘/Ctrl+Enter. Plain Enter stays a newline — these are
          // emails to customers, not chat lines.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={3}
        disabled={isPending}
        placeholder={
          activeMode === "reply"
            ? "Write to the customer — this is sent as an email"
            : "Internal note — visible to admins only"
        }
        className={cn(
          "text-sm resize-none bg-white",
          activeMode === "note" && "border-amber-200 focus-visible:ring-amber-400"
        )}
      />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500">
          {activeMode === "reply"
            ? "Sent as email, threaded so their answer returns to this ticket."
            : "Never sent to the customer."}
        </p>
        <Button size="sm" onClick={handleSend} disabled={!body.trim() || isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5 mr-1.5" />
          )}
          {activeMode === "reply" ? "Send reply" : "Add note"}
        </Button>
      </div>
    </div>
  );
}

function ModeTab({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs border transition-colors",
        active
          ? "bg-[#00695C] text-white border-[#00695C]"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300",
        disabled && "opacity-40 cursor-not-allowed hover:border-gray-200"
      )}
    >
      {children}
    </button>
  );
}
