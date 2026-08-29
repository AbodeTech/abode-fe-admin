import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Admin meetings — /admin/meetings*
 *
 * Mirrors MeetingsAdminController on abode-be-v2 staging:
 *   POST  /admin/meetings
 *   GET   /admin/meetings
 *   GET   /admin/meetings/:id
 *   PATCH /admin/meetings/:id
 *   POST  /admin/meetings/:id/toggle-active
 *   GET   /admin/meetings/:id/verifications
 * ============================================================ */

type Audience = 'all_associates' | 'associate_pro_plus' | 'associate_only';

const AUDIENCE_LABELS: Record<Audience, string> = {
  all_associates: 'All Associates',
  associate_pro_plus: 'Associate Pro+',
  associate_only: 'Associates only',
};

type MockMeeting = {
  id: string;
  slug: string;
  name: string;
  google_meet_url: string;
  audience_type: Audience;
  starts_at: string;
  verification_lead_minutes: number;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

type MockVerification = {
  id: string;
  meeting: string;
  user: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  referral_status: string | null;
  region: string | null;
  verified_at: string;
  source: string;
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

const meetings: MockMeeting[] = [
  {
    id: '665fmt0000000000000000m1',
    slug: 'weekly-associate-call-a1b2c3',
    name: 'Weekly Associate Call',
    google_meet_url: 'https://meet.google.com/abc-defg-hij',
    audience_type: 'all_associates',
    starts_at: hoursFromNow(6),
    verification_lead_minutes: 30,
    is_active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000m2',
    slug: 'pro-briefing-f4e5d6',
    name: 'Associate Pro briefing',
    google_meet_url: 'https://meet.google.com/pro-aaaa-bbb',
    audience_type: 'associate_pro_plus',
    starts_at: hoursFromNow(48),
    verification_lead_minutes: 45,
    is_active: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: '665fmt0000000000000000m3',
    slug: 'archived-townhall-9c8d7e',
    name: 'Archived town hall',
    google_meet_url: 'https://meet.google.com/old-zzzz-yyy',
    audience_type: 'associate_only',
    starts_at: hoursFromNow(-72),
    verification_lead_minutes: 30,
    is_active: false,
    createdAt: now(),
    updatedAt: now(),
  },
];

const verifications: MockVerification[] = [
  {
    id: '665fmv0000000000000000v1',
    meeting: '665fmt0000000000000000m1',
    user: '665fuser0000000000000001',
    email: 'ada.obi@example.com',
    first_name: 'Ada',
    last_name: 'Obi',
    phone: '+2348011111111',
    referral_status: 'associate-pro',
    region: 'Lagos',
    verified_at: hoursFromNow(-1),
    source: 'existing_user',
    createdAt: hoursFromNow(-1),
  },
  {
    id: '665fmv0000000000000000v2',
    meeting: '665fmt0000000000000000m1',
    user: '665fuser0000000000000002',
    email: 'chidi.oka@example.com',
    first_name: 'Chidi',
    last_name: 'Oka',
    phone: '+2348022222222',
    referral_status: 'associate',
    region: 'Abuja',
    verified_at: hoursFromNow(-0.5),
    source: 'existing_user',
    createdAt: hoursFromNow(-0.5),
  },
];

function publicMeeting(m: MockMeeting) {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    google_meet_url: m.google_meet_url,
    audience_type: m.audience_type,
    audience_label: AUDIENCE_LABELS[m.audience_type],
    share_url: shareUrl(m.slug),
    starts_at: m.starts_at,
    verification_lead_minutes: m.verification_lead_minutes,
    is_active: m.is_active,
    verification_count: verifications.filter((v) => v.meeting === m.id).length,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function leanStats(meetingId: string) {
  const rows = verifications.filter((v) => v.meeting === meetingId);
  const byStatus = new Map<string | null, number>();
  for (const row of rows) {
    const key = row.referral_status;
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

let nextId = 10;

export const meetingRoutes: MockRoutes = {
  'GET /admin/meetings': ({ query }) => {
    let rows = [...meetings];
    if (typeof query.audience_type === 'string') {
      rows = rows.filter((m) => m.audience_type === query.audience_type);
    }
    if (query.is_active === 'true') rows = rows.filter((m) => m.is_active);
    if (query.is_active === 'false') rows = rows.filter((m) => !m.is_active);
    if (typeof query.q === 'string' && query.q.trim()) {
      const q = query.q.trim().toLowerCase();
      rows = rows.filter((m) => m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q));
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
    }>(raw);

    const name = (input.name ?? '').trim();
    const google_meet_url = (input.google_meet_url ?? '').trim();
    if (!name) throw new MockHttpError(400, 'name is required', 'VALIDATION_ERROR');
    if (!/^https:\/\/meet\.google\.com\/.+$/.test(google_meet_url)) {
      throw new MockHttpError(400, 'google_meet_url must be a valid Google Meet URL', 'INVALID_GOOGLE_MEET_URL');
    }
    if (!input.audience_type || !(input.audience_type in AUDIENCE_LABELS)) {
      throw new MockHttpError(400, 'audience_type is required', 'VALIDATION_ERROR');
    }
    if (!input.starts_at) throw new MockHttpError(400, 'starts_at is required', 'VALIDATION_ERROR');

    const created: MockMeeting = {
      id: `665fmt000000000000000${String(nextId++).padStart(2, '0')}`,
      slug: `${slugify(name) || 'meeting'}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      google_meet_url,
      audience_type: input.audience_type,
      starts_at: new Date(input.starts_at).toISOString(),
      verification_lead_minutes: input.verification_lead_minutes ?? 30,
      is_active: true,
      createdAt: now(),
      updatedAt: now(),
    };
    meetings.unshift(created);
    return publicMeeting(created);
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
    }>(raw);

    if (input.google_meet_url !== undefined) {
      if (!/^https:\/\/meet\.google\.com\/.+$/.test(input.google_meet_url.trim())) {
        throw new MockHttpError(400, 'google_meet_url must be a valid Google Meet URL', 'INVALID_GOOGLE_MEET_URL');
      }
      meeting.google_meet_url = input.google_meet_url.trim();
    }
    if (input.name !== undefined) meeting.name = input.name.trim();
    if (input.audience_type !== undefined) meeting.audience_type = input.audience_type;
    if (input.starts_at !== undefined) meeting.starts_at = new Date(input.starts_at).toISOString();
    if (input.verification_lead_minutes !== undefined) {
      meeting.verification_lead_minutes = input.verification_lead_minutes;
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

  'GET /admin/meetings/:id/verifications': ({ params, query }) => {
    const meeting = findMeeting(params.id);
    if (!meeting) throw new MockHttpError(404, 'Meeting not found', 'MEETING_NOT_FOUND');
    const rows = verifications
      .filter((v) => v.meeting === meeting.id)
      .sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())
      .map(({ meeting: _meeting, ...rest }) => rest);
    return paged(rows, query);
  },
};
