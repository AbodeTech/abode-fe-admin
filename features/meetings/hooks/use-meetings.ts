'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import {
  MeetingDetailSchema,
  MeetingSchema,
  MeetingVerificationSchema,
  type CreateMeetingInput,
  type UpdateMeetingInput,
} from '../schemas/meeting.schema';
import { meetingKeys, type MeetingListFilters } from './query-keys';

/** The BE defaults to 20. */
export const DEFAULT_MEETINGS_LIMIT = 20;

/**
 * GET /admin/meetings — paginated, filterable list.
 * Query: page, limit, audience_type, is_active, starts_after, starts_before, q.
 */
export const useMeetings = (filters?: MeetingListFilters) => {
  const { page = 1, limit = DEFAULT_MEETINGS_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: meetingKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/meetings', MeetingSchema, {
        params: {
          page,
          limit,
          audience_type: rest.audience_type,
          is_active: rest.is_active === undefined ? undefined : String(rest.is_active),
          starts_after: rest.starts_after,
          starts_before: rest.starts_before,
          q: rest.q?.trim() || undefined,
        },
      }),
  });
};

/** GET /admin/meetings/:id — detail with lean verification stats. */
export const useMeeting = (id: string | undefined) =>
  useQuery({
    queryKey: meetingKeys.detail(id ?? ''),
    queryFn: () => apiGet(`/admin/meetings/${id}`, MeetingDetailSchema),
    enabled: Boolean(id),
  });

/**
 * GET /admin/meetings/:id/verifications — not cached on the BE; poll every 5s
 * while this screen is open so live join counts stay current.
 */
export const useMeetingVerifications = (
  meetingId: string | undefined,
  opts?: { page?: number; limit?: number }
) => {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? DEFAULT_MEETINGS_LIMIT;

  return useQuery({
    queryKey: meetingKeys.verifications(meetingId ?? '', page, limit),
    queryFn: () =>
      apiGetPaged(`/admin/meetings/${meetingId}/verifications`, MeetingVerificationSchema, {
        params: { page, limit },
      }),
    enabled: Boolean(meetingId),
    refetchInterval: 5_000,
  });
};

function invalidateMeetings(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
  } else {
    void queryClient.invalidateQueries({ queryKey: meetingKeys.details() });
  }
}

/** POST /admin/meetings */
export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) => apiPost('/admin/meetings', input, MeetingSchema),
    onSuccess: () => invalidateMeetings(queryClient),
  });
};

/** PATCH /admin/meetings/:id */
export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string } & UpdateMeetingInput) => {
      const { id, ...body } = args;
      return apiPatch(`/admin/meetings/${id}`, body, MeetingSchema);
    },
    onSuccess: (meeting) => invalidateMeetings(queryClient, meeting.id),
  });
};

/** POST /admin/meetings/:id/toggle-active */
export const useToggleMeetingActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; is_active: boolean }) =>
      apiPost(`/admin/meetings/${args.id}/toggle-active`, { is_active: args.is_active }, MeetingSchema),
    onSuccess: (meeting) => invalidateMeetings(queryClient, meeting.id),
  });
};
