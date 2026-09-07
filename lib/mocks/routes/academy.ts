import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

type Cohort = {
  id: string;
  programme_id: string;
  name: string;
  slug: string;
  label: string;
  registration_goal: number;
  is_active: boolean;
  is_default: boolean;
  registration_open: boolean;
  event_date: string | null;
  event_venue: string | null;
  event_city: string | null;
  date_confirmed: boolean;
  registrant_count: number;
  register_url: string;
  createdAt: string;
  updatedAt: string;
};

type Programme = {
  id: string;
  name: string;
  slug: string;
  type: 'rcp' | 'academy' | 'masterclass' | 'webinar' | 'custom';
  description: string | null;
  is_active: boolean;
  cohort_count: number;
  latest_cohort: Cohort | null;
  cohorts: Cohort[];
  createdAt: string;
  updatedAt: string;
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
  is_active: true,
  is_default: true,
  registration_open: true,
  event_date: '2026-09-25T09:00:00.000Z',
  event_venue: 'TBA',
  event_city: 'Lagos',
  date_confirmed: false,
  registrant_count: 2,
  register_url: 'https://abodewebinar.abodeflex.ng/register?cohort=rcp-september-2026',
  createdAt: now(),
  updatedAt: now(),
};

let programmes: Programme[] = [
  {
    id: seedProgrammeId,
    name: 'Realtor Certification Program',
    slug: 'realtor-certification-program',
    type: 'rcp',
    description: 'Certification for practicing realtors',
    is_active: true,
    cohort_count: 1,
    latest_cohort: seedCohort,
    cohorts: [seedCohort],
    createdAt: now(),
    updatedAt: now(),
  },
];

type Registrant = {
  id: string;
  cohort_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  age_bracket: string;
  status: string;
  region: string;
  is_abode_associate: string;
  previous_attendee: string;
  referral_source: string;
  referred_by_username: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  createdAt: string;
};

const registrants: Registrant[] = [
  {
    id: 'reg_1',
    cohort_id: seedCohortId,
    first_name: 'Ada',
    last_name: 'Okafor',
    email: 'ada@example.com',
    phone: '+2348011111111',
    gender: 'female',
    age_bracket: '25-34',
    status: 'realtor',
    region: 'Ikeja, Lagos State',
    is_abode_associate: 'no',
    previous_attendee: 'no',
    referral_source: 'associate',
    referred_by_username: 'tunde',
    checked_in: false,
    checked_in_at: null,
    createdAt: now(),
  },
  {
    id: 'reg_2',
    cohort_id: seedCohortId,
    first_name: 'Chidi',
    last_name: 'Eze',
    email: 'chidi@example.com',
    phone: '+2348022222222',
    gender: 'male',
    age_bracket: '35-44',
    status: 'broker',
    region: 'Abuja',
    is_abode_associate: 'yes',
    previous_attendee: 'yes',
    referral_source: 'social',
    referred_by_username: null,
    checked_in: true,
    checked_in_at: now(),
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
  eligibility_type: 'session' | 'series_n_of_m' | 'none';
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
  if (test.eligibility_type === 'none') return 'No attendance gate';
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

function emptyDashboard(cohort: Cohort, from: string, to: string) {
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
  const cohortRegs = registrants.filter((r) => r.cohort_id === cohort.id);
  if (cohortRegs.length && daily.length) {
    daily[daily.length - 1].count = cohortRegs.length;
  }
  const regions = new Set(cohortRegs.map((r) => r.region).filter(Boolean));
  return {
    cohort,
    totalAll: cohortRegs.length,
    statesCoveredAll: regions.size,
    current: {
      count: cohortRegs.length,
      dailyRegistrations: daily,
      avgPerDay: Math.round(cohortRegs.length / days),
      statesCovered: regions.size,
      referralBreakdown: [{ name: 'associate', value: 1 }, { name: 'social', value: 1 }],
      genderBreakdown: [{ name: 'female', value: 1 }, { name: 'male', value: 1 }],
      ageBreakdown: [{ name: '25-34', value: 1 }, { name: '35-44', value: 1 }],
      statusBreakdown: [{ name: 'realtor', value: 1 }, { name: 'broker', value: 1 }],
      regionBreakdown: [{ name: 'Ikeja, Lagos State', value: 1 }, { name: 'Abuja', value: 1 }],
      attendedPreviousBreakdown: [{ name: 'no', value: 1 }, { name: 'yes', value: 1 }],
      associateProBreakdown: [{ name: 'no', value: 1 }, { name: 'yes', value: 1 }],
    },
    previous: { count: 0, dailyRegistrations: daily.map((d) => ({ ...d, count: 0 })) },
    rangeDays: days,
    comparison: { delta: cohortRegs.length, pctChange: cohortRegs.length > 0 ? 100 : 0 },
    recent_registrants: cohortRegs.slice(0, 8),
  };
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
    if (query.type) rows = rows.filter((p) => p.type === query.type);
    if (query.is_active !== undefined) {
      const active = String(query.is_active) === 'true';
      rows = rows.filter((p) => p.is_active === active);
    }
    return paged(rows, query);
  },

  'POST /admin/academy/programmes': ({ body: raw }) => {
    const b = body<{
      name: string;
      type: Programme['type'];
      description?: string;
      cohort: {
        name: string;
        registration_goal?: number;
        event_date?: string;
        event_venue?: string;
        event_city?: string;
        date_confirmed?: boolean;
        set_as_default?: boolean;
      };
    }>(raw);

    if (!b.name?.trim() || !b.cohort?.name?.trim()) {
      throw new MockHttpError(400, 'name and cohort.name are required');
    }

    const programmeId = `prog_${Math.random().toString(36).slice(2, 10)}`;
    const cohortId = `cohort_${Math.random().toString(36).slice(2, 10)}`;
    const cohortSlug = slugify(b.cohort.name);
    const ts = now();
    const cohort: Cohort = {
      id: cohortId,
      programme_id: programmeId,
      name: b.cohort.name.trim(),
      slug: cohortSlug,
      label: `${b.name.trim()} — ${b.cohort.name.trim()}`,
      registration_goal: b.cohort.registration_goal ?? 5000,
      is_active: true,
      is_default: b.cohort.set_as_default !== false,
      registration_open: true,
      event_date: b.cohort.event_date ?? null,
      event_venue: b.cohort.event_venue ?? null,
      event_city: b.cohort.event_city ?? null,
      date_confirmed: b.cohort.date_confirmed ?? false,
      registrant_count: 0,
      register_url: `https://abodewebinar.abodeflex.ng/register?cohort=${cohortSlug}`,
      createdAt: ts,
      updatedAt: ts,
    };
    const programme: Programme = {
      id: programmeId,
      name: b.name.trim(),
      slug: slugify(b.name),
      type: b.type ?? 'custom',
      description: b.description ?? null,
      is_active: true,
      cohort_count: 1,
      latest_cohort: cohort,
      cohorts: [cohort],
      createdAt: ts,
      updatedAt: ts,
    };
    programmes = [programme, ...programmes];
    return programme;
  },

  'GET /admin/academy/programmes/:id': ({ params }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found');
    return programme;
  },

  'POST /admin/academy/programmes/:id/toggle-active': ({ params, body: raw }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found');
    const { is_active } = body<{ is_active: boolean }>(raw);
    programme.is_active = Boolean(is_active);
    programme.updatedAt = now();
    return programme;
  },

  'POST /admin/academy/programmes/:id/cohorts': ({ params, body: raw }) => {
    const programme = findProgramme(params.id);
    if (!programme) throw new MockHttpError(404, 'Programme not found');
    const b = body<{
      name: string;
      registration_goal?: number;
      event_date?: string;
      event_venue?: string;
      event_city?: string;
      date_confirmed?: boolean;
      set_as_default?: boolean;
      registration_open?: boolean;
    }>(raw);
    if (!b.name?.trim()) throw new MockHttpError(400, 'name is required');

    const ts = now();
    const cohortSlug = slugify(b.name);
    if (b.set_as_default) {
      programme.cohorts.forEach((c) => {
        c.is_default = false;
      });
    }
    const cohort: Cohort = {
      id: `cohort_${Math.random().toString(36).slice(2, 10)}`,
      programme_id: programme.id,
      name: b.name.trim(),
      slug: cohortSlug,
      label: `${programme.name} — ${b.name.trim()}`,
      registration_goal: b.registration_goal ?? 5000,
      is_active: true,
      is_default: Boolean(b.set_as_default),
      registration_open: b.registration_open !== false,
      event_date: b.event_date ?? null,
      event_venue: b.event_venue ?? null,
      event_city: b.event_city ?? null,
      date_confirmed: b.date_confirmed ?? false,
      registrant_count: 0,
      register_url: `https://abodewebinar.abodeflex.ng/register?cohort=${cohortSlug}`,
      createdAt: ts,
      updatedAt: ts,
    };
    programme.cohorts = [cohort, ...programme.cohorts];
    programme.cohort_count = programme.cohorts.length;
    programme.latest_cohort = cohort;
    programme.updatedAt = ts;
    return cohort;
  },

  'GET /admin/academy/cohorts/:id': ({ params }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    return found.cohort;
  },

  'PATCH /admin/academy/cohorts/:id': ({ params, body: raw }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    const patch = body<Partial<Cohort>>(raw);
    Object.assign(found.cohort, patch, { updatedAt: now() });
    if (patch.is_default) {
      found.programme.cohorts.forEach((c) => {
        c.is_default = c.id === found.cohort.id;
      });
    }
    return found.cohort;
  },

  'GET /admin/academy/cohorts/:id/dashboard': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    const from = String(query.from ?? new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
    const to = String(query.to ?? new Date().toISOString().slice(0, 10));
    return emptyDashboard(found.cohort, from, to);
  },

  'GET /admin/academy/cohorts/:id/registrants': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    let rows = registrants.filter((r) => r.cohort_id === params.id);
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.email.includes(search) ||
          r.first_name.toLowerCase().includes(search) ||
          r.last_name.toLowerCase().includes(search) ||
          r.phone.includes(search),
      );
    }
    return paged(rows, query);
  },

  'GET /admin/academy/cohorts/:id/referrals': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    const rows = [
      {
        username: 'tunde',
        first_name: 'Tunde',
        last_name: 'Balogun',
        email: 'tunde@example.com',
        phone: '+2348033333333',
        total_referred: 1,
        checked_in_count: 0,
        attendance_count: 0,
      },
    ];
    return paged(rows, query);
  },

  'GET /admin/academy/cohorts/:id/tests': ({ params, query }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
    const rows = tests
      .filter((t) => t.cohort_id === params.id)
      .map(publicTest);
    return paged(rows, query);
  },

  'POST /admin/academy/cohorts/:id/tests': ({ params, body: raw }) => {
    const found = findCohort(params.id);
    if (!found) throw new MockHttpError(404, 'Cohort not found');
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

  'GET /admin/academy/tests/:id/attempts': ({ params, query }) => {
    const test = tests.find((t) => t.id === params.id);
    if (!test) throw new MockHttpError(404, 'Test not found');
    const rows = attempts.filter((a) => a.test_id === params.id);
    return paged(rows, query);
  },
};
