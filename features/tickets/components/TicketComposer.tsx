"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Lock, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAddTicketNote } from "../hooks/use-ticket-mutations";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_REPLY_ATTACHMENTS,
  MAX_REPLY_TOTAL_BYTES,
  MIN_NOTE_LENGTH,
} from "../lib/ticket-errors";
import { useReplyToTicket } from "../hooks/use-ticket-reply";
import { CHANNEL_LABELS } from "../lib/ticket-display";
import { type TicketChannel } from "../schemas/ticket.schema";

interface Props {
  ticketId: string;
  channel: TicketChannel;
  mergedInto?: string | null;
}

type Mode = "reply" | "note";
const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx";

/**
 * Reply to the customer, or write for the record.
 *
 * The BE refuses a reply on a non-email ticket and on a merged one. Both
 * refusals are mirrored here so the operator learns it before writing, rather
 * than after — and in both cases the note field stays open, because "we phoned
 * her back" is exactly the thing that still needs recording.
 */
export function TicketComposer({ ticketId, channel, mergedInto }: Props) {
  const isEmail = channel === 'email';
  const isMerged = !!mergedInto;
  const canReply = isEmail && !isMerged;

  const [mode, setMode] = useState<Mode>(canReply ? "reply" : "note");
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reply = useReplyToTicket();
  const addNote = useAddTicketNote();
  const isPending = reply.isPending || addNote.isPending;

  // A ticket can stop being repliable while open (it gets merged), so the mode
  // is corrected at render rather than trusted from state.
  const activeMode: Mode = canReply ? mode : "note";

  // A note has a five-character floor server-side; a reply does not. Said here
  // so the button explains itself rather than the BE rejecting the click.
  const trimmed = body.trim();
  const canSend =
    activeMode === "note" ? trimmed.length >= MIN_NOTE_LENGTH : trimmed.length > 0;

  const handleSend = async () => {
    const text = body.trim();
    if (!text || isPending) return;
    try {
      if (activeMode === "reply") {
        await reply.mutateAsync({ ticketId, body: text, cc: cc.split(",").map((address) => address.trim()).filter(Boolean), files });
        toast.success("Reply sent to the customer");
      } else {
        await addNote.mutateAsync({ ticketId, body: text });
        toast.success("Note added");
      }
      setBody("");
      setCc("");
      setFiles([]);
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

  // The BE's limits, checked as files are picked rather than after the upload
  // the BE would then refuse.
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    let total = next.reduce((sum, file) => sum + file.size, 0);
    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_REPLY_ATTACHMENTS) {
        toast.error(`You can attach at most ${MAX_REPLY_ATTACHMENTS} files`);
        break;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} is larger than 15MB`);
        continue;
      }
      if (next.some((current) => current.name === file.name && current.size === file.size)) {
        continue;
      }
      if (total + file.size > MAX_REPLY_TOTAL_BYTES) {
        toast.error(`${file.name} would take the attachments past 25MB in total`);
        continue;
      }
      next.push(file);
      total += file.size;
    }
    setFiles(next);
    // Cleared so picking the same file again, after removing it, still fires.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    // The composer sits under the timeline in a fixed-height column. It may
    // take up to two-thirds of that column, and shrinks rather than overflow
    // it; only the reply box gives way inside it, so the mode tabs, CC field,
    // attachments and Attach/Send row always stay in view, however long the
    // reply.
    <div className="border-t border-gray-200 bg-gray-50/60 p-3 flex flex-col gap-2 min-h-0 max-h-[66%]">
      <div className="flex items-center gap-1.5 shrink-0">
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
        <p className="shrink-0 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
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

      {activeMode === "reply" && <label className="block shrink-0 text-xs text-gray-600">CC for this reply (optional, comma-separated)
        <input type="text" value={cc} onChange={(event) => setCc(event.target.value)} disabled={isPending} placeholder="colleague@example.com" className="mt-1 w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900" />
      </label>}

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
        // The shared Textarea grows with its content (field-sizing-content).
        // A window-height cap (max-h-[40vh]) wasn't enough: the panel is far
        // shorter than the window, so the box still pushed the Send row out.
        // Instead it is the one part of the composer that shrinks (down to
        // about three lines) and scrolls inside itself past that.
        className={cn(
          "text-sm resize-none bg-white min-h-18 shrink overflow-y-auto",
          activeMode === "note" && "border-amber-200 focus-visible:ring-amber-400"
        )}
      />

      {/* Capped and scrolling, so five long filenames cannot push the Send
          row out the way a long reply used to. */}
      {activeMode === "reply" && files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 shrink-0 max-h-16 overflow-y-auto">
          {files.map((file) => (
            <span
              key={`${file.name}-${file.size}`}
              className="inline-flex max-w-full items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="max-w-48 truncate">{file.name}</span>
              <span className="text-gray-400">{Math.max(1, Math.round(file.size / 1024))} KB</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles((current) => current.filter((f) => f !== file))}
                disabled={isPending}
                className="ml-0.5 text-gray-400 hover:text-[#AD1F2A]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-[10px] text-gray-500">
          {activeMode === "reply"
            ? "Sent as email, threaded so their answer returns to this ticket."
            : "Never sent to the customer."}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          {/* A note is never sent, so there is nothing to attach it to. */}
          {activeMode === "reply" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || files.length >= MAX_REPLY_ATTACHMENTS}
                title="Attach files (at most 5, 15MB each, 25MB in total)"
              >
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                Attach
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSend} disabled={!canSend || isPending}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            {activeMode === "reply" ? "Send" : "Add note"}
          </Button>
        </div>
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
