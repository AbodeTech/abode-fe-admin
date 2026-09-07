/**
 * ABO-28 — Admin mock API smoke for Academy domains only.
 * Run: npx tsx scripts/academy-mock-qa.ts
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { academyRoutes } from '../lib/mocks/routes/academy';
import { meetingRoutes } from '../lib/mocks/routes/meetings';
import { checkinRoutes } from '../lib/mocks/routes/checkin';

registerRoutes(academyRoutes);
registerRoutes(meetingRoutes);
registerRoutes(checkinRoutes);

type Case = {
  id: string;
  method: string;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  expect: (result: unknown) => void;
};

const cases: Case[] = [
  {
    id: 'A-programmes',
    method: 'GET',
    path: '/admin/academy/programmes',
    query: { page: 1, limit: 20 },
    expect: (r: any) => {
      if (!Array.isArray(r?.data) || r.data.length < 1) throw new Error('no programmes');
    },
  },
  {
    id: 'A-programme-detail',
    method: 'GET',
    path: '/admin/academy/programmes/prog_rcp',
    expect: (r: any) => {
      if (r?.slug !== 'realtor-certification-program') throw new Error('bad programme');
    },
  },
  {
    id: 'A-cohort',
    method: 'GET',
    path: '/admin/academy/cohorts/cohort_sep_2026',
    expect: (r: any) => {
      if (r?.slug !== 'rcp-september-2026') throw new Error('bad cohort');
    },
  },
  {
    id: 'A-dashboard',
    method: 'GET',
    path: '/admin/academy/cohorts/cohort_sep_2026/dashboard',
    expect: (r: any) => {
      if (typeof r?.totalAll !== 'number') throw new Error('bad dashboard');
    },
  },
  {
    id: 'A-registrants',
    method: 'GET',
    path: '/admin/academy/cohorts/cohort_sep_2026/registrants',
    query: { search: 'ada', page: 1, limit: 20 },
    expect: (r: any) => {
      if (!r?.data?.some((x: any) => x.email === 'ada@example.com')) throw new Error('ada missing');
    },
  },
  {
    id: 'A-referrals',
    method: 'GET',
    path: '/admin/academy/cohorts/cohort_sep_2026/referrals',
    expect: (r: any) => {
      if (!Array.isArray(r?.data)) throw new Error('bad referrals');
    },
  },
  {
    id: 'A-tests',
    method: 'GET',
    path: '/admin/academy/cohorts/cohort_sep_2026/tests',
    expect: (r: any) => {
      if (!Array.isArray(r?.data)) throw new Error('bad tests');
    },
  },
  {
    id: 'A-meetings',
    method: 'GET',
    path: '/admin/meetings',
    query: { page: 1, limit: 50 },
    expect: (r: any) => {
      if (!r?.data?.some((m: any) => m.access_type === 'physical')) throw new Error('no physical meeting');
    },
  },
  {
    id: 'A-series',
    method: 'GET',
    path: '/admin/meetings/series/series_rcp_sep_2026',
    expect: (r: any) => {
      if (!r?.sessions?.length) throw new Error('empty series');
    },
  },
  {
    id: 'A-checkin-sessions',
    method: 'GET',
    path: '/admin/checkin/sessions',
    expect: (r: any) => {
      if (!Array.isArray(r) || r.length < 1) throw new Error('no checkin sessions');
    },
  },
  {
    id: 'A-checkin-search',
    method: 'GET',
    path: '/admin/checkin/sessions/665fmt0000000000000000s4/search',
    query: { q: 'ada' },
    expect: (r: any) => {
      if (!Array.isArray(r) || r.length < 1) throw new Error('search empty');
    },
  },
  {
    id: 'A-checkin-reg1',
    method: 'POST',
    path: '/admin/checkin/sessions/665fmt0000000000000000s4/check-in',
    body: { registration_id: 'reg_1' },
    expect: (r: any) => {
      if (r?.outcome !== 'success' && r?.outcome !== 'already') throw new Error('checkin failed');
    },
  },
  {
    id: 'A-checkin-reg2-dup',
    method: 'POST',
    path: '/admin/checkin/sessions/665fmt0000000000000000s4/check-in',
    body: { registration_id: 'reg_2' },
    expect: (r: any) => {
      if (r?.outcome !== 'already' && r?.outcome !== 'success') throw new Error('expected already/success');
    },
  },
];

async function main() {
  let pass = 0;
  const fails: string[] = [];
  for (const c of cases) {
    try {
      const result = await dispatchMockRoute({
        method: c.method,
        path: c.path,
        query: c.query ?? {},
        body: c.body,
      });
      c.expect(result);
      pass += 1;
      console.log(`PASS ${c.id}`);
    } catch (e) {
      const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.message}` : (e as Error).message;
      fails.push(`${c.id}: ${msg}`);
      console.log(`FAIL ${c.id}: ${msg}`);
    }
  }
  console.log(`\nAdmin mock QA: ${pass}/${cases.length} passed`);
  if (fails.length) process.exit(1);
}

main();
