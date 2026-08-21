"use client";

import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GetIssuesQuery } from "@/lib/gql/graphql";
import { ISSUE_STATUS_LABELS, ISSUE_STATUS_PILL_CLASS } from "../lib/ticket-display";

type Row = GetIssuesQuery["getIssues"]["results"][number];

interface Props {
  rows: Row[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    ? `${d.getDate()} ${MONTHS[d.getMonth()]}`
    : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export function IssuesTable({ rows, isLoading, isError, errorMessage }: Props) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading issues…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn&apos;t load issues.
        {errorMessage && <div className="mt-1 text-xs text-red-800">{errorMessage}</div>}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        No issues yet. Promote a ticket or create one directly to start grouping.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
              <th className="px-3 py-2.5 font-medium w-14">Ref</th>
              <th className="px-3 py-2.5 font-medium">Title</th>
              <th className="px-3 py-2.5 font-medium">Owner</th>
              <th className="px-3 py-2.5 font-medium">Tickets</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r._id}
                className="border-t border-gray-100 hover:bg-gray-50/60"
              >
                <td className="px-3 py-3 text-[11px] font-medium text-gray-500 tabular-nums whitespace-nowrap">
                  <Link href={`/issues/${r._id}`} className="hover:text-[#00695C]">
                    {r.issue_ref}
                  </Link>
                </td>
                <td className="px-3 py-3 max-w-md">
                  <Link
                    href={`/issues/${r._id}`}
                    className="font-medium text-gray-900 leading-tight line-clamp-1 hover:text-[#00695C]"
                  >
                    {r.title}
                  </Link>
                  {r.description && (
                    <p className="text-xs text-gray-500 leading-tight line-clamp-1 mt-0.5">
                      {r.description}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                  {r.owner?.userName ?? (
                    <span className="text-amber-700 text-xs">Unassigned</span>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-700 tabular-nums whitespace-nowrap">
                  {r.ticketCount ?? 0}
                  {(r.ticketCount ?? 0) > 0 && (
                    <AlertCircle className="inline-block h-3 w-3 text-amber-600 ml-1 -mt-0.5" />
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                      ISSUE_STATUS_PILL_CLASS[r.status]
                    )}
                  >
                    {ISSUE_STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                  {formatDate(r.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
