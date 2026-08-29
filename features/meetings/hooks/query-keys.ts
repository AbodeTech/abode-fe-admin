import type { MeetingAudienceType } from '../schemas/meeting.schema';

/** Mirrors `ListMeetingsQueryDto`. */
export type MeetingListFilters = {
  page?: number;
  limit?: number;
  audience_type?: MeetingAudienceType;
  is_active?: boolean;
  starts_after?: string;
  starts_before?: string;
  q?: string;
};

export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters?: MeetingListFilters) => [...meetingKeys.lists(), filters ?? {}] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
  verifications: (id: string, page?: number, limit?: number) =>
    [...meetingKeys.detail(id), 'verifications', { page, limit }] as const,
};
