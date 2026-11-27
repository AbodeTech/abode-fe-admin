/**
 * Associate Manager Tracker — mock API verification.
 * Run: npx tsx scripts/associate-managers-mock-qa.ts
 *
 * The Manager Performance page needs about twenty /admin/managers/* routes; only
 * `me` existed, so a Sales Lead (who holds view_manager_tracker and so gets the
 * Admin view) hit "no route registered for GET /admin/managers". This proves the
 * whole family now answers, that every payload parses with the SAME Zod schemas
 * the page uses, and that the mock refuses the people the backend refuses:
 *
 *   Sales Member       → own team only (no list, no other teams, no writes)
 *   Sales Team Lead    → view_manager_tracker + reassign_manager, NOT manage_manager_tracker
 *   Super admin        → not a manager; sees every team and may write
 *
 * Read-only checks run first: the writes below move pros between teams.
 */
import { z } from 'zod';

import {
  BulkAssignResultSchema,
  ManagerHasRosterDetailsSchema,
  ManagerListItemSchema,
  ManagerProfileSchema,
  ManagerTargetSchema,
  OnboardingAttemptSchema,
  ProSummarySchema,
  RatingSeriesPointSchema,
  RemoveManagerResultSchema,
} from '../features/associate-managers/schemas/associate-manager.schema';
import { ManagerDashboardSchema } from '../features/associate-managers/schemas/manager-dashboard.schema';
import { SalesRowSchema } from '../features/sales/schemas/sales.schema';
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { associateManagerRoutes } from '../lib/mocks/routes/associate-managers';
import { authRoutes } from '../lib/mocks/routes/auth';
import { ADMINS } from '../lib/mocks/routes/cs-managers';

registerRoutes(authRoutes);
registerRoutes(associateManagerRoutes);

async function call(method: string, path: string, query: Record<string, unknown> = {}, body?: unknown) {
  return dispatchMockRoute({ method, path, query, body });
}

async function signIn(email: string) {
  await call('POST', '/auth/admin/login', {}, { email, password: 'password123' });
}

type Result = { id: string; ok: boolean };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number, code?: string) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status && (!code || e.code === code)) return e;
    throw new Error(`expected ${status} ${code ?? ''}, got ${e instanceof MockHttpError ? `${e.statusCode} ${e.code}` : (e as Error).message}`);
  }
  throw new Error(`expected ${status} ${code ?? ''}, but the call succeeded`);
}

type Paged = { data: unknown[]; meta: { total?: number } };
const list = async (query: Record<string, unknown> = { page: 1, limit: 100 }) =>
  z.array(ManagerListItemSchema).parse(((await call('GET', '/admin/managers', query)) as Paged).data);
const dash = async (path: string, query: Record<string, unknown> = { period_type: 'MONTH' }) =>
  ManagerDashboardSchema.parse(await call('GET', path, query));

const NGOZI = ADMINS[0]._id;
const TOLU = ADMINS[3]._id;
const FEMI = ADMINS[4]._id;

async function main() {
  const results: Result[] = [];
  const add = async (id: string, fn: () => Promise<void>) => results.push(await run(id, fn));

  /* ---------------- Sales Team Lead: the reported case ---------------- */
  await signIn('as-sales_team_lead@abode.ng');
  let selfId = '';

  await add('LEAD-me-is-a-manager-and-parses', async () => {
    const me = ManagerProfileSchema.parse(await call('GET', '/admin/managers/me'));
    assert(me.is_manager && me.manager, 'a Sales Lead holds the manager record');
    assert(me.manager.roster_size > 0 && me.manager.associate_pros.length > 0, 'their roster is not empty');
    selfId = me.manager.manager_id;
  });

  await add('LEAD-list-works-the-reported-failure', async () => {
    const managers = await list();
    assert(managers.length === 4, `self + 3 others, got ${managers.length}`);
    assert(managers[0].manager_id === selfId, 'the signed-in manager is listed first');
    assert(managers.every((m) => m.associate_pros.length <= 5), 'list rows preview at most five pros');
    const big = managers.find((m) => m.roster_size > 5);
    assert(big === undefined || big.associate_pros.length === 5, 'a bigger roster is previewed, not listed in full');
  });

  await add('LEAD-list-search-and-paging', async () => {
    const found = await list({ page: 1, limit: 100, q: 'tolu' });
    assert(found.length === 1 && found[0].manager_id === TOLU, 'q matches the display name');
    const page = (await call('GET', '/admin/managers', { page: 2, limit: 2 })) as Paged;
    assert(page.data.length === 2 && page.meta.total === 4, 'paging slices and reports the total');
  });

  await add('LEAD-detail-has-the-full-roster', async () => {
    const detail = ManagerListItemSchema.parse(await call('GET', `/admin/managers/${selfId}`));
    assert(detail.associate_pros.length === detail.roster_size, 'detail lists every pro');
    await expectError(() => call('GET', '/admin/managers/665fffffffffffffffffffff'), 404, 'MANAGER_NOT_FOUND');
  });

  await add('LEAD-dashboards-parse-for-every-scope', async () => {
    const own = await dash('/admin/managers/dashboard');
    const other = await dash(`/admin/managers/${NGOZI}/dashboard`);
    const all = await dash('/admin/managers/dashboard/all');
    assert(own.recruitment.total_assigned === (await list())[0].roster_size, 'own dashboard counts the whole roster');
    assert(other.recruitment.total_assigned > 0 && all.recruitment.total_assigned >= other.recruitment.total_assigned, 'combined covers every managed pro');
    const { actual, rating_count } = own.performance_score;
    assert(rating_count === 0 ? actual === 0 : actual >= 1 && actual <= 5, 'the peer rating is out of 5, or unrated');
  });

  await add('LEAD-attribution-vs-channels-never-both', async () => {
    const own = await dash('/admin/managers/dashboard');
    const all = await dash('/admin/managers/dashboard/all');
    const sum = (s: { managed: number; unassigned: number; users: number; associate: number }) => s.managed + s.unassigned + s.users + s.associate;
    assert(sum(own.recruitment.new_signups_by_source) === 0 && sum(own.sales_and_revenue.revenue_by_source) === 0, 'a single team has no channel breakdown');
    assert(all.recruitment.top_new_signups_contributors.length === 0 && all.sales_and_revenue.top_selling_contributors.length === 0, 'the combined view has no per-pro credit');
    assert(sum(all.recruitment.new_signups_by_source) === all.recruitment.new_signups_in_period, 'channels add up to the signups');
  });

  await add('LEAD-cannot-read-system-or-write', async () => {
    await expectError(() => call('GET', '/admin/managers/dashboard/system'), 403);
    await expectError(() => call('POST', '/admin/managers', {}, { admin_id: ADMINS[1]._id }), 403);
    await expectError(() => call('PUT', `/admin/managers/${NGOZI}/targets/2026/11`, {}, { revenue_target: 1 }), 403);
    await expectError(() => call('DELETE', `/admin/managers/${FEMI}`), 403);
    await expectError(() => call('PATCH', `/admin/managers/${NGOZI}/private`, {}, { is_private: true }), 403);
  });

  /* ---------------- Sales Member: own team only ---------------- */
  await signIn('as-sales_member@abode.ng');

  await add('MEMBER-own-team-only', async () => {
    await expectError(() => call('GET', '/admin/managers', { page: 1, limit: 100 }), 403);
    await expectError(() => call('GET', '/admin/managers/dashboard/all'), 403);
    await expectError(() => call('GET', `/admin/managers/${NGOZI}/dashboard`), 403, 'NOT_YOUR_TEAM');
    await expectError(() => call('GET', '/admin/managers/unassigned-pros'), 403);
    await expectError(() => call('POST', `/admin/managers/pros/${'0'.repeat(24)}/reassign`, {}, { to_manager_id: NGOZI }), 403);
    const me = ManagerProfileSchema.parse(await call('GET', '/admin/managers/me'));
    assert(me.is_manager && me.manager, 'a Sales Member is a manager through the record');
    await dash('/admin/managers/dashboard');
    await dash(`/admin/managers/${me.manager.manager_id}/dashboard`);
    z.array(RatingSeriesPointSchema).parse(await call('GET', `/admin/managers/${me.manager.manager_id}/rating-series`));
  });

  await add('MEMBER-team-sales-self-route', async () => {
    const page = (await call('GET', '/admin/managers/sales-record', { page: 1, limit: 25 })) as Paged;
    z.array(SalesRowSchema).parse(page.data);
  });

  /* ---------------- Super admin: not a manager, sees everything ---------------- */
  await signIn('ada@abode.ng');

  await add('ADMIN-not-a-manager', async () => {
    const me = ManagerProfileSchema.parse(await call('GET', '/admin/managers/me'));
    assert(!me.is_manager && me.manager === null, 'the default super admin holds no manager record');
    await expectError(() => call('GET', '/admin/managers/dashboard'), 403, 'NOT_A_MANAGER');
    await expectError(() => call('GET', '/admin/managers/sales-record'), 403, 'NOT_A_MANAGER');
  });

  await add('ADMIN-teams-and-unassigned-add-up', async () => {
    const managers = await list();
    assert(managers.length === 3, `three other teams, got ${managers.length}`);
    const unassigned = (await call('GET', '/admin/managers/unassigned-pros', { page: 1, limit: 100 })) as Paged;
    z.array(ProSummarySchema).parse(unassigned.data);
    const total = managers.reduce((sum, m) => sum + m.roster_size, 0) + unassigned.data.length;
    assert(total === 22, `every one of the 22 pros is on exactly one team or unassigned, got ${total}`);
    const search = (await call('GET', '/admin/managers/unassigned-pros', { page: 1, limit: 10, q: 'patience' })) as Paged;
    assert(search.data.length === 1, 'q searches the unassigned pool');
  });

  await add('ADMIN-system-dashboard-covers-everyone', async () => {
    const system = await dash('/admin/managers/dashboard/system');
    assert(system.recruitment.total_assigned === 22, 'the system scope includes unassigned pros');
    assert(system.target.revenue_target === null, 'no manager target applies to the whole tier');
  });

  await add('ADMIN-period-filters', async () => {
    const thisMonth = await dash(`/admin/managers/${NGOZI}/dashboard`, { period_type: 'MONTH' });
    const now = new Date();
    assert(thisMonth.period.month === now.getMonth() + 1 && thisMonth.period.year === now.getFullYear(), 'MONTH defaults to this month');
    const old = await dash(`/admin/managers/${NGOZI}/dashboard`, { period_type: 'MONTH', month: 3, year: 2020 });
    assert(old.period.month === 3 && old.recruitment.new_signups_in_period === 0, 'an old month has no signups');
    assert(old.target.revenue_target === null, 'a month with no target arrives null, not 0');
    const custom = await dash(`/admin/managers/${NGOZI}/dashboard`, {
      period_type: 'CUSTOM',
      start_date: '2020-01-01T00:00:00.000+01:00',
      end_date: '2020-01-31T23:59:59.999+01:00',
    });
    assert(custom.period.month === null, 'a custom range has no month');
    const year = await dash(`/admin/managers/${NGOZI}/dashboard`, { period_type: 'this_year' });
    assert(year.period.year === now.getFullYear() && year.period.month === null, 'the BE vocabulary works too');
  });

  await add('ADMIN-roster-groups-sorts-paging', async () => {
    const all = await dash(`/admin/managers/${NGOZI}/dashboard`, { period_type: 'MONTH', pro_group: 'all', pro_sort: 'name_asc', page: 1, limit: 2 });
    assert(all.associate_pros.length === 2 && all.associate_pros_group_total === 5, 'pages of two over five pros');
    const names = all.associate_pros.map((p) => `${p.first_name} ${p.last_name}`);
    assert([...names].sort().join() === names.join(), 'name_asc sorts');
    const selling = await dash(`/admin/managers/${NGOZI}/dashboard`, { period_type: 'MONTH', pro_group: 'selling_in_period' });
    assert(selling.associate_pros.length === selling.sales_and_revenue.selling_pros, 'the group matches the KPI it drills into');
    const abandoned = await dash(`/admin/managers/${TOLU}/dashboard`, { period_type: 'MONTH', pro_group: 'abandoned' });
    assert(abandoned.associate_pros.length > 0 && abandoned.associate_pros.every((p) => p.status === 'abandoned'), 'status buckets filter');
    const recruiter = await dash('/admin/managers/dashboard/all', { period_type: 'MONTH', pro_group: 'active_recruiter' });
    assert(recruiter.associate_pros.length === 0 && recruiter.associate_pros_group_total === 0, 'single-scope groups are empty org-wide');
  });

  await add('ADMIN-targets-and-an-unset-goal-stay-null', async () => {
    const now = new Date();
    const femi = await dash(`/admin/managers/${FEMI}/dashboard`);
    assert(femi.target.revenue_target === null && femi.target.selling_target === 2, 'Femi has no revenue target but does have a selling one');
    const history = z.array(ManagerTargetSchema).parse(await call('GET', `/admin/managers/${NGOZI}/targets`));
    assert(history.length === 1 && history[0].year === now.getFullYear(), 'target history');
    const none = await call('GET', `/admin/managers/${NGOZI}/targets/2020/3`);
    assert(none === null, 'a month nobody set is null');
    const one = ManagerTargetSchema.nullable().parse(await call('GET', `/admin/managers/${NGOZI}/targets/${now.getFullYear()}/${now.getMonth() + 1}`));
    assert(one?.revenue_target === 14_000_000, 'one month');
  });

  await add('ADMIN-rating-series-oldest-first-unrated-is-count-zero', async () => {
    const series = z.array(RatingSeriesPointSchema).parse(await call('GET', `/admin/managers/${NGOZI}/rating-series`, { months_back: 12 }));
    assert(series.length === 12, 'one point per month');
    const key = (p: { year: number; month: number }) => p.year * 12 + p.month;
    assert(series.every((p, i) => i === 0 || key(p) === key(series[i - 1]) + 1), 'oldest first, no gaps');
    assert(series.every((p) => (p.count === 0 ? p.average === 0 : p.average >= 1 && p.average <= 5)), 'unrated months are {0, 0}; rated ones are out of 5');
    assert(series.some((p) => p.count === 0) && series.some((p) => p.count > 0), 'the fixture has both rated and unrated months');
  });

  await add('ADMIN-team-sales-belong-to-the-roster', async () => {
    let rows = 0;
    for (const m of await list()) {
      const page = (await call('GET', `/admin/managers/${m.manager_id}/sales-record`, { page: 1, limit: 100 })) as Paged;
      const parsed = z.array(SalesRowSchema).parse(page.data);
      const roster = ManagerListItemSchema.parse(await call('GET', `/admin/managers/${m.manager_id}`)).associate_pros.map((p) => p.pro_id);
      assert(parsed.every((r) => r.referrer && roster.includes(r.referrer.id)), `${m.display_name}: every sale is by one of their pros`);
      rows += parsed.length;
    }
    assert(rows > 0, 'at least one team has sales');
  });

  await add('ADMIN-onboarding-attempts-read', async () => {
    const attempts = z.array(OnboardingAttemptSchema).parse(await call('GET', `/admin/pros/${'665fa0' + '0'.repeat(14) + '0010'}/onboarding-attempts`));
    assert(attempts.length === 2 && attempts[0].attempt_number === 2, 'newest first, numbered from the oldest');
    assert(attempts[0].is_overdue && !attempts[1].is_overdue, 'only the latest attempt can be overdue');
  });

  await add('ADMIN-exports-are-not-mocked', async () => {
    await expectError(() => call('GET', `/admin/managers/${NGOZI}/exports/pros`), 404, 'MOCK_ROUTE_NOT_FOUND');
  });

  /* ---------------- Writes (these move pros between teams) ---------------- */

  await add('ADMIN-add-manager-rules', async () => {
    await expectError(() => call('POST', '/admin/managers', {}, { admin_id: NGOZI }), 409, 'ALREADY_A_MANAGER');
    await expectError(() => call('POST', '/admin/managers', {}, { admin_id: '665fffffffffffffffffffff' }), 404, 'ADMIN_NOT_FOUND');
    await expectError(() => call('POST', '/admin/managers', {}, { admin_id: ADMINS[1]._id, phone_number: '0803' }), 400);
    const created = ManagerListItemSchema.parse(await call('POST', '/admin/managers', {}, { admin_id: ADMINS[1]._id, phone_number: '+2348012345678' }));
    assert(created.display_name === 'Chuka Obi' && created.roster_size === 0, 'a new manager starts empty, named from the admin');
    assert((await list()).length === 4, 'and shows in the list');
  });

  await add('ADMIN-bulk-assign-and-remove-needs-an-empty-roster', async () => {
    const chuka = ADMINS[1]._id;
    const pool = z.array(ProSummarySchema).parse(((await call('GET', '/admin/managers/unassigned-pros', { page: 1, limit: 100 })) as Paged).data);
    const moved = BulkAssignResultSchema.parse(await call('POST', `/admin/managers/${chuka}/pros`, {}, { pro_ids: pool.slice(0, 2).map((p) => p.pro_id) }));
    assert(moved.reassigned_count === 2 && moved.manager.roster_size === 2 && moved.to_manager === chuka, 'two moved in');

    const refused = await expectError(() => call('DELETE', `/admin/managers/${chuka}`), 400, 'MANAGER_HAS_ROSTER');
    const details = ManagerHasRosterDetailsSchema.parse(refused.details);
    assert(details.pros_to_reassign.length === 2, 'the 400 lists who has to move');

    await call('POST', `/admin/managers/${NGOZI}/pros`, {}, { pro_ids: details.pros_to_reassign.map((p) => p.pro_id) });
    const removed = RemoveManagerResultSchema.parse(await call('DELETE', `/admin/managers/${chuka}`));
    assert(removed.success, 'an empty manager can be removed');
    await expectError(() => call('GET', `/admin/managers/${chuka}`), 404, 'MANAGER_NOT_FOUND');
    await expectError(() => call('POST', `/admin/managers/${NGOZI}/pros`, {}, { pro_ids: [] }), 400);
    await expectError(() => call('POST', `/admin/managers/${NGOZI}/pros`, {}, { pro_ids: Array(201).fill('x') }), 400);
  });

  await add('ADMIN-target-put-is-partial-and-strict', async () => {
    const now = new Date();
    const path = `/admin/managers/${FEMI}/targets/${now.getFullYear()}/${now.getMonth() + 1}`;
    const saved = ManagerTargetSchema.parse(await call('PUT', path, {}, { revenue_target: 9_000_000 }));
    assert(saved.revenue_target === 9_000_000 && saved.selling_associate_pro_target === 2, 'an omitted target is left alone');
    assert((await dash(`/admin/managers/${FEMI}/dashboard`)).target.revenue_target === 9_000_000, 'and the dashboard picks it up');
    await expectError(() => call('PUT', path, {}, { revenue_target: -1 }), 400);
    await expectError(() => call('PUT', path, {}, { month: 3 }), 400);
  });

  await add('ADMIN-reassign-one-pro-and-private-flag', async () => {
    const pro = (await list()).find((m) => m.manager_id === TOLU)!.associate_pros[0];
    const moved = ManagerListItemSchema.parse(await call('POST', `/admin/managers/pros/${pro.pro_id}/reassign`, {}, { to_manager_id: FEMI }));
    assert(moved.manager_id === FEMI && (await call('GET', `/admin/managers/${FEMI}`) as { associate_pros: { pro_id: string }[] }).associate_pros.some((p) => p.pro_id === pro.pro_id), 'the pro is on the new roster');
    const priv = ManagerListItemSchema.parse(await call('PATCH', `/admin/managers/${FEMI}/private`, {}, { is_private: true }));
    assert(priv.is_private === true, 'private flag persists');
  });

  await add('ADMIN-onboarding-call-rules', async () => {
    const pro = '665fa0' + '0'.repeat(14) + '0015';
    await expectError(() => call('POST', `/admin/pros/${pro}/onboarding-attempts`, {}, { outcome: 'rescheduled' }), 400, 'RESCHEDULE_DATE_REQUIRED');
    await expectError(() => call('POST', `/admin/pros/${pro}/onboarding-attempts`, {}, { outcome: 'maybe' }), 400);
    const picked = OnboardingAttemptSchema.parse(await call('POST', `/admin/pros/${pro}/onboarding-attempts`, {}, { outcome: 'picked', motivation: 'Wants a second income' }));
    assert(picked.attempt_number === 2 && picked.outcome === 'picked', 'logged as the second call');
    await expectError(() => call('POST', `/admin/pros/${pro}/onboarding-attempts`, {}, { outcome: 'picked' }), 400, 'PRO_ALREADY_ONBOARDED');
  });

  /* ---------------- Sales Lead can reassign, and only that ---------------- */
  await signIn('as-sales_team_lead@abode.ng');

  await add('LEAD-may-reassign-a-pro-but-not-bulk-assign', async () => {
    const me = ManagerProfileSchema.parse(await call('GET', '/admin/managers/me'));
    const pro = me.manager!.associate_pros[0];
    const moved = ManagerListItemSchema.parse(await call('POST', `/admin/managers/pros/${pro.pro_id}/reassign`, {}, { to_manager_id: NGOZI }));
    assert(moved.manager_id === NGOZI, 'reassign works with reassign_manager');
    const after = ManagerProfileSchema.parse(await call('GET', '/admin/managers/me'));
    assert(after.manager!.roster_size === me.manager!.roster_size - 1, 'their own roster shrank by one');
    await expectError(() => call('POST', `/admin/managers/${NGOZI}/pros`, {}, { pro_ids: [pro.pro_id] }), 403);
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

void main();
