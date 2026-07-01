"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatLagosTime } from "../lib/meet-time";
import { AUDIENCE_LABELS } from "../lib/meet-validation";
import { useToggleMeetingActive } from "../hooks/use-meeting-mutations";
import type { Meeting } from "../hooks/mock-meetings";

interface MeetingDetailHeaderProps {
  meeting: Meeting;
  verifiedCount?: number;
  attendanceRate?: number;
  audienceTotal?: number;
}

export function MeetingDetailHeader({
  meeting,
  verifiedCount,
  attendanceRate,
  audienceTotal,
}: MeetingDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const toggleMutation = useToggleMeetingActive();

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  }

  async function toggleActive() {
    try {
      await toggleMutation.mutateAsync({
        meetingId: meeting._id,
        is_active: !meeting.is_active,
      });
      toast.success(meeting.is_active ? "Meeting deactivated" : "Meeting activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update meeting.");
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to meetings
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{meeting.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Starts {formatLagosTime(meeting.starts_at)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Audience: {AUDIENCE_LABELS[meeting.audience_type]}
            </p>
            {verifiedCount !== undefined && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">{verifiedCount}</span> verified
                {audienceTotal !== undefined && audienceTotal > 0 && attendanceRate !== undefined && (
                  <>
                    {" "}
                    · <span className="font-medium">{attendanceRate}%</span> of audience
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                meeting.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {meeting.is_active ? "Active" : "Inactive"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={toggleMutation.isPending}
              onClick={toggleActive}
            >
              {toggleMutation.isPending
                ? "Updating…"
                : meeting.is_active
                  ? "Deactivate"
                  : "Activate"}
            </Button>
            <Link href={`/meetings/${meeting._id}/edit`}>
              <Button type="button" size="sm" variant="outline">
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Share link
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="flex-1 break-all rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
                {meeting.share_url}
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => copyLink(meeting.share_url)}>
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <a
                href={meeting.share_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink size={14} />
                Open
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Google Meet URL (admin only)
            </p>
            <p className="mt-1 break-all rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900">
              {meeting.google_meet_url}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
