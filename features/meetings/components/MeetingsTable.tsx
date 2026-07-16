"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatLagosTime } from "../lib/meet-time";
import { getAudienceLabel, resolveMeetingShareUrl } from "../lib/meet-validation";
import type { Meeting } from "../types";

interface MeetingsTableProps {
  meetings: Meeting[];
  loading?: boolean;
}

export function MeetingsTable({ meetings, loading }: MeetingsTableProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(id: string, url: string, e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link copied");
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-gray-400">Loading meetings…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">Meeting Links</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {meetings.length} link{meetings.length !== 1 ? "s" : ""} created
        </p>
      </div>

      {meetings.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-400">
            No meeting links yet. Create one above to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Starts at
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Share link
                </th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((session) => {
                const shareUrl = resolveMeetingShareUrl(session);
                return (
                <tr
                  key={session._id}
                  onClick={() => router.push(`/meetings/${session._id}`)}
                  className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/80"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {session.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getAudienceLabel(session.audience_type)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatLagosTime(session.starts_at, true)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {session.verification_count}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        session.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {session.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => copyLink(session._id, shareUrl, e)}
                      >
                        {copiedId === session._id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                        Copy
                      </Button>
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <ExternalLink size={12} />
                        Open
                      </a>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
