import { useQuery } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import { USE_MOCK_MEETINGS, mockMeetingsApi } from "./mock-meetings";

export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.list(),
    queryFn: async () => {
      if (USE_MOCK_MEETINGS) {
        return mockMeetingsApi.listMeetings();
      }
      // TODO(real): execute(GET_ALL_MEETINGS)
      throw new Error("Real meetings API not yet available.");
    },
  });
}

export function useMeeting(meetingId: string) {
  return useQuery({
    queryKey: meetingKeys.detail(meetingId),
    queryFn: async () => {
      if (USE_MOCK_MEETINGS) {
        const meeting = await mockMeetingsApi.getMeeting(meetingId);
        if (!meeting) throw new Error("Meeting not found.");
        return meeting;
      }
      // TODO(real): execute(GET_MEETING_BY_ID, { meetingId })
      throw new Error("Real meetings API not yet available.");
    },
    enabled: Boolean(meetingId),
  });
}
