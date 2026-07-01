import { useQuery } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import { USE_MOCK_MEETINGS, mockMeetingsApi } from "./mock-meetings";

export const DEFAULT_VERIFICATIONS_PAGE_SIZE = 25;

export function useMeetingStats(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.stats(meetingId),
    queryFn: async () => {
      if (USE_MOCK_MEETINGS) {
        const stats = await mockMeetingsApi.getStats(meetingId);
        if (!stats) throw new Error("Meeting stats not found.");
        return stats;
      }
      // TODO(real): execute(GET_MEETING_STATS, { meetingId })
      throw new Error("Real meetings API not yet available.");
    },
    enabled: Boolean(meetingId),
    refetchInterval: 5000,
  });
}

export function useMeetingVerifications(meetingId: string, page = 1) {
  return useQuery({
    queryKey: meetingKeys.verifications(meetingId, page),
    queryFn: async () => {
      if (USE_MOCK_MEETINGS) {
        return mockMeetingsApi.getVerifications(
          meetingId,
          page,
          DEFAULT_VERIFICATIONS_PAGE_SIZE
        );
      }
      // TODO(real): execute(GET_MEETING_VERIFICATIONS, { meetingId, page, limit })
      throw new Error("Real meetings API not yet available.");
    },
    enabled: Boolean(meetingId),
    refetchInterval: 5000,
  });
}
