// node scripts/check-recruitment-analysis.mjs [path-to-abode-be-v2]
// Optional backend check executes its real service with an in-memory repository; no database or HTTP calls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(file, overrides = {}) {
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, Date, Intl, require: name => {
    if (name in overrides) return overrides[name];
    if (name.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const target = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(file), name);
    return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx', overrides);
  } }, { filename: file });
  return compiledModule.exports;
}
const schemas = load(path.join(root, 'features/recruitment/schemas/recruitment-analysis.schema.ts'));
const helpers = load(path.join(root, 'features/recruitment/components/analytics-performance.ts'));
const presentation = load(path.join(root, 'features/recruitment/components/analysis-presentation.ts'));
const money = amount => ({ amount_minor: amount, currency: 'NGN' });
const cost = schemas.AnalysisCostSchema.parse({ availability: 'tracked', total: money(10000), by_category: { ads: money(10000) }, return_on_contract_value: 10, return_on_revenue: 4, cost_per_registrant: money(1000), cost_per_pro: money(5000), cost_per_selling_pro: money(10000) });
const performance = schemas.AnalysisPerformanceSchema.parse({ credited_pros: 2, selling_pros: 1, plans_sold: 2, ended_plans: 0, contract_value: money(100000), revenue: money(40000), contract_value_per_selling_pro: money(100000), revenue_per_selling_pro: money(40000), median_days_to_first_sale: 15, approved_recruits: 1, cost, definition: { version: 'sales-v1', credit: 'latest registration', sales: 'direct seller', contract_value: 'land price', revenue: 'land paid', window: 'to date' } });
const cohort = { id: 'c1', performance, registrants: { count: 10 }, approved_upgrades: { count: 9 }, active_associate_pros: { count: 8, both: 5, confirmed_sale_only: 3 } };
assert.equal(presentation.cohortValue(cohort, 'selling'), 50, 'selling rate must use credited Pros, not legacy membership');
assert.equal(presentation.cohortValue(cohort, 'upgrades'), 20);
assert.equal(helpers.performanceTotals([cohort]).returnOnRevenue, 4, 'return uses money paid, not contract value');
assert.equal(helpers.moneyText(money(123456)), '₦1,234.56', 'minor units must convert once');
assert.equal(helpers.moneyText(money(0)), '₦0.00');
assert.equal(helpers.moneyText(null), '—');
assert.equal(helpers.performanceTotals([]).returnOnRevenue, null);
for (const unavailable of [
  { availability: 'restricted', reason: 'needs_view_cohort_costs' },
  { availability: 'unavailable', reason: 'cost_not_split_by_source' },
  { availability: 'unavailable', reason: 'cost_not_recorded' },
]) {
  const row = { ...cohort, performance: { ...performance, cost: schemas.AnalysisCostSchema.parse(unavailable) } };
  assert.equal(helpers.performanceTotals([cohort, row]).returnOnRevenue, null, 'partial costs must not inflate return');
  assert.equal(helpers.performanceTotals([cohort, row]).sales, 200000, 'missing costs do not hide sales');
}
assert.equal(helpers.performanceTotals([{ ...cohort, performance: { ...performance, cost: { ...cost, total: money(0) } } }]).returnOnRevenue, null);
assert.equal(helpers.activityShare({ activity_analysis: { rows: [{ key: 'weekly', availability: 'tracked', participants: 2, nonparticipants: 2, unknown: 6 }] } }, 'weekly'), 50, 'unknown histories are excluded');
assert.equal(helpers.activityShare({ activity_analysis: { rows: [{ key: 'weekly', availability: 'unavailable' }] } }, 'weekly'), null);
assert(!schemas.AnalysisCostSchema.safeParse({ availability: 'tracked' }).success, 'malformed tracked data must not become zero');

if (process.argv[2]) {
  const backend = path.resolve(process.argv[2]);
  const backendRequire = createRequire(path.join(backend, 'package.json'));
  const { AcademyRecruitmentAnalysisService } = load(path.join(backend, 'src/modules/academy/academy-recruitment-analysis.service.ts'), {
    '@nestjs/common': { Injectable: () => target => target, BadRequestException: Error },
    mongoose: backendRequire('mongoose'),
    './academy-recruitment-analysis.repository': { AcademyRecruitmentAnalysisRepository: class {} },
  });
  const id = n => String(n).padStart(24, '0');
  const cid = id(1), uid = id(2), pid = id(3);
  const row = { _id: id(4), first_name: 'Contract', last_name: 'Test', email: 'contract@example.test', phone: '+2348000000000', user_id: uid, cohort_id: cid, referral_source: 'website', was_existing: false, checked_in: false, checked_in_at: null, createdAt: new Date('2026-01-01') };
  const dataset = {
    cohorts: [{ _id: cid, programme_id: pid, label: 'Contract cohort', createdAt: new Date('2026-01-01'), registration_open: false }],
    programmes: [{ _id: pid, name: 'Academy' }], sources: ['website'], registrations: [row, { ...row, _id: id(5), user_id: id(6), email: 'followup@example.test' }],
    events: [{ _id: id(7), cohort_id: cid, name: 'Academy online session' }], tests: [], attempts: [], enrolments: [], activeUsers: [], referrals: [],
    verifications: [1, 2].map(n => ({ _id: id(7 + n), meeting: id(7), user: uid, verified_at: new Date('2026-01-10') })),
    upgrades: [{ user: uid, reviewed_at: new Date('2026-02-01') }], proRegistrations: [row],
    sales: [{ seller: uid, at: new Date('2026-03-01'), contract: 1000, paid: 400, status: 'active' }],
    costs: [{ cohort_id: cid, category: 'ads', amount: 100 }],
  };
  const service = new AcademyRecruitmentAnalysisService({
    load: async () => dataset,
    loadActivity: async () => ({ meetings: [], verifications: [], events: [], checkins: [], referrals: [], eventTrackingStart: {} }),
  });
  const json = value => JSON.parse(JSON.stringify(value));
  for (const [query, permissions, expected] of [
    [{}, { canSeeCosts: true }, 'tracked'],
    [{ cohort_id: cid }, { canSeeCosts: true }, 'tracked'],
    [{ cohort_id: cid, source: 'website' }, { canSeeCosts: true }, 'unavailable'],
    [{ cohort_id: cid }, { canSeeCosts: false }, 'restricted'],
  ]) {
    const data = schemas.RecruitmentAnalysisSchema.parse(json(await service.getDashboard(query, permissions)));
    assert.equal(data.cohorts[0].performance.cost.availability, expected);
    assert.equal(data.performance.contract_value.amount_minor, 100000);
    assert.equal(data.performance.revenue.amount_minor, 40000);
    assert.equal(data.cohorts[0].attendance.policy, 'checkin_or_meeting_verification');
    assert.equal(data.cohorts[0].attendance.meeting_verification_only, 1, 'repeated verification counts once even with checked_in false');
    assert.equal(data.summary.attendees.count, 1);
    if (query.cohort_id) {
      assert.equal(data.sales_timeline.months[0].plans_sold, 1);
      assert(data.first_sale_timeline.points.length > 0);
      assert.equal(data.activity_analysis.rows.length, 6);
    }
    // Rolling deployments can still return the original response without additive blocks.
    delete data.performance; delete data.return_by_cohort; delete data.sales_timeline;
    delete data.first_sale_timeline; delete data.activity_analysis;
    data.cohorts.forEach(c => { delete c.performance; delete c.attendance; });
    assert(schemas.RecruitmentAnalysisSchema.safeParse(data).success);
  }
  const people = await service.listPeople({ cohort_id: cid, stage: 'approved_upgrade', selling_status: 'selling', sort_by: 'sales_value', sort_direction: 'desc', page: 1, limit: 10 });
  const person = schemas.RecruitmentAnalysisPersonSchema.parse(json(people.data[0]));
  assert.equal(person.pro.contract_value.amount_minor, 100000);
  assert.equal(person.pro.credited_to_this_cohort, true);
  assert.equal(person.phone_number, '+2348000000000');
  assert.equal(person.attendance_source, 'meeting_verification');
  const followup = await service.listPeople({ cohort_id: cid, follow_up: 'registered_without_attendance', page: 1, limit: 100 });
  assert.equal(followup.meta.total, 1);
  assert.equal(schemas.RecruitmentAnalysisPersonSchema.parse(json(followup.data[0])).email, 'followup@example.test');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  let detail = schemas.RecruitmentAnalysisSchema.parse(json(await service.getDashboard({ cohort_id: cid }, { canSeeCosts: true })));
  const second = structuredClone(detail);
  second.cohorts[0].id = id(20); second.cohorts[0].name = 'Second cohort'; second.filters.cohort_id = id(20);
  const ready = data => ({ data, isLoading: false, isFetching: false, error: null, refetch: async () => {} });
  const overrides = {
    './CohortCostsManager': { CohortCostsButton: () => null },
    '@/lib/utils': { cn: (...args) => args.filter(Boolean).join(' ') },
    '@/hooks/use-debounce': { useDebounce: value => value },
    'next/navigation': { useSearchParams: () => new URLSearchParams() },
    './AnalyticsSelect': { AnalyticsSelect: ({ label, value }) => React.createElement('span', null, label, ': ', value) },
    '../hooks/use-recruitment': {
      useRecruitmentAnalysis: () => ready(detail),
      useRecruitmentAnalysisComparison: () => [ready(detail), ready(second)],
      useRecruitmentAnalysisPeople: () => ready({ items: [person], meta: people.meta }),
    },
  };
  const component = name => load(path.join(root, `features/recruitment/components/${name}.tsx`), overrides)[name];
  const Overview = component('RecruitmentAnalyticsOverview');
  const Detail = component('RecruitmentAnalyticsDetail');
  const Compare = component('RecruitmentAnalyticsCompare');
  const noop = () => {};
  const overviewProps = { status: 'all', search: '', sort: 'return', page: 1, selected: [], update: noop, onSelect: noop, onCompare: noop, onOpen: noop };
  const detailProps = { cohortId: cid, filters: {}, onBack: noop, onCompare: noop, onDrill: noop, proPage: 1, proSearch: '', update: noop };
  assert(renderToStaticMarkup(React.createElement(Overview, { ...overviewProps, data: detail })).includes('₦1,000.00'));
  const detailHtml = renderToStaticMarkup(React.createElement(Detail, detailProps));
  assert(detailHtml.includes('Sales by month'));
  assert(detailHtml.includes('Contract Test'));
  assert(detailHtml.includes('meeting verification only'));
  const compareHtml = renderToStaticMarkup(React.createElement(Compare, { options: [detail.cohorts[0], second.cohorts[0]], selected: [cid, id(20)], onChange: noop, onOpen: noop }));
  assert(compareHtml.includes('Money paid per ₦1 spent'));
  assert(compareHtml.includes('₦1,000.00'));
  const originalFirstTimeline = detail.first_sale_timeline;
  const originalSecondTimeline = second.first_sale_timeline;
  const compare90Row = () => renderToStaticMarkup(React.createElement(Compare, { options: [detail.cohorts[0], second.cohorts[0]], selected: [cid, id(20)], onChange: noop, onOpen: noop })).split('Sold within 90 days')[1].split('</tr>')[0];
  detail.first_sale_timeline = { basis: '90-day fixture', eligible_pros: 188, points: [{ day: 90, eligible: 120, sellers: 6, percent: 5 }] };
  second.first_sale_timeline = { basis: '90-day fixture', eligible_pros: 155, points: [{ day: 90, eligible: 155, sellers: 3, percent: 1.9 }] };
  assert(compare90Row().includes('6 of 120 Pros'), 'Use the eligible checkpoint denominator, not the cohort total');
  assert(compare90Row().includes('Higher rate'));
  second.first_sale_timeline.points = [];
  assert(compare90Row().includes('Not enough time yet'));
  assert(!compare90Row().includes('Higher rate'), 'Do not declare a winner when a cohort is too new');
  second.first_sale_timeline = undefined;
  assert(compare90Row().includes('Data unavailable'), 'Missing timeline is not proof that a cohort is too new');
  second.first_sale_timeline = { basis: '90-day fixture', eligible_pros: 155, points: [{ day: 90, eligible: 155, sellers: 0, percent: 0 }] };
  assert(compare90Row().includes('0 of 155 Pros'), 'A known zero must remain visible');
  detail.first_sale_timeline = originalFirstTimeline;
  second.first_sale_timeline = originalSecondTimeline;
  detail.cohorts[0].programme_name = 'Realtor Certification Program';
  const rcpHtml = renderToStaticMarkup(React.createElement(Detail, detailProps));
  assert(!rcpHtml.includes('Allocation event'));
  assert(!rcpHtml.includes('Site inspection'));
  const compareProps = { options: [detail.cohorts[0], second.cohorts[0]], selected: [cid, id(20)], onChange: noop, onOpen: noop };
  const mixedHtml = renderToStaticMarkup(React.createElement(Compare, compareProps));
  assert(mixedHtml.includes('Allocation event') && mixedHtml.includes('Not applicable'));
  second.cohorts[0].programme_name = 'RCP';
  const rcpCompareHtml = renderToStaticMarkup(React.createElement(Compare, compareProps));
  assert(!rcpCompareHtml.includes('Allocation event'));
  assert(!rcpCompareHtml.includes('Site inspection'));
  detail = schemas.RecruitmentAnalysisSchema.parse(json(await service.getDashboard({ cohort_id: cid }, { canSeeCosts: false })));
  assert(renderToStaticMarkup(React.createElement(Detail, detailProps)).includes('Cost viewing permission required'));
  detail = schemas.RecruitmentAnalysisSchema.parse(json(await service.getDashboard({ cohort_id: cid, source: 'website' }, { canSeeCosts: true })));
  assert(renderToStaticMarkup(React.createElement(Detail, detailProps)).includes('Costs are not split by source'));
  assert(renderToStaticMarkup(React.createElement(Overview, { ...overviewProps, data: { ...detail, cohorts: [] } })).includes('No cohorts match your filters'));
  console.log('Overview, detail and comparison render checks passed, including restricted/source costs and empty selections.');
  console.log('Local backend service responses passed the frontend aggregate, detail and people schemas.');
}
console.log('Recruitment checks passed: currency units, credited rates, return basis, partial/restricted/zero costs and activity denominators.');
