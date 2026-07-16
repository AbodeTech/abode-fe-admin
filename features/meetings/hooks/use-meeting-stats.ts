import { useQuery } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import {
  fetchMeetingById,
  fetchMeetingVerifications,
} from "./meeting-api";

export const DEFAULT_VERIFICATIONS_PAGE_SIZE = 25;

/** Stats come from getMeetingById → MeetingDetail.stats (no separate stats query). */
export function useMeetingStats(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.detail(meetingId),
    queryFn: () => fetchMeetingById(meetingId),
    enabled: Boolean(meetingId),
    refetchInterval: 5000,
    select: (detail) => detail.stats,
  });
}

export function useMeetingVerifications(meetingId: string, page = 1) {
  return useQuery({
    queryKey: meetingKeys.verifications(meetingId, page),
    queryFn: () =>
      fetchMeetingVerifications(
        meetingId,
        page,
        DEFAULT_VERIFICATIONS_PAGE_SIZE
      ),
    enabled: Boolean(meetingId),
    refetchInterval: 5000,
  });
}
