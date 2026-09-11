import { MockHttpError, type MockRoutes } from '../router';
import {
  cohortHasPhysicalSession,
  countSessionsForCohort,
  seedSessionsForCohort,
} from './meetings';
import { body, paged } from './util';

/**
 * Stored shapes are deliberately thin — every derived field (`session_count`,
 * `registrant_count`, `register_url`, a programme's `cohort_count` /
 * `open_cohort_count` / `default_cohort`) is computed at read time by
 * `toCohortResponse` / `toProgrammeResponse` below, mirroring the real BE
 * (`abode-be-v2/src/modules/academy/academy.serializers.ts`) exactly so this
 * mock and the live API return the same shape.
 */
type Cohort = {
  id: string;
  programme_id: string;
  name: string;
  slug: string;
  label: string;
  registration_goal: number;
  is_default: boolean;
  registration_open: boolean;
  registration_opens: string | null;
  registration_closes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** No `is_active` on Cohort — that kill switch lives only on Programme. */
type Programme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  cohorts: Cohort[];
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `CohortScheduleDto` on the real BE exactly. */
type ScheduleInput = {
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

const now = () => new Date().toISOString();

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'item'}-${Math.random().toString(36).slice(2, 8)}`;
}

const seedCohortId = 'cohort_sep_2026';
const seedProgrammeId = 'prog_rcp';

const seedCohort: Cohort = {
  id: seedCohortId,
  programme_id: seedProgrammeId,
  name: 'September 2026',
  slug: 'rcp-september-2026',
  label: 'Realtor Certification Program — September 2026',
  registration_goal: 5000,
  is_default: true,
  registration_open: true,
  registration_opens: null,
  registration_closes: '2026-09-24T23:59:00.000Z',
  createdAt: now(),
  updatedAt: now(),
};

let programmes: Programme[] = [
  {
    id: seedProgrammeId,
    name: 'Realtor Certification Program',
    slug: 'realtor-certification-program',
    description: 'Certification for practicing realtors',
    is_active: true,
    cohorts: [seedCohort],
    createdAt: now(),
    updatedAt: now(),
  },
];

/** Mirrors `RegistrationDocument` / `RegistrantResponse` on the real BE. No `is_abode_associate` — that field doesn't exist there. */
type Registrant = {
  id: string;
  cohort_id: string;
  user_id: string;
  was_existing: boolean;
  tier_at_registration: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string | null;
  age_bracket: string | null;
  status: string | null;
  employment_status: string | null;
  organisation: string | null;
  region: string | null;
  previous_attendee: string | null;
  referral_source: string | null;
  referred_by_username: string | null;
  source_meeting_id: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  deleted_at: string | null;
  deletion_reason: string | null;
  createdAt: string;
};

const registrants: Registrant[] = [
  {
    id: 'reg_1',
    cohort_id: seedCohortId,
    user_id: 'user_ada',
    was_existing: false,
    tier_at_registration: null,
    first_name: 'Ada',
    last_name: 'Okafor',
    email: 'ada@example.com',
    phone: '+2348011111111',
    gender: 'female',
    age_bracket: '25-34',
    status: 'realtor',
    employment_status: 'self-employed',
    organisation: null,
    region: 'Ikeja, Lagos State',
    previous_attendee: 'no',
    referral_source: 'associate',
    referred_by_username: 'tunde',
    source_meeting_id: null,
    checked_in: false,
    checked_in_at: null,
    deleted_at: null,
    deletion_reason: null,
    createdAt: now(),
  },
  {
    id: 'reg_2',
    cohort_id: seedCohortId,
    user_id: 'user_chidi',
    was_existing: true,
    tier_at_registration: 'associate',
    first_name: 'Chidi',
    last_name: 'Eze',
    email: 'chidi@example.com',
    phone: '+2348022222222',
    gender: 'male',
    age_bracket: '35-44',
    status: 'broker',
    employment_status: 'employed',
    organisation: 'Eze Realty',
    region: 'Abuja',
    previous_attendee: 'yes',
    referral_source: 'social',
    referred_by_username: null,
    source_meeting_id: null,
    checked_in: true,
    checked_in_at: now(),
    deleted_at: null,
    deletion_reason: null,
    createdAt: now(),
  },
  {
    id: 'reg_3',
    cohort_id: seedCohortId,
    user_id: 'user_bola',
    was_existing: false,
    tier_at_registration: null,
    first_name: 'Bola',
    last_name: 'Adeyemi',
    email: 'bola@example.com',
    phone: '+2348033333333',
    gender: 'female',
    age_bracket: '25-34',
    status: 'realtor',
    employment_status: 'self-employed',
    organisation: null,
    region: 'Ikeja, Lagos State',
    previous_attendee: 'no',
    referral_source: 'associate',
    referred_by_username: 'tunde',
    source_meeting_id: null,
    checked_in: false,
    checked_in_at: null,
    deleted_at: null,
    deletion_reason: null,
    createdAt: now(),
  },
];

type MockTestQuestion = {
  id: string;
  type: 'multiple_choice' | 'true_false';
  prompt: string;
  options: { key: string; label: string }[];
  correct_answer: string;
  position: number;
};

type MockTest = {
  id: string;
  cohort_id: string;
  slug: string;
  title: string;
  description: string | null;
  eligibility_type: 'session' | 'series_n_of_m';
  eligibility_meeting_id: string | null;
  eligibility_series_id: string | null;
  eligibility_required_count: number | null;
  opens_at: string;
  closes_at: string | null;
  duration_minutes: number | null;
  pass_mark: number;
  is_active: boolean;
  questions: MockTestQuestion[];
  createdAt: string;
  updatedAt: string;
};

type MockAttempt = {
  id: string;
  test_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  score: number;
  passed: boolean;
  correct_count: number;
  total_count: number;
  submitted_at: string;
};

const tests: MockTest[] = [
  {
    id: 'test_rcp_sep_final',
    cohort_id: seedCohortId,
    slug: 'rcp-sep-2026-final',
    title: 'RCP September Final Assessment',
    description: 'Complete after attending at least 2 of 4 series sessions.',
    eligibility_type: 'series_n_of_m',
    eligibility_meeting_id: null,
    eligibility_series_id: 'series_rcp_sep_2026',
    eligibility_required_count: 2,
    opens_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    closes_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 30,
    pass_mark: 70,
    is_active: true,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        prompt: 'What does RCP stand for?',
        options: [
          { key: 'a', label: 'Realtor Certification Program' },
          { key: 'b', label: 'Real Commission Plan' },
          { key: 'c', label: 'Regional Client Portal' },
        ],
        correct_answer: 'a',
        position: 1,
      },
      {
        id: 'q2',
        type: 'true_false',
        prompt: 'Associates can earn commission on referrals.',
        options: [
          { key: 'true', label: 'True' },
          { key: 'false', label: 'False' },
        ],
        correct_answer: 'true',
        position: 2,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

const attempts: MockAttempt[] = [
  {
    id: 'att_1',
    test_id: 'test_rcp_sep_final',
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Okafor',
    score: 100,
    passed: true,
    correct_count: 2,
    total_count: 2,
    submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

function eligibilityLabel(test: MockTest): string {
  if (test.eligibility_type === 'session') {
    return test.eligibility_meeting_id
      ? `Must attend session ${test.eligibility_meeting_id}`
      : 'Must attend a specific session';
  }
  const n = test.eligibility_required_count ?? 1;
  return `Must attend ${n} of series sessions`;
}

function publicTest(test: MockTest) {
  return {
    ...test,
    eligibility_label: eligibilityLabel(test),
    question_count: test.questions.length,
    attempt_count: attempts.filter((a) => a.test_id === test.id).length,
    public_url: `https://abodewebinar.abodeflex.ng/test/${test.slug}`,
  };
}

const ATTEMPTS_CSV_HEADER =
  'id,email,first_name,last_name,score,passed,correct_count,total_count,submitted_at';

function toAttemptCsvRow(a: MockAttempt): string {
  return [
    a.id,
    a.email,
    a.first_name ?? '',
    a.last_name ?? '',
    a.score ?? '',
    a.passed ?? '',
    a.correct_count ?? '',
    a.total_count ?? '',
    a.submitted_at ?? '',
  ]
    .map((v) => csvEscape(String(v)))
    .join(',');
}

function findProgramme(id: string) {
  return programmes.find((p) => p.id === id);
}

function findCohort(id: string): { programme: Programme; cohort: Cohort } | null {
  for (const programme of programmes) {
    const cohort = programme.cohorts.find((c) => c.id === id);
    if (cohort) return { programme, cohort };
  }
  return null;
}

function activeRegistrants(cohortId: string): Registrant[] {
  return registrants.filter((r) => r.cohort_id === cohortId && !r.deleted_at);
}

function registrantCountFor(cohortId: string): number {
  return activeRegistrants(cohortId).length;
}

/** Mirrors `academy.serializers.ts::toCohortResponse` on the real BE. */
function toCohortResponse(cohort: Cohort) {
  return {
    ...cohort,
    registrant_count: registrantCountFor(cohort.id),
    session_count: countSessionsForCohort(cohort.id),
    register_url: `https://abodewebinar.abodeflex.ng/register?cohort=${cohort.slug}`,
  };
}

/** Mirrors `academy.serializers.ts::toProgrammeResponse` on the real BE. */
function toProgrammeResponse(programme: Programme, includeCohorts: boolean) {
  const defaultCohort = programme.cohorts.find((c) => c.is_default) ?? null;
  return {
    ...programme,
    cohort_count: programme.cohorts.length,
    open_cohort_count: programme.cohorts.filter((c) => c.registration_open).length,
    default_cohort: defaultCohort ? toCohortResponse(defaultCohort) : null,
    ...(includeCohorts ? { cohorts: programme.cohorts.map(toCohortResponse) } : {}),
    register_url: `https://abodewebinar.abodeflex.ng/academy/register/${programme.slug}`,
  };
}

function toRegistrantResponse(r: Registrant) {
  const { deleted_at: _deletedAt, deletion_reason: _deletionReason, ...rest } = r;
  void _deletedAt;
  void _deletionReason;
  return rest;
}

function tally(rows: string[]): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row, (counts.get(row) ?? 0) + 1);
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

/**
 * Mirrors `AcademyDashboardService.getDashboard` — verified against
 * `abode-be-v2/src/modules/academy/academy-dashboard.service.ts` 2026-09-10.
 * `cohort` on this payload is minimal (id/label/registration_goal only);
 * `checked_in` stays `null` until the cohort has a physical session.
 */
function buildDashboard(cohort: Cohort, from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.max(
    1,
    Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const daily: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + i);
    daily.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const cohortRegs = activeRegistrants(cohort.id);
  if (cohortRegs.length && daily.length) {
    daily[daily.length - 1].count = cohortRegs.length;
  }
  const regions = new Set(cohortRegs.map((r) => r.region).filter((v): v is string => Boolean(v)));
  const newRegs = cohortRegs.filter((r) => !r.was_existing);
  const returningRegs = cohortRegs.filter((r) => r.was_existing);

  const checkedInCount = cohortRegs.filter((r) => r.checked_in).length;

  return {
    cohort: { id: cohort.id, label: cohort.label, registration_goal: cohort.registration_goal },
    totalAll: cohortRegs.length,
    statesCoveredAll: regions.size,
    current: {
      count: cohortRegs.length,
      new_count: newRegs.length,
      returning_count: returningRegs.length,
      returning_by_tier: tally(
        returningRegs.map((r) => r.tier_at_registration ?? 'unknown'),
      ),
      dailyRegistrations: daily,
      avgPerDay: Math.round(cohortRegs.length / days),
      statesCovered: regions.size,
      referralBreakdown: tally(cohortRegs.map((r) => r.referral_source ?? 'unknown')),
      genderBreakdown: tally(cohortRegs.map((r) => r.gender ?? 'unknown')),
      ageBreakdown: tally(cohortRegs.map((r) => r.age_bracket ?? 'unknown')),
      statusBreakdown: tally(cohortRegs.map((r) => r.status ?? 'unknown')),
      regionBreakdown: tally(cohortRegs.map((r) => r.region ?? 'unknown')),
      attendedPreviousBreakdown: tally(cohortRegs.map((r) => r.previous_attendee ?? 'unknown')),
    },
    previous: { count: 0, dailyRegistrations: daily.map((d) => ({ ...d, count: 0 })) },
    rangeDays: days,
    comparison: { delta: cohortRegs.length, pctChange: cohortRegs.length > 0 ? 100 : 0 },
    checked_in: cohortHasPhysicalSession(cohort.id)
      ? {
          count: checkedInCount,
          rate: cohortRegs.length > 0 ? Math.round((checkedInCount / cohortRegs.length) * 1000) / 10 : 0,
        }
      : null,
    recent_registrants: cohortRegs.slice(0, 8).map(toRegistrantResponse),
    outcomes: outcomesForCohort(cohort),
  };
}

/**
 * Mirrors `AcademyDashboardService.computeOutcomes` — `acquired` groups
 * `was_existing: false` registrants by CURRENT tier; `influenced` counts
 * already-here (`was_existing: true`) registrants who went pro after. Never
 * summed. The mock derives illustrative ratios since it has no
 * ReferralUpgrade history to read.
 */
function outcomesForCohort(cohort: Cohort) {
  const cohortRegs = activeRegistrants(cohort.id);
  const acquired = cohortRegs.filter((r) => !r.was_existing);
  const influenced = cohortRegs.filter((r) => r.was_existing);

  const acquiredTotal = acquired.length;
  const associatePro = Math.round(acquiredTotal * 0.055);
  const associate = Math.round(acquiredTotal * 0.45);
  const user = Math.round(acquiredTotal * 0.15);
  const stillGuest = Math.max(0, acquiredTotal - associatePro - associate - user);
  const becamePro = Math.min(influenced.length, Math.round(associatePro * 0.25));

  return {
    as_of: now(),
    acquired: { total: acquiredTotal, still_guest: stillGuest, user, associate, associate_pro: associatePro },
    influenced: { total: influenced.length, became_pro_after: becamePro },
    median_days_to_pro: associatePro > 0 ? 68 : null,
  };
}

function buildScheduleForCohort(
  cohortId: string,
  cohortLabel: string,
  schedule: ScheduleInput | undefined,
) {
  if (!schedule) return;
  seedSessionsForCohort({ cohortId, cohortLabel, schedule });
}

/** Insert non-default, then swap if requested — never two defaults at once. */
function setDefaultCohort(programme: Programme, cohortId: string) {
  programme.cohorts.forEach((c) => {
    c.is_default = c.id === cohortId;
  });
}

// ─────────────────────────── registrants ───────────────────────────

type RegistrantFilterQuery = {
  search?: unknown;
  region?: unknown;
  was_existing?: unknown;
  checked_in?: unknown;
};

function filterRegistrants(cohortId: string, query: RegistrantFilterQuery): Registrant[] {
  let rows = activeRegistrants(cohortId);
  const search = String(query.search ?? '').trim().toLowerCase();
  if (search) {
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(search) ||
        r.first_name.toLowerCase().includes(search) ||
        r.last_name.toLowerCase().includes(search) ||
        r.phone.includes(search),
    );
  }
  const region = String(query.region ?? '').trim().toLowerCase();
  if (region) {
    rows = rows.filter((r) => (r.region ?? '').toLowerCase().includes(region));
  }
  if (query.was_existing !== undefined) {
    const wantExisting = String(query.was_existing) === 'true';
    rows = rows.filter((r) => r.was_existing === wantExisting);
  }
  if (query.checked_in !== undefined) {
    const wantCheckedIn = String(query.checked_in) === 'true';
    rows = rows.filter((r) => r.checked_in === wantCheckedIn);
  }
  return rows;
}

const CSV_HEADER =
  'first_name,last_name,email,phone,region,status,was_existing,referred_by_username,checked_in,created_at';

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsvRow(r: Registrant): string {
  return [
    r.first_name,
    r.last_name,
    r.email,
    r.phone,
    r.region ?? '',
    r.status ?? '',
    String(r.was_existing),
    r.referred_by_username ?? '',
    String(r.checked_in),
    r.createdAt,
  ]
    .map((v) => csvEscape(String(v)))
    .join(',');
}

// ─────────────────────────── referrals ───────────────────────────

type ReferralRow = {
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  total_referred: number;
  new_count: number;
  returning_count: number;
  attendance_count: number;
  session_total: number;
  checked_in_count: number;
};

/** Ranked by new people brought in; ties → total referred, then username — mirrors the real `$sort` pipeline. */
function referralLeaderboard(cohortId: string): ReferralRow[] {
  const cohortRegs = activeRegistrants(cohortId).filter((r) => r.referred_by_username);
  const byUsername = new Map<string, Registrant[]>();
  for (const r of cohortRegs) {
    const key = (r.referred_by_username as string).toLowerCase();
    byUsername.set(key, [...(byUsername.get(key) ?? []), r]);
  }
  const rows: ReferralRow[] = [...byUsername.entries()].map(([username, refs]) => ({
    username,
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    total_referred: refs.length,
    new_count: refs.filter((r) => !r.was_existing).length,
    returning_count: refs.filter((r) => r.was_existing).length,
    attendance_count: 0,
    session_total: 0,
    checked_in_count: refs.filter((r) => r.checked_in).length,
  }));
  rows.sort((a, b) => b.new_count - a.new_count || b.total_referred - a.total_referred || a.username.localeCompare(b.username));
  return rows;
}

const REFERRAL_CSV_HEADER = 'username,total_referred,new_count,returning_count,checked_in_count';

function toReferralCsvRow(r: ReferralRow): string {
  return [r.username, r.total_referred, r.new_count, r.returning_count, r.checked_in_count]
    .map((v) => csvEscape(String(v)))
    .join(',');
}

export const academyRoutes: MockRoutes = {
  'GET /admin/academy/programmes': ({ query }) => {
    let rows = [...programmes];
    const q = String(query.q ?? '').trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }
    if (query.is_active !== undefined) {
      const active = String(query.is_active) === 'true';
      rows = rows.filter((p) => p.is_active === active);
    }
    return paged(
      rows.map((p) => toProgrammeResponse(p, false)),
      query,
    );
  },

  'POST /admin/academy/programmes': ({ body: raw }) => {
    const b = body<{
      name: string;
      description?: string;
      cohort: {
        name: string;
        label?: string;
        registration_goal?: number;
        registration_opens?: string;
        registration_closes?: string;
        set_as_default?: boolean;
        schedule?: ScheduleInput;
      };
    }>(raw);

    if (!b.name?.trim() || !b.cohort?.name?.trim()) {
      throw new MockHttpError(400, 'name and cohort.name are required');
    }
    if (programmes.some((p) => p.name.toLowerCase() === b.name.trim().toLowerCase())) {
      throw new MockHttpError(409, 'A programme with this name already exists', 'PROGRAMME_NAME_TAKEN');
    }

    const programmeId = `prog_${Math.random().toString(36).slice(2, 10)}`;
    const cohortId = `cohort_${Math.random().toString(36).slice(2, 10)}`;
    const cohortSlug = slugify(b.cohort.name);
    const ts = now();
    const label = b.cohort.label?.trim() || b.cohort.name.trim();
    // Programme + first cohort, atomic (§3) — the mock has nothing async to
    // fail between these two writes, which is the closest an in-memory store
    // gets to the real BE's transaction.
    const cohort: Cohort = {
      id: cohortId,
      programme_id: programmeId,
      name: b.cohort.name.trim(),
      slug: cohortSlug,
      label,
      registration_goal: b.cohort.registration_goal ?? 0,
      is_default: b.cohort.set_as_default ?? true,
      // A cohort always starts closed — there is no `registration_open` on
      // CreateCohortInput. Open it via toggle-registration afterward.
      registration_open: false,
      registration_opens: b.cohort.registration_opens ?? null,
      registration_closes: b.cohort.registration_closes ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    buildScheduleForCohort(cohortId, label, b.cohort.schedule);
    const programme: Programme = {
      id: programmeId,
      name: b.name.trim(),
      slug: slugify(b.name),
      description: b.description ?? null,
      is_active: true,
      cohorts: [cohort],
      createdAt: ts,
      updatedAt: ts,
    };
    programmes = [programme, ...programmes];
    return toProgrammeResponse(programme, true);
  },

  'GET /admin/academy/programmes/:id': ({ params }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found', 'PROGRAMME_NOT_FOUND');
    return toProgrammeResponse(programme, true);
  },

  'PATCH /admin/academy/programmes/:id': ({ params, body: raw }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found', 'PROGRAMME_NOT_FOUND');
    const b = body<{ name?: string; description?: string }>(raw);
    if (b.name !== undefined) {
      if (
        b.name.trim() &&
        programmes.some(
          (p) => p.id !== programme.id && p.name.toLowerCase() === b.name!.trim().toLowerCase(),
        )
      ) {
        throw new MockHttpError(409, 'A programme with this name already exists', 'PROGRAMME_NAME_TAKEN');
      }
      programme.name = b.name.trim();
    }
    if (b.description !== undefined) programme.description = b.description;
    programme.updatedAt = now();
    return toProgrammeResponse(programme, true);
  },

  'POST /admin/academy/programmes/:id/toggle-active': ({ params, body: raw }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found', 'PROGRAMME_NOT_FOUND');
    const { is_active } = body<{ is_active: boolean }>(raw);
    programme.is_active = Boolean(is_active);
    programme.updatedAt = now();
    return toProgrammeResponse(programme, true);
  },

  'POST /admin/academy/programmes/:id/cohorts': ({ params, body: raw }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found', 'PROGRAMME_NOT_FOUND');
    const b = body<{
      name: string;
      label?: string;
      registration_goal?: number;
      registration_opens?: string;
      registration_closes?: string;
      set_as_default?: boolean;
      schedule?: ScheduleInput;
    }>(raw);
    if (!b.name?.trim()) throw new MockHttpError(400, 'name is required');

    const ts = now();
    const cohortSlug = slugify(b.name);
    const label = b.label?.trim() || b.name.trim();
    const cohortId = `cohort_${Math.random().toString(36).slice(2, 10)}`;
    // Insert non-default, then swap if requested — keeps "at most one default"
    // true at every instant, matching the real BE's partial-unique index.
    const cohort: Cohort = {
      id: cohortId,
      programme_id: programme.id,
      name: b.name.trim(),
      slug: cohortSlug,
      label,
      registration_goal: b.registration_goal ?? 0,
      is_default: false,
      registration_open: false,
      registration_opens: b.registration_opens ?? null,
      registration_closes: b.registration_closes ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    buildScheduleForCohort(cohortId, label, b.schedule);
    programme.cohorts = [cohort, ...programme.cohorts];
    programme.updatedAt = ts;
    if (b.set_as_default ?? true) {
      setDefaultCohort(programme, cohortId);
    }
    return toCohortResponse(cohort);
  },

  'GET /admin/academy/cohorts/:id': ({ params }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    return toCohortResponse(found.cohort);
  },

  /** Core cohort facts only — `registration_open` and `is_default` are separate endpoints below. */
  'PATCH /admin/academy/cohorts/:id': ({ params, body: raw }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const b = body<{
      name?: string;
      label?: string;
      registration_goal?: number;
      registration_opens?: string | null;
      registration_closes?: string | null;
    }>(raw);
    if (b.name !== undefined) found.cohort.name = b.name;
    if (b.label !== undefined) found.cohort.label = b.label;
    if (b.registration_goal !== undefined) found.cohort.registration_goal = b.registration_goal;
    if (b.registration_opens !== undefined) found.cohort.registration_opens = b.registration_opens;
    if (b.registration_closes !== undefined) found.cohort.registration_closes = b.registration_closes;
    found.cohort.updatedAt = now();
    return toCohortResponse(found.cohort);
  },

  'POST /admin/academy/cohorts/:id/toggle-registration': ({ params, body: raw }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const { registration_open } = body<{ registration_open: boolean }>(raw);
    found.cohort.registration_open = Boolean(registration_open);
    found.cohort.updatedAt = now();
    return toCohortResponse(found.cohort);
  },

  'POST /admin/academy/cohorts/:id/set-default': ({ params }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    setDefaultCohort(found.programme, found.cohort.id);
    found.cohort.updatedAt = now();
    found.programme.updatedAt = now();
    return toCohortResponse(found.cohort);
  },

  'GET /admin/academy/cohorts/:id/dashboard': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const from = String(query.from ?? new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
    const to = String(query.to ?? new Date().toISOString().slice(0, 10));
    return buildDashboard(found.cohort, from, to);
  },

  'GET /admin/academy/cohorts/:id/registrants': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const rows = filterRegistrants(params.id, query).map(toRegistrantResponse);
    return paged(rows, query);
  },

  'GET /admin/academy/cohorts/:id/registrants/export': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const rows = filterRegistrants(params.id, query);
    return [CSV_HEADER, ...rows.map(toCsvRow)].join('\n');
  },

  /** Allowlisted profile fields + checked_in — never email/identity. Mirrors `UpdateRegistrantDto`. */
  'PATCH /admin/academy/cohorts/:id/registrants/:registrantId': ({ params, body: raw }) => {
    const registrant = registrants.find(
      (r) => r.id === params.registrantId && r.cohort_id === params.id && !r.deleted_at,
    );
    if (!registrant) throw new MockHttpError(404, 'Registrant not found', 'REGISTRANT_NOT_FOUND');
    const b = body<{
      first_name?: string;
      last_name?: string;
      phone?: string;
      gender?: string;
      age_bracket?: string;
      status?: string;
      employment_status?: string;
      organisation?: string;
      region?: string;
      previous_attendee?: string;
      referral_source?: string;
      referred_by_username?: string;
      checked_in?: boolean;
    }>(raw);

    if (b.first_name !== undefined) registrant.first_name = b.first_name;
    if (b.last_name !== undefined) registrant.last_name = b.last_name;
    if (b.phone !== undefined) registrant.phone = b.phone;
    if (b.gender !== undefined) registrant.gender = b.gender;
    if (b.age_bracket !== undefined) registrant.age_bracket = b.age_bracket;
    if (b.status !== undefined) registrant.status = b.status;
    if (b.employment_status !== undefined) registrant.employment_status = b.employment_status;
    if (b.organisation !== undefined) registrant.organisation = b.organisation;
    if (b.region !== undefined) registrant.region = b.region;
    if (b.previous_attendee !== undefined) registrant.previous_attendee = b.previous_attendee;
    if (b.referral_source !== undefined) registrant.referral_source = b.referral_source;
    if (b.referred_by_username !== undefined) registrant.referred_by_username = b.referred_by_username;
    // Toggling check-in keeps checked_in_at consistent — stamped on, cleared off (mirrors the real service).
    if (b.checked_in !== undefined) {
      registrant.checked_in = b.checked_in;
      registrant.checked_in_at = b.checked_in ? (registrant.checked_in_at ?? now()) : null;
    }
    return toRegistrantResponse(registrant);
  },

  'DELETE /admin/academy/cohorts/:id/registrants/:registrantId': ({ params, body: raw }) => {
    const registrant = registrants.find(
      (r) => r.id === params.registrantId && r.cohort_id === params.id && !r.deleted_at,
    );
    if (!registrant) throw new MockHttpError(404, 'Registrant not found', 'REGISTRANT_NOT_FOUND');
    const { reason } = body<{ reason?: string }>(raw);
    if (!reason?.trim()) throw new MockHttpError(400, 'reason is required', 'VALIDATION_ERROR');
    registrant.deleted_at = now();
    registrant.deletion_reason = reason.trim();
    return toRegistrantResponse(registrant);
  },

  'GET /admin/academy/cohorts/:id/referrals': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    return paged(referralLeaderboard(params.id), query);
  },

  'GET /admin/academy/cohorts/:id/referrals/export': ({ params }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const rows = referralLeaderboard(params.id);
    return [REFERRAL_CSV_HEADER, ...rows.map(toReferralCsvRow)].join('\n');
  },

  'GET /admin/academy/cohorts/:id/tests': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const rows = tests
      .filter((t) => t.cohort_id === params.id)
      .map(publicTest);
    return paged(rows, query);
  },

  'POST /admin/academy/cohorts/:id/tests': ({ params, body: raw }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found', 'COHORT_NOT_FOUND');
    const b = body<{
      title?: string;
      description?: string;
      eligibility_type?: MockTest['eligibility_type'];
      eligibility_meeting_id?: string | null;
      eligibility_series_id?: string | null;
      eligibility_required_count?: number | null;
      opens_at?: string;
      closes_at?: string | null;
      duration_minutes?: number | null;
      pass_mark?: number;
      questions?: Array<{
        type: 'multiple_choice' | 'true_false';
        prompt: string;
        options?: { key: string; label: string }[];
        correct_answer: string;
      }>;
    }>(raw);

    if (!b.title?.trim()) throw new MockHttpError(400, 'title is required');
    if (!b.opens_at) throw new MockHttpError(400, 'opens_at is required');
    if (!b.eligibility_type) throw new MockHttpError(400, 'eligibility_type is required');
    const questions = (b.questions ?? []).map((q, i) => ({
      id: `q_${Math.random().toString(36).slice(2, 8)}`,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? [],
      correct_answer: q.correct_answer,
      position: i + 1,
    }));
    if (questions.length === 0) throw new MockHttpError(400, 'At least one question is required');

    const ts = now();
    const slug = slugify(b.title);
    const created: MockTest = {
      id: `test_${Math.random().toString(36).slice(2, 10)}`,
      cohort_id: params.id,
      slug,
      title: b.title.trim(),
      description: b.description?.trim() || null,
      eligibility_type: b.eligibility_type,
      eligibility_meeting_id: b.eligibility_meeting_id ?? null,
      eligibility_series_id: b.eligibility_series_id ?? null,
      eligibility_required_count: b.eligibility_required_count ?? null,
      opens_at: new Date(b.opens_at).toISOString(),
      closes_at: b.closes_at ? new Date(b.closes_at).toISOString() : null,
      duration_minutes: b.duration_minutes ?? 30,
      pass_mark: b.pass_mark ?? 70,
      is_active: true,
      questions,
      createdAt: ts,
      updatedAt: ts,
    };
    tests.unshift(created);
    return publicTest(created);
  },

  'GET /admin/academy/tests/:id': ({ params }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    return publicTest(test);
  },

  'POST /admin/academy/tests/:id/toggle-active': ({ params, body: raw }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const { is_active } = body<{ is_active: boolean }>(raw);
    test.is_active = Boolean(is_active);
    test.updatedAt = now();
    return publicTest(test);
  },

  'PATCH /admin/academy/tests/:id': ({ params, body: raw }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const b = body<{
      title?: string;
      description?: string | null;
      opens_at?: string;
      closes_at?: string | null;
      duration_minutes?: number;
      pass_mark?: number;
    }>(raw);
    if (b.title !== undefined) test.title = b.title.trim();
    if (b.description !== undefined) test.description = b.description?.trim() || null;
    if (b.opens_at !== undefined) test.opens_at = new Date(b.opens_at).toISOString();
    if (b.closes_at !== undefined) {
      test.closes_at = b.closes_at ? new Date(b.closes_at).toISOString() : null;
    }
    if (b.duration_minutes !== undefined) test.duration_minutes = b.duration_minutes;
    if (b.pass_mark !== undefined) test.pass_mark = b.pass_mark;
    test.updatedAt = now();
    return publicTest(test);
  },

  'PUT /admin/academy/tests/:id/questions': ({ params, body: raw }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const b = body<{
      questions?: Array<{
        type: 'multiple_choice' | 'true_false';
        prompt: string;
        options?: { key: string; label: string }[];
        correct_answer: string;
      }>;
    }>(raw);
    if (!b.questions?.length) throw new MockHttpError(400, 'At least one question is required');
    test.questions = b.questions.map((q, i) => ({
      id: `q_${Math.random().toString(36).slice(2, 8)}`,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? [],
      correct_answer: q.correct_answer,
      position: i + 1,
    }));
    test.updatedAt = now();
    return publicTest(test);
  },

  'GET /admin/academy/tests/:id/attempts': ({ params, query }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const rows = attempts.filter((a) => a.test_id === params.id);
    return paged(rows, query);
  },

  'GET /admin/academy/tests/:id/attempts/export': ({ params }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const rows = attempts.filter((a) => a.test_id === params.id);
    return [ATTEMPTS_CSV_HEADER, ...rows.map(toAttemptCsvRow)].join('\n');
  },
};
