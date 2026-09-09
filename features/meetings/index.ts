/**
 * Meetings — Google Meet join-gate admin (+ Academy series / physical ABO-6–8).
 * Wired to abode-be-v2 `/api/v1/admin/meetings*` (staging + provisional series mocks).
 *
 * Requires `view_meetings`. Create / edit / toggle require `manage_meetings`.
 */

export { MeetingsTable } from './components/MeetingsTable';
export { MeetingsFilters } from './components/MeetingsFilters';
export { CreateMeetingDialog, EditMeetingDialog } from './components/MeetingFormDialog';
export { VerificationsTable } from './components/VerificationsTable';
export { SeriesDetailPage } from './components/SeriesDetailPage';

export {
  useMeetings,
  useMeeting,
  useMeetingSeries,
  useMeetingVerifications,
  useIsMeetingLive,
  useCreateMeeting,
  useUpdateMeeting,
  useToggleMeetingActive,
  useCancelMeetingSeries,
  useCancelMeetingSession,
  DEFAULT_MEETINGS_LIMIT,
} from './hooks/use-meetings';
export { meetingKeys } from './hooks/query-keys';
export type { MeetingListFilters } from './hooks/query-keys';

export {
  MEETING_AUDIENCE_TYPES,
  MEETING_AUDIENCE_LABELS,
  MEETING_AUDIENCE_MODES,
  MEETING_ACCESS_TYPES,
  MEETING_ACCESS_TYPE_LABELS,
  MEETING_RECURRENCE_FREQUENCIES,
  MEETING_RECURRENCE_FREQUENCY_LABELS,
  DEFAULT_DURATION_MINUTES,
  formatMeetingWhen,
  isLinkPending,
  meetingAudienceDisplay,
  meetingSeriesPositionLabel,
  previewRecurrenceDates,
} from './schemas/meeting.schema';
export type {
  Meeting,
  MeetingDetail,
  MeetingSeries,
  MeetingVerification,
  MeetingAudienceType,
  MeetingAudienceMode,
  MeetingAccessType,
  MeetingRecurrenceFrequency,
  CreateMeetingInput,
  UpdateMeetingInput,
} from './schemas/meeting.schema';
