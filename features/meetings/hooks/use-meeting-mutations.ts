import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingKeys } from "./query-keys";
import {
  createMeeting,
  toggleMeetingActive,
  updateMeeting,
} from "./meeting-api";
import { parseLagosDatetimeLocal } from "../lib/meet-time";
import type { CreateMeetingFormValues } from "../schemas/meeting.schema";

function toApiStartsAt(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value.trim())) {
    return parseLagosDatetimeLocal(value).toISOString();
  }
  return new Date(value).toISOString();
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMeetingFormValues) => {
      return createMeeting({
        name: input.name,
        google_meet_url: input.google_meet_url,
        audience_type: input.audience_type,
        starts_at: toApiStartsAt(input.starts_at),
        verification_lead_minutes: input.verification_lead_minutes ?? 30,
      });
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
      return updateMeeting(meetingId, {
        name: input.name,
        google_meet_url: input.google_meet_url,
        audience_type: input.audience_type,
        starts_at: input.starts_at ? toApiStartsAt(input.starts_at) : undefined,
        verification_lead_minutes: input.verification_lead_minutes,
      });
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
      return toggleMeetingActive(meetingId, is_active);
    },
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(meetingId) });
    },
  });
}
