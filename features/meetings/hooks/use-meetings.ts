import { useQuery } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import { fetchMeetingById, fetchMeetings } from "./meeting-api";

export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.list(),
    queryFn: () => fetchMeetings(),
  });
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.detail(meetingId),
    queryFn: () => fetchMeetingById(meetingId),
    enabled: Boolean(meetingId),
    select: (detail) => {
      const { stats: _stats, ...meeting } = detail;
      return meeting;
    },
  });
}
