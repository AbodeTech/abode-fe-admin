"use client";

import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  MeetingDetailHeader,
  MeetingStatCards,
  MeetingStatsCharts,
  MeetingVerificationsTable,
  useMeeting,
  useMeetingStats,
} from "@/features/meetings";

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const { data: meeting, isLoading, error } = useMeeting(meetingId);
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
    isFetching,
  } = useMeetingStats(meetingId);

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
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-8 px-3 pb-20 sm:px-4">
      <MeetingDetailHeader
        meeting={meeting}
        verifiedCount={stats?.total_verifications}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Session metrics</h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refetchStats()}
          disabled={isFetching}
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {statsLoading && !stats ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <RefreshCw size={20} className="animate-spin text-gray-300" />
        </div>
      ) : statsError ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-red-200 bg-red-50/50">
          <p className="text-sm text-red-600">Failed to load session metrics.</p>
        </div>
      ) : stats ? (
        <>
          <MeetingStatCards stats={stats} />
          <MeetingStatsCharts stats={stats} />
        </>
      ) : null}

      <MeetingVerificationsTable meetingId={meetingId} />
    </div>
  );
}
