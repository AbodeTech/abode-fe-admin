import type { MeetingAudienceType } from '../schemas/meeting.schema';

/**
 * Mirrors `ListMeetingsQueryDto` on the real BE — page, limit, audience_type,
 * is_active, starts_after, starts_before, q. `access_type` is dropped from
 * this list on purpose: confirmed live against staging (2026-09-09) that it
 * 400s with "property access_type should not exist" here, even though it's a
 * real, working field on create/update now — the list DTO just hasn't caught
 * up. `cohort_id` isn't on the real query DTO either (same 400) — `useMeetings`
 * works around it by fetching wide and filtering client-side when this is set
 * against a real (non-mock) backend; see docs/ACADEMY-BACKEND-GAPS.md §1.
 */
export type MeetingListFilters = {
  page?: number;
  limit?: number;
  audience_type?: MeetingAudienceType;
  is_active?: boolean;
  starts_after?: string;
  starts_before?: string;
  q?: string;
  /** Not on GET /admin/meetings's query DTO yet — see file header. */
  cohort_id?: string;
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
