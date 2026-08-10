"use client";

import { MeetingCreateForm, MeetingsTable, useMeetings } from "@/features/meetings";

export default function MeetingsPage() {
  const { data: meetings = [], isLoading } = useMeetings();

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-8 px-3 pb-20 sm:px-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Meetings</h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Create shareable meeting links for associates and track verified attendance.
        </p>
      </div>

      <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
        Share links open on abode-fe-v2 at <code className="font-mono">/join/&#123;slug&#125;</code>.
        Associates verify their email before joining Google Meet.
      </div>

      <MeetingCreateForm />
      <MeetingsTable meetings={meetings} loading={isLoading} />
    </div>
  );
}
