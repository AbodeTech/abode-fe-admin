'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';

import {
  isMeetingLive,
  MeetingDetailSchema,
  MeetingSchema,
  MeetingSeriesSchema,
  MeetingVerificationSchema,
  type CreateMeetingInput,
  type Meeting,
  type UpdateMeetingInput,
} from '../schemas/meeting.schema';
import { meetingKeys, type MeetingListFilters } from './query-keys';

/** The BE defaults to 20. */
export const DEFAULT_MEETINGS_LIMIT = 20;

/**
 * GET /admin/meetings — paginated, filterable list.
 * Query: page, limit, audience_type, is_active, starts_after, starts_before,
 * q, cohort_id, access_type — all filtered server-side now that `cohort_id`
 * and `access_type` landed on the real `ListMeetingsQueryDto` (2026-09-09,
 * `fee2e97`). Previously both 400'd and `cohort_id` was worked around with a
 * wide client-side-filtered fetch; that workaround is gone now that the BE
 * does the filtering itself.
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
          cohort_id: rest.cohort_id,
          access_type: rest.access_type,
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
 * GET /admin/meetings/series/:id — series detail (the series plus every
 * session in schedule order). Real on the BE as of 2026-09-10 (`8843241`) —
 * previously mock-only. `series_slug`/`series_name`/`series_position`/
 * `series_total` on each session aren't on the real `MeetingDto` (only
 * `series_id` is) — `MeetingSchema` keeps them optional and the UI degrades
 * gracefully when they're absent (see `meetingSeriesPositionLabel`).
 */
export const useMeetingSeries = (id: string | undefined) =>
  useQuery({
    queryKey: meetingKeys.seriesDetail(id ?? ''),
    queryFn: () => apiGet(`/admin/meetings/series/${id}`, MeetingSeriesSchema),
    enabled: Boolean(id),
  });

/**
 * Cheap, network-free heartbeat that re-derives `isMeetingLive` every
 * `heartbeatMs` (default 30s) so `useMeetingVerifications` below knows when
 * to start/stop its 5s poll. A session that hasn't opened for verification
 * yet, or has already ended, produces no new join-log rows — polling it is
 * pure waste, but the page still needs *something* cheap ticking so a
 * still-open tab notices the moment a session goes live.
 */
export const useIsMeetingLive = (meeting: Meeting | undefined, heartbeatMs = 30_000): boolean => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), heartbeatMs);
    return () => clearInterval(id);
  }, [heartbeatMs]);
  return meeting ? isMeetingLive(meeting, now) : false;
};

/**
 * GET /admin/meetings/:id/verifications — not cached on the BE. Only polls
 * every 5s while the session's verification window is actually open
 * (`live`); otherwise a single fetch and no recurring timer — see
 * `useIsMeetingLive`.
 */
export const useMeetingVerifications = (
  meetingId: string | undefined,
  opts?: { page?: number; limit?: number; live?: boolean }
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
    refetchInterval: opts?.live ? 5_000 : false,
  });
};

function invalidateMeetings(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: meetingKeys.series() });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
  } else {
    void queryClient.invalidateQueries({ queryKey: meetingKeys.details() });
  }
}

/** POST /admin/meetings — creates one session or a series when recurrence.count > 1. */
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
    onSuccess: (meeting) => {
      invalidateMeetings(queryClient, meeting.id);
      if (meeting.series_id) {
        void queryClient.invalidateQueries({
          queryKey: meetingKeys.seriesDetail(meeting.series_id),
        });
      }
    },
  });
};

/** POST /admin/meetings/:id/toggle-active */
export const useToggleMeetingActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; is_active: boolean }) =>
      apiPost(`/admin/meetings/${args.id}/toggle-active`, { is_active: args.is_active }, MeetingSchema),
    onSuccess: (meeting) => {
      invalidateMeetings(queryClient, meeting.id);
      if (meeting.series_id) {
        void queryClient.invalidateQueries({
          queryKey: meetingKeys.seriesDetail(meeting.series_id),
        });
      }
    },
  });
};

/**
 * POST /admin/meetings/series/:id/cancel — cancels the series and stamps
 * `cancelled_at` on remaining *future*, un-cancelled sessions only (past/
 * in-progress sessions keep their attendance). Idempotent. Real on the BE as
 * of 2026-09-10 (`8843241`) — previously mock-only.
 */
export const useCancelMeetingSeries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (seriesId: string) =>
      apiPost(`/admin/meetings/series/${seriesId}/cancel`, {}, MeetingSeriesSchema),
    onSuccess: (series) => {
      invalidateMeetings(queryClient);
      void queryClient.invalidateQueries({ queryKey: meetingKeys.seriesDetail(series.id) });
    },
  });
};

/**
 * POST /admin/meetings/:id/cancel — cancel a single session (standalone or
 * part of a series). Terminal and irreversible — distinct from the existing
 * `toggle-active`, which is reversible. Real on the BE as of 2026-09-10
 * (`8843241`) — previously mock-only.
 */
export const useCancelMeetingSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) =>
      apiPost(`/admin/meetings/${meetingId}/cancel`, {}, MeetingSchema),
    onSuccess: (meeting) => {
      invalidateMeetings(queryClient, meeting.id);
      if (meeting.series_id) {
        void queryClient.invalidateQueries({
          queryKey: meetingKeys.seriesDetail(meeting.series_id),
        });
      }
    },
  });
};
