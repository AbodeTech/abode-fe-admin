"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, RotateCcw, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IssueStatus, TicketStatus, type GetIssueQuery } from "@/lib/gql/graphql";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_PILL_CLASS,
  STATUS_LABELS,
  STATUS_PILL_CLASS,
  recurrenceLabel,
  recurrencePillClass,
} from "../lib/ticket-display";
import { ResolveIssueDialog } from "./ResolveIssueDialog";

interface Props {
  detail: NonNullable<GetIssueQuery["getIssue"]>;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatUser = (u?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null) => {
  if (!u) return null;
  const name = `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim();
  return name || u.email || null;
};

export function IssueDetail({ detail }: Props) {
  const [resolveOpen, setResolveOpen] = useState(false);
  const { issue, tickets, ticketCount } = detail;
  const isResolved = issue.status === IssueStatus.Resolved;

  /**
   * The people owed a correction.
   *
   * The BE computes this at reopen time (countTicketsResolvedByIssue) but only
   * writes it into an AdminLog string — nothing returns it. It is derivable
   * here from the same predicate: linked, unmerged, resolved. `tickets` already
   * excludes merged ones, so filtering on status matches exactly, and because
   * user_affected is populated we can name them, which the BE count cannot.
   *
   * Only meaningful once the incident has come back — before that, a resolved
   * linked ticket was simply resolved.
   */
  const owedCorrection =
    issue.reopen_count > 0
      ? tickets.filter((t) => t.status === TicketStatus.Resolved)
      : [];

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 tabular-nums">
                {issue.issue_ref}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  ISSUE_STATUS_PILL_CLASS[issue.status]
                )}
              >
                {ISSUE_STATUS_LABELS[issue.status]}
              </span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 leading-snug">
              {issue.title}
            </h1>
            {issue.description && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {issue.description}
              </p>
            )}
          </div>
          {!isResolved && (
            <Button size="sm" onClick={() => setResolveOpen(true)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Resolve
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <MetaCell label="Owner" value={issue.owner?.userName ?? "—"} />
          <MetaCell
            label="Created by"
            value={issue.created_by?.userName ?? "—"}
          />
          <MetaCell label="Opened" value={formatWhen(issue.createdAt)} />
          <MetaCell
            label="Linked tickets"
            value={`${ticketCount}`}
            emphasis
          />
        </div>

        {issue.reopen_count > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  recurrencePillClass(issue.reopen_count)
                )}
              >
                {recurrenceLabel(issue.reopen_count)}
              </span>
              <span className="text-xs text-amber-900">
                {issue.first_resolved_at && (
                  <>First believed fixed {formatWhen(issue.first_resolved_at)}</>
                )}
                {issue.reopened_at && (
                  <> · last came back {formatWhen(issue.reopened_at)}</>
                )}
              </span>
            </div>
            <p className="text-xs text-amber-900">
              An incident that keeps returning is an unsolved one with a bad
              diagnosis, not a resolved one.
            </p>

            {owedCorrection.length > 0 && (
              <div className="rounded border border-amber-300/70 bg-white/60 p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {owedCorrection.length} customer
                  {owedCorrection.length === 1 ? " was" : "s were"} told this was
                  fixed
                </div>
                <p className="text-[11px] text-amber-800">
                  Their tickets were closed by a previous resolution. Nothing is
                  sent automatically — they need a correction.
                </p>
                <ul className="flex flex-wrap gap-1.5 pt-0.5">
                  {owedCorrection.map((t) => (
                    <li key={t._id}>
                      <Link
                        href={`/tickets?ticket=${t._id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] text-amber-900 hover:border-amber-500"
                      >
                        {formatUser(t.user_affected) ?? t.ticket_ref}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {isResolved && issue.resolution_note && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved
              {issue.resolved_by && (
                <>· by <span className="font-medium">{issue.resolved_by.userName}</span></>
              )}
              {issue.resolved_at && <>· {formatWhen(issue.resolved_at)}</>}
            </div>
            <p className="text-emerald-900 whitespace-pre-wrap">
              {issue.resolution_note}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Linked tickets ({tickets.length})
        </h2>
        {tickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No tickets linked yet.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
                    <th className="px-3 py-2.5 font-medium w-14">Ref</th>
                    <th className="px-3 py-2.5 font-medium">Subject</th>
                    <th className="px-3 py-2.5 font-medium">Affected</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const affected = formatUser(t.user_affected);
                    return (
                      <tr
                        key={t._id}
                        className="border-t border-gray-100 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-2.5 text-[11px] font-medium text-gray-500 tabular-nums whitespace-nowrap">
                          <Link
                            href={`/tickets?ticket=${t._id}`}
                            className="hover:text-[#00695C]"
                          >
                            {t.ticket_ref}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 max-w-md">
                          <Link
                            href={`/tickets?ticket=${t._id}`}
                            className="text-gray-900 hover:text-[#00695C] line-clamp-1 leading-tight"
                          >
                            {t.subject}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                          {affected ? (
                            <span className="inline-flex items-center gap-1">
                              <User2 className="h-3 w-3 text-gray-400" />
                              {affected}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-700 italic">
                              Unlinked
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                              STATUS_PILL_CLASS[t.status]
                            )}
                          >
                            {STATUS_LABELS[t.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                          {formatWhen(t.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <ResolveIssueDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        issueId={issue._id}
        issueTitle={issue.title}
        linkedTickets={tickets}
      />
    </div>
  );
}

function MetaCell({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </p>
      <p
        className={cn(
          "leading-tight tabular-nums",
          emphasis ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-800"
        )}
      >
        {value}
      </p>
    </div>
  );
}
