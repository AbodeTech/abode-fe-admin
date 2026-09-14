import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Admin meetings — /admin/meetings*
 *
 * Mirrors MeetingsAdminController on abode-be-v2 staging, plus provisional
 * series / physical / cohort fields for ABO-6–8 (BE ABO-47–52).
 * ============================================================ */

type Audience = 'all_associates' | 'associate_pro_plus' | 'associate_only';
type AudienceMode = 'tier' | 'cohort';
type AccessType = 'online' | 'physical';

const AUDIENCE_LABELS: Record<Audience, string> = {
  all_associates: 'All Associates',
  associate_pro_plus: 'Associate Pro+',
  associate_only: 'Associates only',
};

const DEFAULT_DURATION_MINUTES = 60;
const SEED_COHORT_ID = 'cohort_sep_2026';
const SEED_COHORT_LABEL = 'Realtor Certification Program — September 2026';
const SEED_SERIES_ID = 'series_rcp_sep_2026';

function computeEndsAt(startsAt: string, durationMinutes: number) {
  return new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString();
}

type MockMeeting = {
  id: string;
  slug: string;
  name: string;
  google_meet_url: string;
  audience_mode: AudienceMode;
  audience_type: Audience | null;
  starts_at: string;
  verification_lead_minutes: number;
  duration_minutes: number;
  ends_at: string;
  is_active: boolean;
  access_type: AccessType;
  venue: string | null;
  city: string | null;
  details_confirmed: boolean;
  cohort_id: string | null;
  cohort_label: string | null;
  series_id: string | null;
  series_slug: string | null;
  series_name: string | null;
  series_position: number | null;
  series_total: number | null;
  cancelled_at: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockSeries = {
  id: string;
  slug: string;
  name: string;
  access_type: AccessType;
  audience_type: Audience | null;
  cohort_id: string | null;
  cohort_label: string | null;
  is_active: boolean;
  cancelled_at: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockVerification = {
  id: string;
  meeting: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  tier_at_verification: string | null;
  was_existing: boolean;
  region: string | null;
  verified_at: string;
  source: string;
  method: string;
  createdAt: string;
};

const hoursFromNow = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const now = () => new Date().toISOString();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

function shareUrl(slug: string) {
  return `https://app.abode.ng/meetings/join/${slug}`;
}

function seriesShareUrl(slug: string) {
  return `https://abodewebinar.abodeflex.ng/series/${slug}`;
}

const seriesStore: MockSeries[] = [
  {
    id: SEED_SERIES_ID,
    slug: 'rcp-september-2026-sessions',
    name: 'RCP September 2026 — Training series',
    access_type: 'online',
    audience_type: null,
    cohort_id: SEED_COHORT_ID,
    cohort_label: SEED_COHORT_LABEL,
    is_active: true,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const meetings: MockMeeting[] = [
  {
    id: '665fmt0000000000000000m1',
    slug: 'weekly-associate-call-a1b2c3',
    name: 'Weekly Associate Call',
    google_meet_url: 'https://meet.google.com/abc-defg-hij',
    audience_mode: 'tier',
    audience_type: 'all_associates',
    starts_at: hoursFromNow(6),
    verification_lead_minutes: 30,
    duration_minutes: 60,
    ends_at: hoursFromNow(7),
    is_active: true,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: null,
    cohort_label: null,
    series_id: null,
    series_slug: null,
    series_name: null,
    series_position: null,
    series_total: null,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000m2',
    slug: 'pro-briefing-f4e5d6',
    name: 'Associate Pro briefing',
    google_meet_url: 'https://meet.google.com/pro-aaaa-bbb',
    audience_mode: 'tier',
    audience_type: 'associate_pro_plus',
    starts_at: hoursFromNow(48),
    verification_lead_minutes: 45,
    duration_minutes: 90,
    ends_at: hoursFromNow(49.5),
    is_active: true,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: null,
    cohort_label: null,
    series_id: null,
    series_slug: null,
    series_name: null,
    series_position: null,
    series_total: null,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000m3',
    slug: 'archived-townhall-9c8d7e',
    name: 'Archived town hall',
    google_meet_url: 'https://meet.google.com/old-zzzz-yyy',
    audience_mode: 'tier',
    audience_type: 'associate_only',
    starts_at: hoursFromNow(-72),
    verification_lead_minutes: 30,
    duration_minutes: 60,
    ends_at: hoursFromNow(-71),
    is_active: false,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: null,
    cohort_label: null,
    series_id: null,
    series_slug: null,
    series_name: null,
    series_position: null,
    series_total: null,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000s1',
    slug: 'rcp-sep-session-1',
    name: 'RCP Sep — Session 1',
    google_meet_url: 'https://meet.google.com/rcp-ses-001',
    audience_mode: 'cohort',
    audience_type: null,
    starts_at: hoursFromNow(-168),
    verification_lead_minutes: 30,
    duration_minutes: 90,
    ends_at: hoursFromNow(-166.5),
    is_active: true,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: SEED_COHORT_ID,
    cohort_label: SEED_COHORT_LABEL,
    series_id: SEED_SERIES_ID,
    series_slug: 'rcp-september-2026-sessions',
    series_name: 'RCP September 2026 — Training series',
    series_position: 1,
    series_total: 4,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000s2',
    slug: 'rcp-sep-session-2',
    name: 'RCP Sep — Session 2',
    google_meet_url: 'https://meet.google.com/rcp-ses-002',
    audience_mode: 'cohort',
    audience_type: null,
    starts_at: hoursFromNow(24),
    verification_lead_minutes: 30,
    duration_minutes: 90,
    ends_at: hoursFromNow(25.5),
    is_active: true,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: SEED_COHORT_ID,
    cohort_label: SEED_COHORT_LABEL,
    series_id: SEED_SERIES_ID,
    series_slug: 'rcp-september-2026-sessions',
    series_name: 'RCP September 2026 — Training series',
    series_position: 2,
    series_total: 4,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000s3',
    slug: 'rcp-sep-session-3',
    name: 'RCP Sep — Session 3',
    google_meet_url: 'https://meet.google.com/rcp-ses-003',
    audience_mode: 'cohort',
    audience_type: null,
    starts_at: hoursFromNow(24 + 168),
    verification_lead_minutes: 30,
    duration_minutes: 90,
    ends_at: hoursFromNow(24 + 168 + 1.5),
    is_active: true,
    access_type: 'online',
    venue: null,
    city: null,
    details_confirmed: false,
    cohort_id: SEED_COHORT_ID,
    cohort_label: SEED_COHORT_LABEL,
    series_id: SEED_SERIES_ID,
    series_slug: 'rcp-september-2026-sessions',
    series_name: 'RCP September 2026 — Training series',
    series_position: 3,
    series_total: 4,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000s4',
    slug: 'rcp-sep-session-4',
    name: 'RCP Sep — Session 4 (physical)',
    google_meet_url: '',
    audience_mode: 'cohort',
    audience_type: null,
    starts_at: hoursFromNow(24 + 336),
    verification_lead_minutes: 60,
    duration_minutes: 180,
    ends_at: hoursFromNow(24 + 336 + 3),
    is_active: true,
    access_type: 'physical',
    venue: 'Abode HQ, Lekki Phase 1',
    city: 'Lagos',
    details_confirmed: true,
    cohort_id: SEED_COHORT_ID,
    cohort_label: SEED_COHORT_LABEL,
    series_id: SEED_SERIES_ID,
    series_slug: 'rcp-september-2026-sessions',
    series_name: 'RCP September 2026 — Training series',
    series_position: 4,
    series_total: 4,
    cancelled_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const verifications: MockVerification[] = [
  {
    id: '665fmv0000000000000000v1',
    meeting: '665fmt0000000000000000m1',
    user_id: '665fuser0000000000000001',
    email: 'ada.obi@example.com',
    first_name: 'Ada',
    last_name: 'Obi',
    phone: '+2348011111111',
    tier_at_verification: 'associate-pro',
    was_existing: true,
    region: 'Lagos',
    verified_at: hoursFromNow(-1),
    source: 'existing_user',
    method: 'link',
    createdAt: hoursFromNow(-1),
  },
  {
    id: '665fmv0000000000000000v2',
    meeting: '665fmt0000000000000000m1',
    user_id: '665fuser0000000000000002',
    email: 'chidi.oka@example.com',
    first_name: 'Chidi',
    last_name: 'Oka',
    phone: '+2348022222222',
    tier_at_verification: 'associate',
    was_existing: true,
    region: 'Abuja',
    verified_at: hoursFromNow(-0.5),
    source: 'existing_user',
    method: 'link',
    createdAt: hoursFromNow(-0.5),
  },
  {
    id: '665fmv0000000000000000v3',
    meeting: '665fmt0000000000000000s1',
    user_id: '665fuser0000000000000003',
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Okafor',
    phone: '+2348011111111',
    tier_at_verification: null,
    was_existing: false,
    region: 'Lagos',
    verified_at: hoursFromNow(-167),
    source: 'walk_in',
    method: 'manual',
    createdAt: hoursFromNow(-167),
  },
  {
    id: '665fmv0000000000000000v4',
    meeting: '665fmt0000000000000000s1',
    user_id: '665fuser0000000000000004',
    email: 'bola@example.com',
    first_name: 'Bola',
    last_name: 'Ade',
    phone: '+2348033333333',
    tier_at_verification: null,
    was_existing: false,
    region: 'Ibadan',
    verified_at: hoursFromNow(-166.8),
    source: 'walk_in',
    method: 'manual',
    createdAt: hoursFromNow(-166.8),
  },
];

function publicMeeting(m: MockMeeting) {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    google_meet_url: m.google_meet_url || null,
    audience_mode: m.audience_mode,
    audience_type: m.audience_type,
    audience_label: m.cohort_label
      ? m.cohort_label
      : m.audience_type
        ? AUDIENCE_LABELS[m.audience_type]
        : AUDIENCE_LABELS.all_associates,
    share_url: shareUrl(m.slug),
    starts_at: m.starts_at,
    verification_lead_minutes: m.verification_lead_minutes,
    duration_minutes: m.duration_minutes,
    ends_at: m.ends_at,
    is_active: m.is_active,
    verification_count: verifications.filter((v) => v.meeting === m.id).length,
    access_type: m.access_type,
    venue: m.venue,
    city: m.city,
    details_confirmed: m.details_confirmed,
    cohort_id: m.cohort_id,
    cohort_label: m.cohort_label,
    series_id: m.series_id,
    series_slug: m.series_slug,
    series_name: m.series_name,
    series_position: m.series_position,
    series_total: m.series_total,
    cancelled_at: m.cancelled_at,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function leanStats(meetingId: string) {
  const rows = verifications.filter((v) => v.meeting === meetingId);
  const byStatus = new Map<string | null, number>();
  for (const row of rows) {
    const key = row.tier_at_verification;
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }
  return {
    total_verifications: rows.length,
    by_referral_status: [...byStatus.entries()].map(([referral_status, count]) => ({
      referral_status,
      count,
    })),
  };
}

function findMeeting(id: string) {
  return meetings.find((m) => m.id === id);
}

function findSeries(id: string) {
  return seriesStore.find((s) => s.id === id);
}

function sessionsForSeries(seriesId: string) {
  return meetings
    .filter((m) => m.series_id === seriesId)
    .sort((a, b) => (a.series_position ?? 0) - (b.series_position ?? 0));
}

function publicSeries(series: MockSeries) {
  const sessions = sessionsForSeries(series.id);
  const nowMs = Date.now();
  let completed = 0;
  let upcoming = 0;
  let cancelled = 0;
  let totalAttendance = 0;
  const attendanceByPosition: number[] = [];

  for (const session of sessions) {
    const attendance = verifications.filter((v) => v.meeting === session.id).length;
    totalAttendance += attendance;
    attendanceByPosition.push(attendance);
    if (session.cancelled_at) cancelled += 1;
    else if (new Date(session.ends_at).getTime() < nowMs) completed += 1;
    else upcoming += 1;
  }

  const firstAttended = attendanceByPosition.find((n) => n > 0);
  const lastAttended = [...attendanceByPosition].reverse().find((n) => n > 0);
  let drop_off_rate: number | null = null;
  if (firstAttended && lastAttended != null && firstAttended > 0) {
    drop_off_rate = Math.max(0, (firstAttended - lastAttended) / firstAttended);
  }

  return {
    id: series.id,
    slug: series.slug,
    name: series.name,
    share_url: seriesShareUrl(series.slug),
    access_type: series.access_type,
    audience_type: series.audience_type,
    audience_label: series.cohort_label
      ? series.cohort_label
      : series.audience_type
        ? AUDIENCE_LABELS[series.audience_type]
        : null,
    cohort_id: series.cohort_id,
    cohort_label: series.cohort_label,
    is_active: series.is_active,
    cancelled_at: series.cancelled_at,
    sessions: sessions.map(publicMeeting),
    stats: {
      total_sessions: sessions.length,
      completed_sessions: completed,
      upcoming_sessions: upcoming,
      cancelled_sessions: cancelled,
      total_attendance: totalAttendance,
      drop_off_rate,
    },
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  };
}

let nextId = 20;

function resolveAudienceLabel(input: {
  audience_type?: Audience;
  cohort_id?: string | null;
  cohort_label?: string | null;
}) {
  if (input.cohort_label) return input.cohort_label;
  if (input.cohort_id === SEED_COHORT_ID) return SEED_COHORT_LABEL;
  if (input.audience_type && input.audience_type in AUDIENCE_LABELS) {
    return AUDIENCE_LABELS[input.audience_type];
  }
  return AUDIENCE_LABELS.all_associates;
}

/**
 * DC-02 — build a cohort's sessions from its create-time Schedule in one call:
 * N online days (a series once there's more than one) plus an optional
 * physical day. Called from the academy mock inside cohort creation so a
 * cohort never lands with only half its sessions.
 */
export function seedSessionsForCohort(input: {
  cohortId: string;
  cohortLabel: string;
  schedule: {
    online?: {
      days: number;
      starts_at: string;
      duration_minutes?: number;
      verification_lead_minutes?: number;
      meet_url?: string;
      frequency?: 'daily' | 'weekdays' | 'weekly';
    };
    physical?: { date: string; venue: string; city: string; details_confirmed?: boolean };
  };
}): { sessionIds: string[]; seriesId: string | null } {
  const { cohortId, cohortLabel, schedule } = input;
  const sessionIds: string[] = [];
  let seriesId: string | null = null;

  const online = schedule.online;
  const onlineDays = online ? Math.max(0, Math.floor(online.days || 0)) : 0;
  if (online && onlineDays > 0) {
    const firstStarts = new Date(online.starts_at);
    if (Number.isNaN(firstStarts.getTime())) {
      throw new MockHttpError(400, 'schedule.online.starts_at is invalid', 'VALIDATION_ERROR');
    }
    const duration = online.duration_minutes ?? DEFAULT_DURATION_MINUTES;
    const lead = online.verification_lead_minutes ?? 30;
    const frequency = online.frequency ?? 'daily';
    const meetUrl = (online.meet_url ?? '').trim();
    const stepDays = frequency === 'weekly' ? 7 : 1;

    let series: MockSeries | null = null;
    if (onlineDays > 1) {
      series = {
        id: `series_${Math.random().toString(36).slice(2, 10)}`,
        slug: `${slugify(cohortLabel) || 'series'}-${Math.random().toString(16).slice(2, 8)}`,
        name: `${cohortLabel} — Online sessions`,
        access_type: 'online',
        audience_type: null,
        cohort_id: cohortId,
        cohort_label: cohortLabel,
        is_active: true,
        cancelled_at: null,
        createdAt: now(),
        updatedAt: now(),
      };
      seriesStore.unshift(series);
      seriesId = series.id;
    }

    let dayIndex = 0;
    const cursor = new Date(firstStarts);
    for (let i = 0; i < onlineDays; i++) {
      while (frequency === 'weekdays' && (cursor.getDay() === 0 || cursor.getDay() === 6)) {
        cursor.setDate(cursor.getDate() + 1);
      }
      const starts_at = cursor.toISOString();
      dayIndex += 1;
      const created: MockMeeting = {
        id: `665fmt000000000000000${String(nextId++).padStart(2, '0')}`,
        slug: `day-${dayIndex}-${slugify(cohortLabel) || 'cohort'}-${Math.random().toString(16).slice(2, 8)}`,
        name: `Day ${dayIndex} — ${cohortLabel}`,
        google_meet_url: meetUrl,
        audience_mode: 'cohort',
        audience_type: null,
        starts_at,
        verification_lead_minutes: lead,
        duration_minutes: duration,
        ends_at: computeEndsAt(starts_at, duration),
        is_active: true,
        access_type: 'online',
        venue: null,
        city: null,
        details_confirmed: false,
        cohort_id: cohortId,
        cohort_label: cohortLabel,
        series_id: series?.id ?? null,
        series_slug: series?.slug ?? null,
        series_name: series?.name ?? null,
        series_position: series ? dayIndex : null,
        series_total: series ? onlineDays : null,
        cancelled_at: null,
        createdAt: now(),
        updatedAt: now(),
      };
      meetings.unshift(created);
      sessionIds.push(created.id);
      cursor.setDate(cursor.getDate() + stepDays);
    }
  }

  if (schedule.physical) {
    const { date, venue, city, details_confirmed } = schedule.physical;
    const startsAt = new Date(date);
    if (Number.isNaN(startsAt.getTime())) {
      throw new MockHttpError(400, 'schedule.physical.date is invalid', 'VALIDATION_ERROR');
    }
    const duration = 180;
    const created: MockMeeting = {
      id: `665fmt000000000000000${String(nextId++).padStart(2, '0')}`,
      slug: `event-day-${slugify(cohortLabel) || 'cohort'}-${Math.random().toString(16).slice(2, 8)}`,
      name: `Event Day — ${cohortLabel}`,
      google_meet_url: '',
      audience_mode: 'cohort',
      audience_type: null,
      starts_at: startsAt.toISOString(),
      verification_lead_minutes: 60,
      duration_minutes: duration,
      ends_at: computeEndsAt(startsAt.toISOString(), duration),
      is_active: true,
      access_type: 'physical',
      venue,
      city,
      details_confirmed: Boolean(details_confirmed),
      cohort_id: cohortId,
      cohort_label: cohortLabel,
      series_id: null,
      series_slug: null,
      series_name: null,
      series_position: null,
      series_total: null,
      cancelled_at: null,
      createdAt: now(),
      updatedAt: now(),
    };
    meetings.unshift(created);
    sessionIds.push(created.id);
  }

  return { sessionIds, seriesId };
}

/** Whether the cohort has at least one (non-cancelled) physical session — gates dashboard `checked_in`. */
export function cohortHasPhysicalSession(cohortId: string): boolean {
  return meetings.some((m) => m.cohort_id === cohortId && m.access_type === 'physical' && !m.cancelled_at);
}

/** For the academy mock's Cohort response — real BE hardcodes 0 until Phase 2 wires cohort-scoped sessions. */
export function countSessionsForCohort(cohortId: string): number {
  return meetings.filter((m) => m.cohort_id === cohortId && !m.cancelled_at).length;
}

export const meetingRoutes: MockRoutes = {
  'GET /admin/meetings': ({ query }) => {
    let rows = [...meetings];
    if (typeof query.audience_type === 'string') {
      rows = rows.filter((m) => m.audience_type === query.audience_type);
    }
    // session_kind never existed on the real BE — still not accepted here.
    // cohort_id and access_type both landed on the real ListMeetingsQueryDto
    // 2026-09-09 (fee2e97) — filtered server-side here to match.
    if (typeof query.cohort_id === 'string' && query.cohort_id.trim()) {
      rows = rows.filter((m) => m.cohort_id === query.cohort_id);
    }
    if (typeof query.access_type === 'string') {
      rows = rows.filter((m) => m.access_type === query.access_type);
    }
    if (query.is_active === 'true') rows = rows.filter((m) => m.is_active);
    if (query.is_active === 'false') rows = rows.filter((m) => !m.is_active);
    if (typeof query.q === 'string' && query.q.trim()) {
      const q = query.q.trim().toLowerCase();
      rows = rows.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q) ||
          (m.series_name ?? '').toLowerCase().includes(q) ||
          (m.cohort_label ?? '').toLowerCase().includes(q),
      );
    }
    if (typeof query.starts_after === 'string') {
      const after = new Date(query.starts_after).getTime();
      rows = rows.filter((m) => new Date(m.starts_at).getTime() >= after);
    }
    if (typeof query.starts_before === 'string') {
      const before = new Date(query.starts_before).getTime();
      rows = rows.filter((m) => new Date(m.starts_at).getTime() <= before);
    }
    rows.sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
    return paged(rows.map(publicMeeting), query);
  },

  'POST /admin/meetings': ({ body: raw }) => {
    const input = body<{
      name?: string;
      google_meet_url?: string;
      audience_type?: Audience;
      starts_at?: string;
      verification_lead_minutes?: number;
      duration_minutes?: number;
      access_type?: AccessType;
      venue?: string;
      city?: string;
      details_confirmed?: boolean;
      audience_mode?: 'tier' | 'cohort';
      cohort_id?: string;
      recurrence?: { frequency?: 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom'; count?: number };
    }>(raw);

    const name = (input.name ?? '').trim();
    const access_type: AccessType = input.access_type ?? 'online';
    const google_meet_url = (input.google_meet_url ?? '').trim();
    const venue = (input.venue ?? '').trim() || null;
    const city = (input.city ?? '').trim() || null;
    const details_confirmed = Boolean(input.details_confirmed);

    if (!name) throw new MockHttpError(400, 'name is required', 'VALIDATION_ERROR');
    if (access_type === 'online' && !/^https:\/\/meet\.google\.com\/.+$/.test(google_meet_url)) {
      throw new MockHttpError(400, 'google_meet_url must be a valid Google Meet URL', 'INVALID_GOOGLE_MEET_URL');
    }
    if (access_type === 'physical' && !venue) {
      throw new MockHttpError(400, 'venue is required for physical sessions', 'VALIDATION_ERROR');
    }
    if (!input.starts_at) throw new MockHttpError(400, 'starts_at is required', 'VALIDATION_ERROR');

    const audience_mode: AudienceMode = input.audience_mode ?? (input.cohort_id ? 'cohort' : 'tier');
    let audience_type: Audience | null = input.audience_type ?? 'all_associates';
    let cohort_id: string | null = null;
    let cohort_label: string | null = null;

    if (audience_mode === 'cohort') {
      if (!input.cohort_id?.trim()) {
        throw new MockHttpError(400, 'cohort_id is required when audience_mode is cohort', 'VALIDATION_ERROR');
      }
      cohort_id = input.cohort_id.trim();
      cohort_label =
        cohort_id === SEED_COHORT_ID
          ? SEED_COHORT_LABEL
          : `Cohort ${cohort_id}`;
      audience_type = null;
    } else {
      if (!audience_type || !(audience_type in AUDIENCE_LABELS)) {
        throw new MockHttpError(400, 'audience_type is required', 'VALIDATION_ERROR');
      }
    }

    const duration = Number(input.duration_minutes ?? DEFAULT_DURATION_MINUTES);
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      throw new MockHttpError(400, 'duration_minutes must be between 1 and 1440', 'VALIDATION_ERROR');
    }

    const recurrenceCount = Math.max(1, Number(input.recurrence?.count ?? 1));
    const frequency = input.recurrence?.frequency ?? 'none';
    const lead = input.verification_lead_minutes ?? 30;
    const firstStarts = new Date(input.starts_at);
    if (Number.isNaN(firstStarts.getTime())) {
      throw new MockHttpError(400, 'starts_at is invalid', 'VALIDATION_ERROR');
    }

    const createOne = (opts: {
      starts_at: string;
      position: number | null;
      total: number | null;
      series: MockSeries | null;
      nameOverride?: string;
    }): MockMeeting => {
      const starts_at = opts.starts_at;
      const created: MockMeeting = {
        id: `665fmt000000000000000${String(nextId++).padStart(2, '0')}`,
        slug: `${slugify(opts.nameOverride ?? name) || 'meeting'}-${Math.random().toString(16).slice(2, 8)}`,
        name: opts.nameOverride ?? name,
        google_meet_url: access_type === 'online' ? google_meet_url : google_meet_url || '',
        audience_mode,
        audience_type,
        starts_at,
        verification_lead_minutes: lead,
        duration_minutes: duration,
        ends_at: computeEndsAt(starts_at, duration),
        is_active: true,
        access_type,
        venue,
        city,
        details_confirmed,
        cohort_id,
        cohort_label,
        series_id: opts.series?.id ?? null,
        series_slug: opts.series?.slug ?? null,
        series_name: opts.series?.name ?? null,
        series_position: opts.position,
        series_total: opts.total,
        cancelled_at: null,
        createdAt: now(),
        updatedAt: now(),
      };
      meetings.unshift(created);
      return created;
    };

    if (recurrenceCount > 1 && frequency !== 'none' && frequency !== 'custom') {
      const seriesSlug = `${slugify(name) || 'series'}-${Math.random().toString(16).slice(2, 8)}`;
      const series: MockSeries = {
        id: `series_${Math.random().toString(36).slice(2, 10)}`,
        slug: seriesSlug,
        name,
        access_type,
        audience_type: audience_mode === 'tier' ? audience_type : null,
        cohort_id,
        cohort_label,
        is_active: true,
        cancelled_at: null,
        createdAt: now(),
        updatedAt: now(),
      };
      seriesStore.unshift(series);

      const stepDays = frequency === 'weekly' ? 7 : 1;
      let first: MockMeeting | null = null;
      const cursor = new Date(firstStarts);
      let created = 0;
      while (created < recurrenceCount) {
        while (frequency === 'weekdays' && (cursor.getDay() === 0 || cursor.getDay() === 6)) {
          cursor.setDate(cursor.getDate() + 1);
        }
        created += 1;
        const session = createOne({
          starts_at: cursor.toISOString(),
          position: created,
          total: recurrenceCount,
          series,
          nameOverride: `${name} — Session ${created}`,
        });
        if (!first) first = session;
        cursor.setDate(cursor.getDate() + stepDays);
      }
      return publicMeeting(first!);
    }

    const created = createOne({
      starts_at: firstStarts.toISOString(),
      position: null,
      total: null,
      series: null,
    });
    return publicMeeting(created);
  },

  'GET /admin/meetings/series/:id': ({ params }) => {
    const series = findSeries(params.id);
    if (!series) throw new MockHttpError(404, 'Series not found', 'SERIES_NOT_FOUND');
    return publicSeries(series);
  },

  'POST /admin/meetings/series/:id/cancel': ({ params }) => {
    const series = findSeries(params.id);
    if (!series) throw new MockHttpError(404, 'Series not found', 'SERIES_NOT_FOUND');
    const ts = now();
    series.cancelled_at = ts;
    series.is_active = false;
    series.updatedAt = ts;
    const nowMs = Date.now();
    for (const session of sessionsForSeries(series.id)) {
      if (new Date(session.starts_at).getTime() >= nowMs && !session.cancelled_at) {
        session.cancelled_at = ts;
        session.is_active = false;
        session.updatedAt = ts;
      }
    }
    return publicSeries(series);
  },

  'GET /admin/meetings/:id': ({ params }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    return { ...publicMeeting(meeting), stats: leanStats(meeting.id) };
  },

  'PATCH /admin/meetings/:id': ({ params, body: raw }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    const input = body<{
      name?: string;
      google_meet_url?: string;
      audience_type?: Audience;
      starts_at?: string;
      verification_lead_minutes?: number;
      duration_minutes?: number;
      access_type?: AccessType;
      venue?: string;
      city?: string;
      details_confirmed?: boolean;
      cohort_id?: string | null;
    }>(raw);

    if (input.google_meet_url !== undefined) {
      const url = input.google_meet_url.trim();
      const access = input.access_type ?? meeting.access_type;
      if (access === 'online' && !/^https:\/\/meet\.google\.com\/.+$/.test(url)) {
        throw new MockHttpError(400, 'google_meet_url must be a valid Google Meet URL', 'INVALID_GOOGLE_MEET_URL');
      }
      meeting.google_meet_url = url;
    }
    if (input.name !== undefined) meeting.name = input.name.trim();
    if (input.audience_type !== undefined) meeting.audience_type = input.audience_type;
    if (input.starts_at !== undefined) meeting.starts_at = new Date(input.starts_at).toISOString();
    if (input.verification_lead_minutes !== undefined) {
      meeting.verification_lead_minutes = input.verification_lead_minutes;
    }
    if (input.duration_minutes !== undefined) {
      const duration = Number(input.duration_minutes);
      if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
        throw new MockHttpError(400, 'duration_minutes must be between 1 and 1440', 'VALIDATION_ERROR');
      }
      meeting.duration_minutes = duration;
    }
    if (input.access_type !== undefined) meeting.access_type = input.access_type;
    if (input.venue !== undefined) meeting.venue = input.venue.trim() || null;
    if (input.city !== undefined) meeting.city = input.city.trim() || null;
    if (input.details_confirmed !== undefined) meeting.details_confirmed = input.details_confirmed;
    if (input.cohort_id !== undefined) {
      meeting.cohort_id = input.cohort_id;
      meeting.cohort_label = input.cohort_id
        ? resolveAudienceLabel({ cohort_id: input.cohort_id })
        : null;
    }
    if (input.starts_at !== undefined || input.duration_minutes !== undefined) {
      meeting.ends_at = computeEndsAt(meeting.starts_at, meeting.duration_minutes);
    }
    meeting.updatedAt = now();
    return publicMeeting(meeting);
  },

  'POST /admin/meetings/:id/toggle-active': ({ params, body: raw }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    const input = body<{ is_active?: boolean }>(raw);
    if (typeof input.is_active !== 'boolean') {
      throw new MockHttpError(400, 'is_active is required', 'VALIDATION_ERROR');
    }
    meeting.is_active = input.is_active;
    meeting.updatedAt = now();
    return publicMeeting(meeting);
  },

  'POST /admin/meetings/:id/cancel': ({ params }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    const ts = now();
    meeting.cancelled_at = ts;
    meeting.is_active = false;
    meeting.updatedAt = ts;
    return publicMeeting(meeting);
  },

  'GET /admin/meetings/:id/verifications': ({ params, query }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    const rows = verifications
      .filter((v) => v.meeting === meeting.id)
      .sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())
      .map((row) => {
        const { meeting: _ignored, ...rest } = row;
        void _ignored;
        return rest;
      });
    return paged(rows, query);
  },
};
