"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  MessageSquarePlus,
  CheckCircle2,
  User2,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Circle,
  ExternalLink,
  Paperclip,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TicketChannel, TicketStatus } from "@/lib/gql/graphql";
import { useTicket } from "../hooks/use-tickets";
import {
  useAddTicketNote,
  useResolveTicket,
  useUpdateTicket,
  useUnlinkTicketFromIssue,
} from "../hooks/use-ticket-mutations";
import { AssignAdminDialog } from "./AssignAdminDialog";
import { AssignAffectedUserDialog } from "./AssignAffectedUserDialog";
import { LinkTicketToIssueDialog } from "./LinkTicketToIssueDialog";
import Link from "next/link";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_PILL_CLASS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_PILL_CLASS,
} from "../lib/ticket-display";

interface Props {
  ticketId: string | null;
  onClose: () => void;
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

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const displayUser = (u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
  if (!u) return null;
  const name = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  return name || u.email || null;
};

/**
 * Right-side drawer showing a ticket in full — body, notes thread,
 * duplicates (the cheap stand-in for threading), csManager context,
 * and the resolve/add-note/status controls.
 */
export function TicketDetailDrawer({ ticketId, onClose }: Props) {
  const { data, isLoading, isError, error } = useTicket(ticketId);
  const [noteBody, setNoteBody] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [assignUserOpen, setAssignUserOpen] = useState(false);
  const [linkIssueOpen, setLinkIssueOpen] = useState(false);

  const addNote = useAddTicketNote();
  const resolveTicket = useResolveTicket();
  const updateTicket = useUpdateTicket();
  const unlinkIssue = useUnlinkTicketFromIssue();

  const handleUnlinkIssue = async () => {
    if (!ticketId) return;
    try {
      await unlinkIssue.mutateAsync(ticketId);
      toast.success("Unlinked from issue");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to unlink issue"
      );
    }
  };

  // Esc key closes the drawer. Guarded on the ticketId so we don't
  // subscribe when nothing's open.
  useEffect(() => {
    if (!ticketId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !resolveOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ticketId, onClose, resolveOpen]);

  if (!ticketId) return null;

  const ticket = data?.ticket;

  const handleAddNote = async () => {
    if (!noteBody.trim() || !ticketId) return;
    try {
      await addNote.mutateAsync({ ticketId, body: noteBody.trim() });
      setNoteBody("");
      toast.success("Note added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    }
  };

  const handleResolve = async () => {
    if (!resolutionText.trim() || !ticketId) return;
    try {
      await resolveTicket.mutateAsync({
        ticketId,
        resolution: resolutionText.trim(),
      });
      setResolveOpen(false);
      setResolutionText("");
      toast.success("Ticket resolved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve ticket");
    }
  };

  const handleStatusChange = async (next: TicketStatus) => {
    if (!ticketId || !ticket) return;
    if (next === ticket.status) return;
    if (next === TicketStatus.Resolved) {
      setResolveOpen(true);
      return;
    }
    try {
      await updateTicket.mutateAsync({ ticketId, status: next });
      toast.success(`Marked ${STATUS_LABELS[next]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  return (
    <>
      {/* Backdrop: dims the page and closes the drawer on click. Wrapping
          both siblings in a fragment so the aside can layer on top. */}
      <div
        className="fixed inset-0 z-60 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed top-0 right-0 z-70 h-screen w-full max-w-xl bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {ticket ? (
            <>
              <span className="text-xs font-medium text-gray-500 tabular-nums whitespace-nowrap">
                {ticket.ticket_ref}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  STATUS_PILL_CLASS[ticket.status]
                )}
              >
                {STATUS_LABELS[ticket.status]}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">Loading ticket…</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : isError || !ticket ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#AD1F2A]">
            Couldn&apos;t load ticket.
            {error instanceof Error && (
              <div className="mt-1 text-xs text-red-800">{error.message}</div>
            )}
          </div>
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-gray-900 leading-snug">
                {ticket.subject}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ChannelChip channel={ticket.channel} />
                {ticket.category && (
                  <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
                    {ticket.category}
                  </span>
                )}
                <span>opened {formatWhen(ticket.createdAt)}</span>
              </div>
            </section>

            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
              <IdentityRow
                label="Affected"
                user={ticket.user_affected}
                helper="whose account this is about"
                actionLabel={ticket.user_affected ? "Change" : "Link user"}
                onAction={() => setAssignUserOpen(true)}
              />
              {ticket.sender && ticket.sender._id !== ticket.user_affected?._id && (
                <IdentityRow
                  label="Sender"
                  user={ticket.sender}
                  helper="who raised it"
                />
              )}
              <AssignedAdminRow
                admin={ticket.assigned_admin}
                onAssign={() => setAssignAdminOpen(true)}
              />
            </div>
            {ticket.source_reference && (
              <div className="text-xs text-gray-500">
                Source: <span className="text-gray-700 tabular-nums">{ticket.source_reference}</span>
              </div>
            )}

            {ticket.issue ? (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#AD1F2A]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Blocked on issue
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlinkIssue}
                    disabled={unlinkIssue.isPending}
                    className="text-xs text-gray-500 hover:text-[#AD1F2A]"
                  >
                    {unlinkIssue.isPending ? "Unlinking…" : "Unlink"}
                  </button>
                </div>
                <Link
                  href={`/issues/${ticket.issue._id}`}
                  className="text-sm text-gray-900 flex items-center gap-2 hover:text-[#00695C]"
                >
                  <span className="font-medium">{ticket.issue.issue_ref}</span>
                  <span className="truncate">{ticket.issue.title}</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                      ISSUE_STATUS_PILL_CLASS[ticket.issue.status]
                    )}
                  >
                    {ISSUE_STATUS_LABELS[ticket.issue.status]}
                  </span>
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLinkIssueOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-800"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Link to issue
              </button>
            )}

            {ticket.body && (
              <section className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Body
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.body}
                </p>
              </section>
            )}

            {ticket.attachments && ticket.attachments.length > 0 && (
              <section className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Attachments
                </p>
                <ul className="space-y-1">
                  {ticket.attachments.map((a, i) => (
                    <li key={`${a.url}-${i}`}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#00695C] hover:text-[#004D40]"
                      >
                        <Paperclip className="h-3 w-3" />
                        {a.filename ?? "attachment"}
                        {a.size ? (
                          <span className="text-gray-400">· {Math.round(a.size / 1024)} KB</span>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data?.csManager && (
              <div className="rounded-lg bg-gray-50/60 border border-gray-200 px-3 py-2 flex items-center gap-2 text-xs">
                <Headphones className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-500">CS Manager (context)</span>
                <span className="text-gray-900 font-medium">
                  {data.csManager.userName}
                </span>
              </div>
            )}

            {data?.duplicates && data.duplicates.length > 0 && (
              <section className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Recent from this address
                </p>
                <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                  {data.duplicates.map((d) => (
                    <li
                      key={d._id}
                      className="px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                          {d.ticket_ref}
                        </span>
                        <span className="text-gray-800 truncate">{d.subject}</span>
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                          STATUS_PILL_CLASS[d.status]
                        )}
                      >
                        {STATUS_LABELS[d.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                  Notes ({data?.notes.length ?? 0})
                </p>
              </div>
              {data && data.notes.length > 0 ? (
                <ul className="space-y-2">
                  {data.notes.map((n) => (
                    <li
                      key={n._id}
                      className="rounded-md border border-gray-200 bg-gray-50/60 p-2.5"
                    >
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <User2 className="h-3 w-3" />
                        <span className="font-medium text-gray-700">
                          {n.admin?.userName ?? "Unknown"}
                        </span>
                        <span>· {formatWhen(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap mt-1">
                        {n.body}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400 italic">No notes yet.</p>
              )}
              <div className="rounded-md border border-gray-200 bg-white p-2 space-y-2">
                <Textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Internal note — visible to admins only"
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteBody.trim() || addNote.isPending}
                  >
                    {addNote.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Add note
                  </Button>
                </div>
              </div>
            </section>

            {ticket.status === TicketStatus.Resolved && ticket.resolution && (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Resolved
                  {ticket.resolved_by && (
                    <>· by <span className="font-medium">{ticket.resolved_by.userName}</span></>
                  )}
                  {ticket.resolved_at && <>· {formatWhen(ticket.resolved_at)}</>}
                </div>
                <p className="text-emerald-900 whitespace-pre-wrap">{ticket.resolution}</p>
              </section>
            )}
          </>
        )}
      </div>

      {ticket && ticket.status !== TicketStatus.Resolved && (
        <footer className="border-t border-gray-200 p-3 flex items-center justify-between gap-2 shrink-0 bg-gray-50/60">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Status</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
              disabled={updateTicket.isPending}
            >
              {STATUS_OPTIONS.filter((o) => o.value !== TicketStatus.Resolved).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value={TicketStatus.Resolved}>Resolved…</option>
            </select>
          </div>
          <Button size="sm" onClick={() => setResolveOpen(true)}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Resolve
          </Button>
        </footer>
      )}

      {ticket && (
        <AssignAdminDialog
          open={assignAdminOpen}
          onOpenChange={setAssignAdminOpen}
          ticketId={ticket._id}
          currentAdminId={ticket.assigned_admin?._id ?? null}
        />
      )}
      {ticket && (
        <AssignAffectedUserDialog
          open={assignUserOpen}
          onOpenChange={setAssignUserOpen}
          ticketId={ticket._id}
          currentUserId={ticket.user_affected?._id ?? null}
        />
      )}
      {ticket && (
        <LinkTicketToIssueDialog
          open={linkIssueOpen}
          onOpenChange={setLinkIssueOpen}
          ticketId={ticket._id}
        />
      )}

      {resolveOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setResolveOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">
              Resolve ticket
            </h3>
            <p className="text-xs text-gray-500">
              A short note explaining how it was resolved — kept on the record
              for future reference.
            </p>
            <Input
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Refund issued via Paystack (ref: …)"
              className="text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResolveOpen(false)}
                disabled={resolveTicket.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResolve}
                disabled={!resolutionText.trim() || resolveTicket.isPending}
              >
                {resolveTicket.isPending && (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                )}
                Confirm resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}

function IdentityRow({
  label,
  user,
  helper,
  actionLabel,
  onAction,
}: {
  label: string;
  user?: { firstName?: string | null; lastName?: string | null; email?: string | null; phoneNumber?: string | null } | null;
  helper?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const name = displayUser(user);
  return (
    <div className="flex items-start gap-3 text-sm px-3 py-2.5">
      <span className="text-xs uppercase tracking-wide text-gray-500 w-20 shrink-0 mt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {name ? (
          <>
            <p className="text-gray-900 font-medium leading-tight truncate">{name}</p>
            <p className="text-xs text-gray-500 leading-tight truncate">
              {user?.email}
              {user?.phoneNumber && ` · ${user.phoneNumber}`}
            </p>
            {helper && (
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                {helper}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-amber-700 italic">
            Unlinked
            {helper && ` — ${helper}`}
          </p>
        )}
      </div>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-xs text-[#00695C] hover:text-[#004D40] font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function AssignedAdminRow({
  admin,
  onAssign,
}: {
  admin?: { _id: string; userName: string; email?: string | null } | null;
  onAssign: () => void;
}) {
  return (
    <div className="flex items-start gap-3 text-sm px-3 py-2.5">
      <span className="text-xs uppercase tracking-wide text-gray-500 w-20 shrink-0 mt-0.5">
        Assigned
      </span>
      <div className="flex-1 min-w-0">
        {admin ? (
          <>
            <p className="text-gray-900 font-medium leading-tight">{admin.userName}</p>
            {admin.email && (
              <p className="text-xs text-gray-500 leading-tight truncate">{admin.email}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-amber-700 italic">Unassigned</p>
        )}
      </div>
      <button
        type="button"
        onClick={onAssign}
        className="shrink-0 text-xs text-[#00695C] hover:text-[#004D40] font-medium"
      >
        {admin ? "Reassign" : "Assign"}
      </button>
    </div>
  );
}

function ChannelChip({ channel }: { channel: TicketChannel }) {
  const Icon = CHANNEL_ICON[channel];
  const label = channel.replace("_", "-");
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// external-link icon retained for consistency with the table
void ExternalLink;
