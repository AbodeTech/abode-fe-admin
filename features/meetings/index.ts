export { MeetingCreateForm } from "./components/MeetingCreateForm";
export { MeetingEditForm } from "./components/MeetingEditForm";
export { MeetingsTable } from "./components/MeetingsTable";
export { MeetingDetailHeader } from "./components/MeetingDetailHeader";
export { MeetingStatCards } from "./components/MeetingStatCards";
export { MeetingStatsCharts } from "./components/MeetingStatsCharts";
export { MeetingVerificationsTable } from "./components/MeetingVerificationsTable";

export { useMeetings, useMeeting } from "./hooks/use-meetings";
export {
  useCreateMeeting,
  useUpdateMeeting,
  useToggleMeetingActive,
} from "./hooks/use-meeting-mutations";
export { useMeetingStats, useMeetingVerifications } from "./hooks/use-meeting-stats";

export {
  createMeetingSchema,
  updateMeetingSchema,
  type CreateMeetingFormValues,
  type UpdateMeetingFormValues,
  type MeetingFormValues,
} from "./schemas/meeting.schema";

export type {
  Meeting,
  MeetingDetail,
  MeetingStats,
  MeetingStatsByReferralStatus,
  MeetingVerification,
  VerificationsPage,
  MeetingListFilter,
} from "./types";

export {
  MEETING_AUDIENCE_MAP,
  AUDIENCE_OPTIONS,
  AUDIENCE_LABELS,
  getAudienceLabel,
  isAudienceType,
  toAudienceType,
  isEligibleForAudience,
  getEligibleReferralStatuses,
  type AudienceType,
  type ReferralStatus,
} from "./lib/meet-validation";
