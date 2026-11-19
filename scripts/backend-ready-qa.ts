/**
 * UI built ahead of its backend — gate + mock contract verification.
 * Run: npx tsx scripts/backend-ready-qa.ts
 *
 * 1. The NEXT_PUBLIC_BACKEND_READY list parses as documented in lib/backend-ready.ts.
 * 3. Item 15 (campaign sort): the default sends no params (today's BE accepts
 *    the request unchanged), a chosen sort sends sort_by + sort_dir, and the mock
 *    orders the whole list, not one page.
 * 4. Item 14 (course aggregates): rows parse with and without the new fields,
 *    and a course nobody has attempted reports null rates, not 0%.
 * 5. Item 13 (manager year / all time): ignored until `manager_long_periods`
 *    is ready (the month is used, as today), then sent as YEAR / all_time.
 * 6. Item 11 (resolved disputes): `status=resolved` returns only records with
 *    a past dispute and none open, rows carry `resolved_by`, counts carry it,
 *    and today's shape (no resolved_by / no resolved count) still parses.
 * 7. Item 10 (last active): rows carry `last_active_at` (null = none recorded),
 *    the range keeps only clients seen inside it, and no params go out unset.
 * 8. Items 7–8 (agency): sales rows carry real agency ids, the agency's
 *    by-asset inventory and stats come from the same plans, and stats parse.
 * 9. Item 12 (eligible upgrades): rows parse, only allowed from-tiers appear,
 *    the tier filter narrows, and a member drops off once upgraded.
 * 10. Item 16 (yearly goals): the three targets save and come back, the
 *     dashboard reports actuals with or without a target (progress null when
 *     unset, never 0%), and today's goal/dashboard shapes still parse.
 * 2. Item 9 (CS "Payment completed" filter): the mock serves the proposed
 *    `completed_from` / `completed_to` the way the requirements doc asks:
 *    inclusive days, null dates never match, chip counts follow the range,
 *    and the response still parses with the page's schema.
 */
import { format, subDays } from 'date-fns';
import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { csManagerRoutes } from '../lib/mocks/routes/cs-managers';
import { CSManagerDashboardSchema } from '../features/cs-managers/schemas/cs-manager.schema';
import { readyKeys } from '../lib/backend-ready';
import { courseRoutes } from '../lib/mocks/routes/courses';
import { CourseSchema } from '../features/courses/schemas/course.schema';
import { buildManagerDashboardPeriodFilter } from '../features/associate-managers/lib/dashboard-filter';
import { purchaseConfirmationRoutes } from '../lib/mocks/routes/purchase-confirmations';
import { AdminConfirmationRowSchema, ConfirmationCountsSchema } from '../features/purchase-confirmations/schemas/purchase-confirmation.schema';
import { allocationRoutes } from '../lib/mocks/routes/allocation';
import { AllocationClientSchema } from '../features/allocation/schemas/allocation.schema';
import { buildEligibleClientsParams } from '../features/allocation/hooks/use-allocation-clients';
import { agencyRoutes } from '../lib/mocks/routes/agency';
import { salesRoutes } from '../lib/mocks/routes/sales';
import { AgencyInventoryRowSchema, AgencyPerformanceSchema } from '../features/agency/schemas/agency-performance.schema';
import { upgradeRoutes } from '../lib/mocks/routes/upgrades';
import { EligibleUpgradeApiRowSchema } from '../features/upgrades/schemas/upgrade.schema';
import { toEligibleUpgrade, type EligibleUpgradeTier } from '../features/upgrades/lib/eligible-upgrade';
import { associateProTrackerRoutes } from '../lib/mocks/routes/associate-pro-tracker';
import { TrackerDashboardSchema, YearlyGoalSchema } from '../features/associate-pro-tracker/schemas/tracker.schema';
import { campaignEngineRoutes } from '../lib/mocks/routes/campaigns-engine';
import { campaignSortParams, parseCampaignSort } from '../features/campaigns/lib/campaign-sort';

registerRoutes(csManagerRoutes);
registerRoutes(campaignEngineRoutes);
registerRoutes(courseRoutes);
registerRoutes(purchaseConfirmationRoutes);
registerRoutes(allocationRoutes);
registerRoutes(agencyRoutes);
registerRoutes(salesRoutes);
registerRoutes(upgradeRoutes);
registerRoutes(associateProTrackerRoutes);

type Result = { id: string; ok: boolean; error?: string };

async function run(id: string, fn: () => Promise<void> | void): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false, error: msg };
  }
}

function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

function ok(cond: unknown, label: string) {
  if (!cond) throw new Error(label);
}

const day = (daysBack: number) => format(subDays(new Date(), daysBack), 'yyyy-MM-dd');

async function dashboard(query: Record<string, unknown>) {
  const raw = await dispatchMockRoute({ method: 'GET', path: '/admin/cs-managers/dashboard/all', query, body: undefined });
  return CSManagerDashboardSchema.parse(raw);
}

async function main() {
  const results: Result[] = [
    await run('ready-keys-parse', () => {
      const keys = readyKeys(' cs_completed_filter , Campaign_Sort,,');
      ok(keys.has('cs_completed_filter'), 'cs key');
      ok(keys.has('campaign_sort'), 'lowercased key');
      eq(keys.size, 2, 'empty entries dropped');
      eq(readyKeys(undefined).size, 0, 'unset env is empty');
    }),
    await run('no-range-unchanged', async () => {
      const all = await dashboard({ limit: 100 });
      ok(all.plans.length > 0, 'book has plans');
    }),
    await run('range-keeps-only-completed-inside', async () => {
      const res = await dashboard({ limit: 100, completed_from: day(20), completed_to: day(0) });
      ok(res.plans.length > 0, 'some plans completed in the last 20 days');
      for (const p of res.plans) {
        ok(p.payment_completed_at, `plan ${p.plan_id} has a completed date`);
        const d = format(new Date(p.payment_completed_at!), 'yyyy-MM-dd');
        ok(d >= day(20) && d <= day(0), `plan ${p.plan_id} completed ${d} inside range`);
      }
    }),
    await run('range-excludes-older', async () => {
      const res = await dashboard({ limit: 100, completed_from: day(20), completed_to: day(0) });
      const all = await dashboard({ limit: 100 });
      ok(res.plans.length < all.plans.length, 'range narrows the list');
    }),
    await run('single-day-inclusive', async () => {
      const res = await dashboard({ limit: 100, completed_from: day(2), completed_to: day(2) });
      ok(res.plans.length >= 1, 'plan completed 2 days ago is included');
    }),
    await run('chip-counts-follow-range', async () => {
      const res = await dashboard({ limit: 100, completed_from: day(20), completed_to: day(0) });
      const all = await dashboard({ limit: 100 });
      ok((res.filter_counts.all ?? 0) < (all.filter_counts.all ?? 0), 'all-chip count narrowed');
    }),
    await run('campaign-default-sends-nothing', () => {
      eq(Object.keys(campaignSortParams(parseCampaignSort(null))).length, 0, 'no params for default');
      eq(parseCampaignSort('bogus:asc'), 'created_at:desc', 'unknown sort falls back');
    }),
    await run('campaign-sort-params', () => {
      const p = campaignSortParams('name:asc');
      eq(p.sort_by, 'name', 'sort_by');
      eq(p.sort_dir, 'asc', 'sort_dir');
    }),
    await run('campaign-mock-sorts-whole-list', async () => {
      const list = async (q: Record<string, unknown>) =>
        (await dispatchMockRoute({ method: 'GET', path: '/admin/campaigns', query: { limit: 100, ...q }, body: undefined })) as {
          data: { name: string; start_date: string }[];
        };
      const asc = (await list({ sort_by: 'name', sort_dir: 'asc' })).data.map((c) => c.name.toLowerCase());
      ok(asc.length > 1, 'several campaigns');
      eq(JSON.stringify(asc), JSON.stringify([...asc].sort()), 'names ascending');
      const desc = (await list({ sort_by: 'name', sort_dir: 'desc' })).data.map((c) => c.name.toLowerCase());
      eq(JSON.stringify(desc), JSON.stringify([...asc].reverse()), 'names descending');
      const starts = (await list({ sort_by: 'start_date', sort_dir: 'asc' })).data.map((c) => c.start_date);
      eq(JSON.stringify(starts), JSON.stringify([...starts].sort()), 'start dates ascending');
    }),
    await run('course-rows-parse-with-stats', async () => {
      const res = (await dispatchMockRoute({ method: 'GET', path: '/admin/courses', query: { limit: 100 }, body: undefined })) as {
        data: unknown[];
      };
      // The pre-existing course mock omits some unrelated fields (cover_image…),
      // so only the new aggregate fields are checked against the schema here.
      const StatsSchema = CourseSchema.pick({
        id: true, enrolled_count: true, completed_count: true, in_progress_count: true,
        completion_rate_pct: true, avg_score_pct: true, pass_rate_pct: true, active_credentials_count: true,
      });
      const rows = res.data.map((r) => StatsSchema.parse(r));
      ok(rows.length > 0, 'courses listed');
      for (const r of rows) {
        eq(r.in_progress_count, (r.enrolled_count ?? 0) - (r.completed_count ?? 0), `in progress for ${r.id}`);
      }
      const untouched = rows.find((r) => r.enrolled_count === 0);
      ok(untouched, 'a course with no learners');
      eq(untouched!.completion_rate_pct, null, 'no learners: completion is null');
      eq(untouched!.pass_rate_pct, null, 'no learners: pass rate is null');
    }),
    await run('course-row-parses-without-stats', () => {
      const legacy = {
        id: 'x', title: 'T', slug: 't', summary: null, cover_image: null, status: 'draft', audience: 'realtor',
        estimated_minutes: 10, credential_validity_months: null, grants_credential: false, created_by: 'a', published_at: null,
      };
      const parsed = CourseSchema.parse(legacy);
      eq(parsed.enrolled_count, undefined, 'absent stays absent (shown as —)');
    }),
    await run('manager-periods-ignored-until-ready', () => {
      process.env.NEXT_PUBLIC_BACKEND_READY = '';
      const year = buildManagerDashboardPeriodFilter({ period: 'year', year: '2025' });
      eq(year.period_type, 'MONTH', 'year falls back to the month');
      eq(buildManagerDashboardPeriodFilter({ period: 'all_time' }).period_type, 'MONTH', 'all time falls back');
    }),
    await run('manager-periods-when-ready', () => {
      process.env.NEXT_PUBLIC_BACKEND_READY = 'manager_long_periods';
      const year = buildManagerDashboardPeriodFilter({ period: 'year', year: '2025' });
      eq(year.period_type, 'YEAR', 'year type');
      eq(year.year, 2025, 'year value');
      eq(year.month, undefined, 'no month for a year');
      eq(buildManagerDashboardPeriodFilter({ period: 'all_time' }).period_type, 'all_time', 'all time type');
      const custom = buildManagerDashboardPeriodFilter({ period: 'year', startDate: '2025-01-01', endDate: '2025-01-31' });
      eq(custom.period_type, 'CUSTOM', 'a custom range still wins');
      process.env.NEXT_PUBLIC_BACKEND_READY = '';
    }),
    await run('disputes-resolved-filter', async () => {
      const res = (await dispatchMockRoute({
        method: 'GET', path: '/admin/purchase-confirmations', query: { status: 'resolved', limit: 100 }, body: undefined,
      })) as { data: unknown[] };
      const rows = res.data.map((r) => AdminConfirmationRowSchema.parse(r));
      ok(rows.length > 0, 'a resolved record exists');
      for (const r of rows) {
        ok(r.disputes.some((d) => d.resolved_at), `${r.plan_id} has a resolved dispute`);
        ok(!r.disputes.some((d) => !d.resolved_at), `${r.plan_id} has no open dispute`);
        ok(r.disputes.some((d) => d.resolved_by?.name), `${r.plan_id} names the resolver`);
      }
      const counts = ConfirmationCountsSchema.parse(
        await dispatchMockRoute({ method: 'GET', path: '/admin/purchase-confirmations/counts', query: {}, body: undefined })
      );
      eq(counts.resolved, rows.length, 'resolved count matches the list');
    }),
    await run('disputes-today-shape-parses', () => {
      const counts = ConfirmationCountsSchema.parse({ waiting: 1, disputed: 2, confirmed: 3 });
      eq(counts.resolved, undefined, 'no resolved count today (card hidden)');
    }),
    await run('last-active-range', async () => {
      const list = async (q: Record<string, unknown>) =>
        ((await dispatchMockRoute({ method: 'GET', path: '/admin/allocation/eligible-clients', query: { limit: 100, ...q }, body: undefined })) as {
          data: unknown[];
        }).data.map((r) => AllocationClientSchema.parse(r));
      const all = await list({});
      ok(all.some((r) => r.last_active_at === null), 'some clients have no activity');
      ok(all.some((r) => r.last_active_at), 'some clients have activity');
      const from = new Date(Date.now() - 10 * 86_400_000).toISOString();
      const to = new Date().toISOString();
      const inRange = await list({ active_from: from, active_to: to });
      ok(inRange.length > 0 && inRange.length < all.length, 'range narrows');
      for (const r of inRange) ok(r.last_active_at && r.last_active_at >= from, `${r.payment_plan_id} seen in range`);
    }),
    await run('last-active-params-only-when-set', () => {
      const p = buildEligibleClientsParams({});
      eq(p.active_from, undefined, 'no active_from');
      eq(p.active_to, undefined, 'no active_to');
      eq(buildEligibleClientsParams({ activeFrom: '2026-11-01' }).active_from, '2026-11-01', 'sent when set');
    }),
    await run('agency-sales-inventory-stats-agree', async () => {
      const inventoryOf = async (agencyId: string) => {
        // The by-asset mock returns a bare array (the BE's unpaged shape).
        const raw = (await dispatchMockRoute({
          method: 'GET', path: '/admin/sales/analytics/by-asset', query: { agency_id: agencyId }, body: undefined,
        })) as unknown[] | { data: unknown[] };
        return (Array.isArray(raw) ? raw : raw.data).map((r) => AgencyInventoryRowSchema.parse(r));
      };
      const ids = ['665faaaa00000000000000a1', '665faaaa00000000000000a2', '665faaaa00000000000000a3'];
      let checked = 0;
      for (const agencyId of ids) {
        const sales = (await dispatchMockRoute({
          method: 'GET', path: '/admin/sales', query: { agency_id: agencyId, limit: 500 }, body: undefined,
        })) as { data: { agency: { id: string } | null }[] };
        ok(sales.data.every((r) => r.agency?.id === agencyId), `${agencyId}: only this agency's sales`);
        const inventory = await inventoryOf(agencyId);
        const stats = AgencyPerformanceSchema.parse(
          await dispatchMockRoute({ method: 'GET', path: `/admin/agencies/${agencyId}/stats`, query: {}, body: undefined })
        );
        eq(stats.sqm_sold, inventory.reduce((n, r) => n + r.sqm_sold, 0), `${agencyId}: stats sqm = inventory sqm`);
        eq(stats.sales_value, inventory.reduce((n, r) => n + r.expected_amount, 0), `${agencyId}: stats value = inventory value`);
        if (inventory.length > 0) checked += 1;
      }
      ok(checked > 0, 'at least one agency has eligible sales');
    }),
    await run('eligible-upgrades', async () => {
      // The BE requires `to_tier` and returns flat rows without it; the mapper
      // puts the asked-for tier back on.
      const list = async (toTier: EligibleUpgradeTier, q: Record<string, unknown> = {}) =>
        ((await dispatchMockRoute({ method: 'GET', path: '/admin/referrals/upgrades/eligible', query: { limit: 100, to_tier: toTier, ...q }, body: undefined })) as {
          data: unknown[];
        }).data.map((r) => toEligibleUpgrade(EligibleUpgradeApiRowSchema.parse(r), toTier));
      let rejected = false;
      try {
        await dispatchMockRoute({ method: 'GET', path: '/admin/referrals/upgrades/eligible', query: { limit: 10 }, body: undefined });
      } catch {
        rejected = true;
      }
      ok(rejected, 'a request without to_tier is rejected, as the BE does');
      // Pending and approved requests are left out, as the BE does; the seed has
      // no one left for `associate`, so the populated tier is `associate-pro`.
      ok((await list('associate')).length === 0, 'nobody left for associate (their request is already approved)');
      const pro = await list('associate-pro');
      ok(pro.length > 0, 'someone is eligible for associate-pro');
      ok(pro.every((r) => r.to_tier === 'associate-pro'), 'tier filter');
      ok(pro.every((r) => !r.upgrade_requested), 'no one with a pending request is listed');
      ok(pro.every((r) => ['guest', 'user', 'associate'].includes(r.user.referral_status)), 'allowed from-tiers only');
      const target = pro[0];
      await dispatchMockRoute({
        method: 'POST', path: `/admin/users/${target.user.id}/manual-upgrade`,
        query: {}, body: { to_tier: target.to_tier, reason: 'Completed the required course and passed its quiz.' },
      });
      const after = await list('associate-pro');
      ok(!after.some((r) => r.user.id === target.user.id), 'upgraded member drops off the list');
    }),
    await run('yearly-company-goals', async () => {
      const year = new Date().getFullYear();
      const dash = async () =>
        TrackerDashboardSchema.parse(
          await dispatchMockRoute({ method: 'GET', path: '/admin/associate-pro-tracker/dashboard', query: { year }, body: undefined })
        );
      await dispatchMockRoute({
        method: 'PUT', path: `/admin/associate-pro-tracker/goals/${year}`, query: {},
        body: { associate_pro_target: 100, revenue_target: 1000, unique_seller_target: 50 },
      });
      const goal = YearlyGoalSchema.parse(
        await dispatchMockRoute({ method: 'GET', path: `/admin/associate-pro-tracker/goals/${year}`, query: {}, body: undefined })
      );
      eq(goal.unique_seller_target, 50, 'seller target saved');
      eq(goal.financial_revenue_target, null, 'unset target stays null');
      const d = await dash();
      ok(d.company_goals, 'company goals reported');
      eq(d.company_goals!.unique_sellers.target, 50, 'seller target on dashboard');
      ok(d.company_goals!.unique_sellers.progress_pct !== null, 'progress with a target');
      eq(d.company_goals!.financial_revenue.progress_pct, null, 'no target: progress is null, not 0');
      ok(d.company_goals!.financial_revenue.actual !== null, 'actual still reported without a target');
    }),
    await run('yearly-goals-today-shape-parses', () => {
      const legacy = {
        year: 2025, associate_pro_target: 1, revenue_target: 2, notes: null, created_by: 'a',
        last_edited_by: null, created_at: '2025-01-01', updated_at: '2025-01-01',
      };
      eq(YearlyGoalSchema.parse(legacy).unique_seller_target, undefined, 'absent on today\'s BE');
    }),
  ];

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

void main();
