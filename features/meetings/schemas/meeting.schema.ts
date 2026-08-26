import { z } from 'zod';

/* ============================================================
 * Admin meetings — mirrors abode-be-v2 meetings module (staging).
 *
 * Paths: /api/v1/admin/meetings*
 * Permissions: view_meetings | manage_meetings
 *
 * Response DTOs expose `id` (class-transformer), not `_id`. Dates arrive as
 * ISO strings. `starts_at` is stored UTC; display in Africa/Lagos (WAT).
 * ============================================================ */

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
  is_active: z.boolean(),
  verification_count: z.number(),
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

export type CreateMeetingInput = {
  name: string;
  google_meet_url: string;
  audience_type: MeetingAudienceType;
  starts_at: string;
  verification_lead_minutes?: number;
};

export type UpdateMeetingInput = Partial<CreateMeetingInput>;

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
