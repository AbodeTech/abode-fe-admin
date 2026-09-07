import { z } from 'zod';

/* ============================================================
 * Admin meetings — mirrors abode-be-v2 meetings module (staging),
 * extended for Academy series/physical (ABO-6–8; BE ABO-47–52).
 *
 * Paths: /api/v1/admin/meetings*
 * Permissions: view_meetings | manage_meetings
 *
 * Response DTOs expose `id` (class-transformer), not `_id`. Dates arrive as
 * ISO strings. `starts_at` is stored UTC; display in Africa/Lagos (WAT).
 * `ends_at` is denormalised on the BE from starts_at + duration_minutes.
 *
 * New optional fields degrade gracefully when absent from older BE payloads.
 * ============================================================ */

export const DEFAULT_DURATION_MINUTES = 60;
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 1440;

export const MEETING_AUDIENCE_TYPES = [
  'all_associates',
  'associate_pro_plus',
  'associate_only',
] as const;

export const MeetingAudienceTypeSchema = z.enum(MEETING_AUDIENCE_TYPES);
export type MeetingAudienceType = z.infer<typeof MeetingAudienceTypeSchema>;

export const MEETING_AUDIENCE_LABELS: Record<MeetingAudienceType, string> = {
  all_associates: 'All Associates',
  associate_pro_plus: 'Associate Pro+',
  associate_only: 'Associates only',
};

export const MEETING_SESSION_KINDS = ['general', 'recruitment', 'training'] as const;
export const MeetingSessionKindSchema = z.enum(MEETING_SESSION_KINDS);
export type MeetingSessionKind = z.infer<typeof MeetingSessionKindSchema>;

export const MEETING_SESSION_KIND_LABELS: Record<MeetingSessionKind, string> = {
  general: 'General',
  recruitment: 'Recruitment',
  training: 'Training',
};

export const MEETING_ACCESS_TYPES = ['online', 'physical'] as const;
export const MeetingAccessTypeSchema = z.enum(MEETING_ACCESS_TYPES);
export type MeetingAccessType = z.infer<typeof MeetingAccessTypeSchema>;

export const MEETING_ACCESS_TYPE_LABELS: Record<MeetingAccessType, string> = {
  online: 'Online',
  physical: 'Physical',
};

export const GOOGLE_MEET_URL = /^https:\/\/meet\.google\.com\/.+$/;

export function isGoogleMeetUrl(url: string): boolean {
  return GOOGLE_MEET_URL.test(url.trim());
}

const IsoDateSchema = z.string().min(1);

export const MeetingSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  google_meet_url: z.string(),
  audience_type: MeetingAudienceTypeSchema,
  audience_label: z.string(),
  share_url: z.string(),
  starts_at: IsoDateSchema,
  verification_lead_minutes: z.number(),
  duration_minutes: z.number().optional(),
  ends_at: IsoDateSchema.nullable().optional(),
  is_active: z.boolean(),
  verification_count: z.number(),
  /** ABO-6+ — optional until BE ships ABO-47. */
  session_kind: MeetingSessionKindSchema.optional(),
  access_type: MeetingAccessTypeSchema.optional(),
  venue: z.string().nullable().optional(),
  cohort_id: z.string().nullable().optional(),
  cohort_label: z.string().nullable().optional(),
  series_id: z.string().nullable().optional(),
  series_slug: z.string().nullable().optional(),
  series_name: z.string().nullable().optional(),
  series_position: z.number().nullable().optional(),
  series_total: z.number().nullable().optional(),
  cancelled_at: IsoDateSchema.nullable().optional(),
  createdAt: IsoDateSchema.optional(),
  updatedAt: IsoDateSchema.optional(),
});

export type Meeting = z.infer<typeof MeetingSchema>;

export const MeetingStatsByReferralStatusSchema = z.looseObject({
  referral_status: z.string().nullable(),
  count: z.number(),
});

export const MeetingStatsSchema = z.looseObject({
  total_verifications: z.number(),
  by_referral_status: z.array(MeetingStatsByReferralStatusSchema),
});

export type MeetingStats = z.infer<typeof MeetingStatsSchema>;

export const MeetingDetailSchema = MeetingSchema.extend({
  stats: MeetingStatsSchema,
});

export type MeetingDetail = z.infer<typeof MeetingDetailSchema>;

export const MeetingSeriesStatsSchema = z.looseObject({
  total_sessions: z.number(),
  completed_sessions: z.number(),
  upcoming_sessions: z.number(),
  cancelled_sessions: z.number(),
  total_attendance: z.number(),
  /** Fraction of attendance lost from first → last attended session (0–1). */
  drop_off_rate: z.number().nullable(),
});

export type MeetingSeriesStats = z.infer<typeof MeetingSeriesStatsSchema>;

export const MeetingSeriesSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  share_url: z.string(),
  session_kind: MeetingSessionKindSchema,
  access_type: MeetingAccessTypeSchema,
  audience_type: MeetingAudienceTypeSchema.nullable().optional(),
  audience_label: z.string().nullable().optional(),
  cohort_id: z.string().nullable().optional(),
  cohort_label: z.string().nullable().optional(),
  is_active: z.boolean(),
  cancelled_at: IsoDateSchema.nullable().optional(),
  sessions: z.array(MeetingSchema),
  stats: MeetingSeriesStatsSchema,
  createdAt: IsoDateSchema.optional(),
  updatedAt: IsoDateSchema.optional(),
});

export type MeetingSeries = z.infer<typeof MeetingSeriesSchema>;

export const MeetingVerificationSchema = z.looseObject({
  id: z.string(),
  user: z.string().nullable(),
  email: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  verified_at: IsoDateSchema,
  source: z.string(),
  createdAt: IsoDateSchema.optional(),
});

export type MeetingVerification = z.infer<typeof MeetingVerificationSchema>;

export type MeetingAudienceMode = 'tier' | 'cohort';

export type MeetingRecurrenceFrequency = 'none' | 'weekly';

export type CreateMeetingInput = {
  name: string;
  google_meet_url?: string;
  audience_type?: MeetingAudienceType;
  starts_at: string;
  verification_lead_minutes?: number;
  duration_minutes?: number;
  session_kind?: MeetingSessionKind;
  access_type?: MeetingAccessType;
  venue?: string;
  audience_mode?: MeetingAudienceMode;
  cohort_id?: string;
  /** When count > 1, BE/mock creates a series and returns the first session. */
  recurrence?: {
    frequency: MeetingRecurrenceFrequency;
    count: number;
  };
};

export type UpdateMeetingInput = Partial<
  Omit<CreateMeetingInput, 'recurrence' | 'audience_mode'>
>;

export function formatMeetingWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** `datetime-local` value in the browser's local zone. */
export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function verificationDisplayName(row: MeetingVerification): string {
  const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  return name || '—';
}

export function meetingAudienceDisplay(meeting: Meeting): string {
  if (meeting.cohort_label) return meeting.cohort_label;
  return meeting.audience_label;
}

export function meetingSeriesPositionLabel(meeting: Meeting): string {
  if (
    meeting.series_id &&
    meeting.series_position != null &&
    meeting.series_total != null
  ) {
    return `${meeting.series_position} / ${meeting.series_total}`;
  }
  return 'Standalone';
}

/** Preview ISO timestamps for weekly recurrence from a datetime-local start. */
export function previewRecurrenceDates(
  startsAtLocal: string,
  count: number,
  frequency: MeetingRecurrenceFrequency = 'weekly',
): string[] {
  if (!startsAtLocal || count < 1) return [];
  const start = new Date(startsAtLocal);
  if (Number.isNaN(start.getTime())) return [];
  const stepDays = frequency === 'weekly' ? 7 : 0;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * stepDays);
    out.push(d.toISOString());
  }
  return out;
}
