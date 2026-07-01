"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MeetingEditForm, useMeeting } from "@/features/meetings";

export default function MeetingEditPage() {
  const params = useParams();
  const meetingId = params.id as string;
  const { data: meeting, isLoading, error } = useMeeting(meetingId);

  if (isLoading) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 pb-20 sm:px-4">
        <p className="text-sm text-gray-400">Loading meeting…</p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 pb-20 sm:px-4">
        <p className="text-sm text-gray-500">Meeting not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-20 sm:px-4">
      <Link
        href={`/meetings/${meetingId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to meeting
      </Link>
      <MeetingEditForm meeting={meeting} />
    </div>
  );
}
