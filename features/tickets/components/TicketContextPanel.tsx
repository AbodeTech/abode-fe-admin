"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Headphones,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GetTicketQuery } from "@/lib/gql/graphql";
import {
  useRemoveTicketCollaborator,
  useUnlinkTicketFromIssue,
} from "../hooks/use-ticket-mutations";
import { AddCollaboratorDialog } from "./AddCollaboratorDialog";
import { AssignAdminDialog } from "./AssignAdminDialog";
import { AssignAffectedUserDialog } from "./AssignAffectedUserDialog";
import { LinkTicketToIssueDialog } from "./LinkTicketToIssueDialog";
import { TicketClassificationPanel } from "./TicketClassificationPanel";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_PILL_CLASS,
  STATUS_LABELS,
  STATUS_PILL_CLASS,
} from "../lib/ticket-display";

type Detail = GetTicketQuery["getTicket"];

interface Props {
  detail: Detail;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const displayUser = (
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

/**
 * Everything true of the ticket that is not the conversation itself — who it
 * is about, who owns it, what it is classified as, what it is blocked on.
 *
 * Sits beside the thread rather than above it: this is reference material you
 * consult while reading, and stacking it on top pushes the conversation — the
 * thing you opened the ticket for — below the fold.
 */
export function TicketContextPanel({ detail }: Props) {
  const ticket = detail.ticket;
  const [assignAdminOpen, setAssignAdminOpen] = useState(false);
  const [addCollaboratorOpen, setAddCollaboratorOpen] = useState(false);
  const [assignUserOpen, setAssignUserOpen] = useState(false);
  const [linkIssueOpen, setLinkIssueOpen] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);

  const unlinkIssue = useUnlinkTicketFromIssue();
  const removeCollaborator = useRemoveTicketCollaborator();

  const handleRemoveCollaborator = async (adminId: string) => {
    setRemovingAdminId(adminId);
    try {
      await removeCollaborator.mutateAsync({ ticketId: ticket._id, adminId });
      toast.success("Collaborator removed");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove collaborator"
      );
    } finally {
      setRemovingAdminId(null);
    }
  };

  const handleUnlinkIssue = async () => {
    try {
      await unlinkIssue.mutateAsync(ticket._id);
      toast.success("Unlinked from issue");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink issue");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <TicketClassificationPanel ticket={ticket} />

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
        <CollaboratorsRow
          collaborators={ticket.collaborators}
          onAdd={() => setAddCollaboratorOpen(true)}
          onRemove={handleRemoveCollaborator}
          removingId={removeCollaborator.isPending ? removingAdminId : null}
        />
      </div>

      {ticket.source_reference && (
        <div className="text-xs text-gray-500">
          Source:{" "}
          <span className="text-gray-700 tabular-nums break-all">
            {ticket.source_reference}
          </span>
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
            className="text-sm text-gray-900 flex flex-wrap items-center gap-2 hover:text-[#00695C]"
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
                    <span className="text-gray-400">
                      · {Math.round(a.size / 1024)} KB
                    </span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.csManager && (
        <div className="rounded-lg bg-gray-50/60 border border-gray-200 px-3 py-2 flex items-center gap-2 text-xs">
          <Headphones className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="text-gray-500">CS Manager</span>
          <span className="text-gray-900 font-medium truncate">
            {detail.csManager.userName}
          </span>
        </div>
      )}

      {detail.duplicates && detail.duplicates.length > 0 && (
        <section className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
            Recent from this address
          </p>
          <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
            {detail.duplicates.map((d) => (
              <li key={d._id}>
                <Link
                  href={`/tickets?ticket=${d._id}`}
                  className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-gray-50"
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
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ticket.resolution && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm space-y-1.5">
          <div className="flex flex-wrap items-center gap-1 text-xs text-emerald-800">
            Resolved
            {ticket.resolved_by && (
              <>
                · by{" "}
                <span className="font-medium">{ticket.resolved_by.userName}</span>
              </>
            )}
            {ticket.resolved_at && <>· {formatWhen(ticket.resolved_at)}</>}
          </div>
          <p className="text-emerald-900 whitespace-pre-wrap">
            {ticket.resolution}
          </p>
        </section>
      )}

      <AddCollaboratorDialog
        open={addCollaboratorOpen}
        onOpenChange={setAddCollaboratorOpen}
        ticketId={ticket._id}
        excludeAdminIds={[
          ...(ticket.assigned_admin ? [ticket.assigned_admin._id] : []),
          ...ticket.collaborators.map((c) => c._id),
        ]}
      />
      <AssignAdminDialog
        open={assignAdminOpen}
        onOpenChange={setAssignAdminOpen}
        ticketId={ticket._id}
        currentAdminId={ticket.assigned_admin?._id ?? null}
      />
      <AssignAffectedUserDialog
        open={assignUserOpen}
        onOpenChange={setAssignUserOpen}
        ticketId={ticket._id}
        currentUserId={ticket.user_affected?._id ?? null}
      />
      <LinkTicketToIssueDialog
        open={linkIssueOpen}
        onOpenChange={setLinkIssueOpen}
        ticketId={ticket._id}
      />
    </div>
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
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
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
            <p className="text-gray-900 font-medium leading-tight truncate">
              {name}
            </p>
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
            <p className="text-gray-900 font-medium leading-tight">
              {admin.userName}
            </p>
            {admin.email && (
              <p className="text-xs text-gray-500 leading-tight truncate">
                {admin.email}
              </p>
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

/**
 * Sits under the owner rather than beside it: the owner is who is answerable,
 * collaborators are who is helping, and flattening the two loses that.
 */
function CollaboratorsRow({
  collaborators,
  onAdd,
  onRemove,
  removingId,
}: {
  collaborators: {
    _id: string;
    userName: string;
    email?: string | null;
    role?: string | null;
  }[];
  onAdd: () => void;
  onRemove: (adminId: string) => void;
  removingId: string | null;
}) {
  return (
    <div className="flex items-start gap-3 text-sm px-3 py-2.5">
      <span className="text-xs uppercase tracking-wide text-gray-500 w-20 shrink-0 mt-0.5">
        Helping
      </span>
      <div className="flex-1 min-w-0">
        {collaborators.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No collaborators</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {collaborators.map((c) => (
              <li key={c._id}>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 pl-2 pr-1 py-0.5 text-[11px] text-gray-700">
                  <span title={c.email ?? undefined}>{c.userName}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(c._id)}
                    disabled={removingId === c._id}
                    aria-label={`Remove ${c.userName}`}
                    className="rounded-full p-0.5 text-gray-400 hover:text-[#AD1F2A] disabled:opacity-50"
                  >
                    {removingId === c._id ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <X className="h-2.5 w-2.5" />
                    )}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 text-xs text-[#00695C] hover:text-[#004D40] font-medium"
      >
        Add
      </button>
    </div>
  );
}
