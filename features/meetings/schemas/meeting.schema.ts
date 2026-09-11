import { z } from 'zod';

/* ============================================================
 * Admin meetings — verified field-for-field against abode-be-v2 staging
 * (src/modules/meetings/*, 2026-09-09/10). No `session_kind` on the real
 * BE — audience_mode + cohort_id already distinguish a cohort session from
 * a tier one, so it never existed there and is dropped here too.
 *
 * Paths: /api/v1/admin/meetings*
 * Permissions: view_meetings | manage_meetings
 *
 * Response DTOs expose `id` (class-transformer), not `_id`. Dates arrive as
 * ISO strings. `starts_at` is stored UTC; display in Africa/Lagos (WAT).
 * `ends_at` is denormalised on the BE from starts_at + duration_minutes.
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

export const MEETING_AUDIENCE_MODES = ['tier', 'cohort'] as const;
export const MeetingAudienceModeSchema = z.enum(MEETING_AUDIENCE_MODES);
export type MeetingAudienceMode = z.infer<typeof MeetingAudienceModeSchema>;

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
  /** Null when link-pending (online, no Meet URL yet) or physical. */
  google_meet_url: z.string().nullable(),
  audience_mode: MeetingAudienceModeSchema.optional().default('tier'),
  /** Null for a cohort-audience meeting. */
  audience_type: MeetingAudienceTypeSchema.nullable().optional(),
  audience_label: z.string().optional(),
  share_url: z.string(),
  starts_at: IsoDateSchema,
  verification_lead_minutes: z.number(),
  duration_minutes: z.number().optional(),
  ends_at: IsoDateSchema.nullable().optional(),
  is_active: z.boolean(),
  verification_count: z.number().optional().default(0),
  access_type: MeetingAccessTypeSchema.optional().default('online'),
  venue: z.string().nullable().optional(),
  /** Physical sessions only. */
  city: z.string().nullable().optional(),
  /** Physical sessions only — gates QR issuance. */
  details_confirmed: z.boolean().optional().default(false),
  cohort_id: z.string().nullable().optional(),
  cohort_label: z.string().nullable().optional(),
  series_id: z.string().nullable().optional(),
  /**
   * Not on the real BE's MeetingDto (only `series_id` is) — the mock still
   * provides these for a nicer local dev experience. Degrade gracefully when
   * absent: `meetingSeriesPositionLabel` falls back to "Standalone".
   */
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

/** No dedicated series-detail endpoint on the real BE yet — mock-only. */
export const MeetingSeriesStatsSchema = z.looseObject({
  total_sessions: z.number(),
  completed_sessions: z.number(),
  upcoming_sessions: z.number(),
  cancelled_sessions: z.number(),
  total_attendance: z.number(),
  drop_off_rate: z.number().nullable(),
});

export type MeetingSeriesStats = z.infer<typeof MeetingSeriesStatsSchema>;

export const MeetingSeriesSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  share_url: z.string(),
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

/**
 * Verified field-for-field against `MeetingVerificationDto` on abode-be-v2
 * staging (meeting-response.dto.ts, 2026-09-10). The real BE sends `user_id`
 * and `tier_at_verification` — this schema previously required `user` and
 * `referral_status`, neither of which the real payload has, so every row
 * failed Zod parsing and the join log silently rendered empty (the query's
 * error was never surfaced in the UI — see the join-log section on the
 * meeting detail page, which now does).
 */
export const MeetingVerificationSchema = z.looseObject({
  id: z.string(),
  meeting_id: z.string().optional(),
  email: z.string(),
  user_id: z.string().nullable().optional(),
  tier_at_verification: z.string().nullable().optional(),
  was_existing: z.boolean().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  verified_at: IsoDateSchema,
  source: z.string(),
  method: z.string().optional(),
  createdAt: IsoDateSchema.optional(),
});

export type MeetingVerification = z.infer<typeof MeetingVerificationSchema>;

/** Matches abode-be-v2's `RECURRENCE_FREQUENCIES` minus 'none'/'custom' (not built in this UI yet). */
export const MEETING_RECURRENCE_FREQUENCIES = ['daily', 'weekdays', 'weekly'] as const;
export type MeetingRecurrenceFrequency = (typeof MEETING_RECURRENCE_FREQUENCIES)[number];

export const MEETING_RECURRENCE_FREQUENCY_LABELS: Record<MeetingRecurrenceFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
};

export type CreateMeetingInput = {
  name: string;
  google_meet_url?: string;
  audience_type?: MeetingAudienceType;
  starts_at: string;
  verification_lead_minutes?: number;
  duration_minutes?: number;
  access_type?: MeetingAccessType;
  venue?: string;
  city?: string;
  details_confirmed?: boolean;
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
    hour12: true,
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

/** An online session created without a Meet URL yet; reminders hold until one is set. */
export function isLinkPending(meeting: Meeting): boolean {
  return meeting.access_type === 'online' && !meeting.google_meet_url;
}

/**
 * Whether the verification window is currently open — from
 * `verification_lead_minutes` before `starts_at` through `ends_at`. Drives
 * whether the Join log is worth polling; a session that hasn't opened yet or
 * has already ended can't produce new verifications, so there's nothing to
 * refetch for.
 */
export function isMeetingLive(meeting: Meeting, at: number = Date.now()): boolean {
  if (meeting.cancelled_at) return false;
  const startsAt = new Date(meeting.starts_at).getTime();
  if (Number.isNaN(startsAt)) return false;
  const opensAt = startsAt - meeting.verification_lead_minutes * 60_000;
  const endsAt = meeting.ends_at ? new Date(meeting.ends_at).getTime() : startsAt + 60 * 60_000;
  return at >= opensAt && at <= endsAt;
}

export function meetingAudienceDisplay(meeting: Meeting): string {
  if (meeting.cohort_label) return meeting.cohort_label;
  return meeting.audience_label ?? (meeting.audience_type ? MEETING_AUDIENCE_LABELS[meeting.audience_type] : '—');
}

/**
 * `series_position`/`series_total` are mock-only (see the field comments
 * above) — the real BE only ever sends `series_id`. A session with a
 * `series_id` but no position/total is still part of a series, just
 * without a nice "2 / 4" label to show; call it "Standalone" only when
 * there's truly no `series_id` at all.
 */
export function meetingSeriesPositionLabel(meeting: Meeting): string {
  if (meeting.series_position != null && meeting.series_total != null) {
    return `${meeting.series_position} / ${meeting.series_total}`;
  }
  if (meeting.series_id) return 'Part of series';
  return 'Standalone';
}

/** Preview ISO timestamps for a recurrence from a datetime-local start. `weekdays` skips Sat/Sun. */
export function previewRecurrenceDates(
  startsAtLocal: string,
  count: number,
  frequency: MeetingRecurrenceFrequency = 'weekly',
): string[] {
  if (!startsAtLocal || count < 1) return [];
  const start = new Date(startsAtLocal);
  if (Number.isNaN(start.getTime())) return [];
  const out: string[] = [];
  const cursor = new Date(start);
  while (out.length < count) {
    if (frequency !== 'weekdays' || (cursor.getDay() !== 0 && cursor.getDay() !== 6)) {
      out.push(cursor.toISOString());
    }
    cursor.setDate(cursor.getDate() + (frequency === 'weekly' ? 7 : 1));
  }
  return out;
}
