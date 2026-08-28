"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMeetingVerifications,
  DEFAULT_VERIFICATIONS_PAGE_SIZE,
} from "../hooks/use-meeting-stats";

interface MeetingVerificationsTableProps {
  meetingId: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MeetingVerificationsTable({ meetingId }: MeetingVerificationsTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMeetingVerifications(meetingId, page);

  const verifications = data?.verifications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_VERIFICATIONS_PAGE_SIZE));

  if (isLoading && verifications.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-400">Loading verifications…</p>
      </div>
    );
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * DEFAULT_VERIFICATIONS_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * DEFAULT_VERIFICATIONS_PAGE_SIZE, total);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Verified Attendees</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} verification{total !== 1 ? "s" : ""}
            {total > DEFAULT_VERIFICATIONS_PAGE_SIZE && (
              <> · showing {rangeStart}–{rangeEnd} most recent</>
            )}
            {" · "}updates every 5s
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Live
        </span>
      </div>

      {total === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
            No one has verified through this link yet.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Verified at
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => (
                  <tr key={v._id} className="border-b border-gray-50">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900">
                      {[v.first_name, v.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">{v.email}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">{v.phone || "—"}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">
                      {v.referral_status || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">
                      {formatTime(v.verified_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          v.source === "new_signup"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {v.source === "new_signup" ? "New signup" : "Existing"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
