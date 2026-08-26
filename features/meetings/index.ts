/**
 * Meetings — Google Meet join-gate admin.
 * Wired to abode-be-v2 `/api/v1/admin/meetings*` (staging).
 *
 * Requires `view_meetings`. Create / edit / toggle require `manage_meetings`.
 */

export { MeetingsTable } from './components/MeetingsTable';
export { MeetingsFilters } from './components/MeetingsFilters';
export { CreateMeetingDialog, EditMeetingDialog } from './components/MeetingFormDialog';
export { VerificationsTable } from './components/VerificationsTable';

export {
  useMeetings,
  useMeeting,
  useMeetingVerifications,
  useCreateMeeting,
  useUpdateMeeting,
  useToggleMeetingActive,
  DEFAULT_MEETINGS_LIMIT,
} from './hooks/use-meetings';
export { meetingKeys } from './hooks/query-keys';
export type { MeetingListFilters } from './hooks/query-keys';

export {
  MEETING_AUDIENCE_TYPES,
  MEETING_AUDIENCE_LABELS,
  formatMeetingWhen,
} from './schemas/meeting.schema';
export type {
  Meeting,
  MeetingDetail,
  MeetingVerification,
  MeetingAudienceType,
  CreateMeetingInput,
  UpdateMeetingInput,
} from './schemas/meeting.schema';
