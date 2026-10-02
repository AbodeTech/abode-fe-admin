"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Lock, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { uploadTicketAttachment } from "@/lib/utils/upload";
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
const MAX_FILES = 5;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
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
  const isEmail = channel === TicketChannel.Email;
  const isMerged = !!mergedInto;
  const canReply = isEmail && !isMerged;

  const [mode, setMode] = useState<Mode>(canReply ? "reply" : "note");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reply = useReplyToTicket();
  const addNote = useAddTicketNote();
  const isPending = reply.isPending || addNote.isPending || isUploading;

  // A ticket can stop being repliable while open (it gets merged), so the mode
  // is corrected at render rather than trusted from state.
  const activeMode: Mode = canReply ? mode : "note";

  const handleSend = async () => {
    const text = body.trim();
    if (!text || isPending) return;
    try {
      if (activeMode === "reply") {
        setIsUploading(true);
        const attachments = await Promise.all(
          files.map(async (file) => {
            const uploaded = await uploadTicketAttachment(
              file,
              `support-tickets/outbound/${ticketId}`
            );
            return {
              url: uploaded.secure_url ?? uploaded.url,
              filename: file.name,
              mime: file.type || "application/octet-stream",
              size: uploaded.bytes ?? file.size,
              public_id: uploaded.public_id,
              resource_type: uploaded.resource_type ?? "raw",
              format: uploaded.format ?? file.name.split(".").pop() ?? "",
            };
          })
        );
        await reply.mutateAsync({ ticketId, body: text, attachments });
        toast.success("Reply sent to the customer");
      } else {
        await addNote.mutateAsync({ ticketId, body: text });
        toast.success("Note added");
      }
      setBody("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : activeMode === "reply"
            ? "Failed to send reply"
            : "Failed to add note"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        toast.error(`You can attach at most ${MAX_FILES} files`);
        break;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 15MB`);
        continue;
      }
      if (!next.some((current) => current.name === file.name && current.size === file.size)) {
        next.push(file);
      }
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        // The shared Textarea grows with its content (field-sizing-content) and
        // has no ceiling, while this composer is shrink-0 at the foot of a
        // fixed-height column. A long reply grew the box past the bottom of the
        // panel and took the Send button with it. Capped here, so it still
        // grows for an ordinary reply and scrolls inside itself after that —
        // the button below stays on screen however much is written.
        className={cn(
          "text-sm resize-none bg-white max-h-[40vh] overflow-y-auto",
          activeMode === "note" && "border-amber-200 focus-visible:ring-amber-400"
        )}
      />

      {activeMode === "reply" && files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((file, index) => (
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
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                disabled={isPending}
                className="ml-0.5 text-gray-400 hover:text-[#AD1F2A]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500">
          {activeMode === "reply"
            ? "Sent as email, threaded so their answer returns to this ticket."
            : "Never sent to the customer."}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
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
                disabled={isPending || files.length >= MAX_FILES}
                title="Attach files (maximum 5, 15MB each)"
              >
                <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                Attach
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSend} disabled={!body.trim() || isPending}>
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
