import type { MeetingAccessType, MeetingAudienceType } from '../schemas/meeting.schema';

/**
 * Mirrors `ListMeetingsQueryDto` on the real BE — page, limit, audience_type,
 * is_active, starts_after, starts_before, q, cohort_id, access_type. The last
 * two landed 2026-09-09 (`fee2e97`) — previously both 400'd
 * ("property ... should not exist"), which is why older code here worked
 * around it; see docs/ACADEMY-BACKEND-GAPS.md §1 (now resolved) for the history.
 */
export type MeetingListFilters = {
  page?: number;
  limit?: number;
  audience_type?: MeetingAudienceType;
  is_active?: boolean;
  starts_after?: string;
  starts_before?: string;
  q?: string;
  cohort_id?: string;
  access_type?: MeetingAccessType;
};

export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters?: MeetingListFilters) => [...meetingKeys.lists(), filters ?? {}] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
  verifications: (id: string, page?: number, limit?: number) =>
    [...meetingKeys.detail(id), 'verifications', { page, limit }] as const,
  series: () => [...meetingKeys.all, 'series'] as const,
  seriesDetail: (id: string) => [...meetingKeys.series(), id] as const,
};
