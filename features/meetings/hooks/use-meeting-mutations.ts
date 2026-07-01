import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import { USE_MOCK_MEETINGS, mockMeetingsApi } from "./mock-meetings";
import type { CreateMeetingFormValues } from "../schemas/meeting.schema";

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMeetingFormValues) => {
      if (USE_MOCK_MEETINGS) {
        return mockMeetingsApi.createMeeting(input);
      }
      // TODO(real): execute(CREATE_MEETING, { input })
      throw new Error("Real meetings API not yet available.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      input,
    }: {
      meetingId: string;
      input: Partial<CreateMeetingFormValues>;
    }) => {
      if (USE_MOCK_MEETINGS) {
        const meeting = await mockMeetingsApi.updateMeeting(meetingId, input);
        if (!meeting) throw new Error("Meeting not found.");
        return meeting;
      }
      // TODO(real): execute(UPDATE_MEETING, { input: { meeting_id: meetingId, ...input } })
      throw new Error("Real meetings API not yet available.");
    },
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(meetingId) });
    },
  });
}

export function useToggleMeetingActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      is_active,
    }: {
      meetingId: string;
      is_active: boolean;
    }) => {
      if (USE_MOCK_MEETINGS) {
        const meeting = await mockMeetingsApi.toggleActive(meetingId, is_active);
        if (!meeting) throw new Error("Meeting not found.");
        return meeting;
      }
      // TODO(real): execute(TOGGLE_MEETING_ACTIVE, { meetingId, is_active })
      throw new Error("Real meetings API not yet available.");
    },
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(meetingId) });
    },
  });
}
