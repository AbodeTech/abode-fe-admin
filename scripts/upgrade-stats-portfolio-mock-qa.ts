/**
 * Associate-upgrade stats and portfolio analytics — mock API verification.
 * Run: npx tsx scripts/upgrade-stats-portfolio-mock-qa.ts
 *
 * Two single routes that 404'd in mock mode:
 *   GET /admin/referrals/upgrades/stats    — the Associates Upgrade summary cards (their
 *                                            hook hides the strip on error, so it failed silently)
 *   GET /admin/assets/analytics/portfolio  — the banners above the assets list
 *
 * The stats must follow the table: for any filter, the cards and the list describe the same
 * rows. The portfolio must add up, leave developer plots out of every roll-up, and be
 * refused to a role without `view_asset_analytics`.
 */
import { PortfolioAnalyticsResponseSchema } from '../features/assets/schemas/portfolio-analytics.schema';
import { UpgradeStatsSchema } from '../features/upgrades/schemas/upgrade.schema';
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { authRoutes } from '../lib/mocks/routes/auth';
import { portfolioAnalyticsRoutes } from '../lib/mocks/routes/portfolio-analytics';
import { upgradeRoutes } from '../lib/mocks/routes/upgrades';

registerRoutes(authRoutes);
registerRoutes(upgradeRoutes);
registerRoutes(assetRoutes);
registerRoutes(portfolioAnalyticsRoutes);

const call = (method: string, path: string, query: Record<string, unknown> = {}, body?: unknown) =>
  dispatchMockRoute({ method, path, query, body });
const signIn = (email: string) => call('POST', '/auth/admin/login', {}, { email, password: 'password123' });

type Result = { id: string; ok: boolean };
type Paged = { data: unknown[]; meta: { total?: number } };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status) return;
    throw new Error(`expected ${status}, got ${e instanceof MockHttpError ? e.statusCode : (e as Error).message}`);
  }
  throw new Error(`expected ${status}, but the call succeeded`);
}

const stats = async (query: Record<string, unknown> = {}) => UpgradeStatsSchema.parse(await call('GET', '/admin/referrals/upgrades/stats', query));
const listTotal = async (query: Record<string, unknown> = {}) =>
  (((await call('GET', '/admin/referrals/upgrades', { ...query, page: 1, limit: 100 })) as Paged).meta.total) ?? 0;
const portfolio = async () => PortfolioAnalyticsResponseSchema.parse(await call('GET', '/admin/assets/analytics/portfolio'));

async function main() {
  const results: Result[] = [];
  const add = async (id: string, fn: () => Promise<void>) => results.push(await run(id, fn));

  /* ---------------- Finance: upgrade stats ---------------- */
  await signIn('as-finance_member@abode.ng');

  await add('FINANCE-stats-parse-and-add-up', async () => {
    const s = await stats();
    assert(s.total === 6, `six fixtures, got ${s.total}`);
    const counts = Object.values(s.by_status).reduce((sum, c) => sum + c.count, 0);
    assert(counts === s.total, 'status counts add up to the total');
    for (const method of Object.values(s.by_payment_method)) {
      assert(method.pending.count + method.approved.count + method.declined.count + method.cancelled.count === method.total, 'each payment method adds up too');
    }
    assert(s.by_payment_method.transfer.total + s.by_payment_method.paystack.total + s.by_payment_method['admin-manual'].total === s.total, 'methods add up to the total');
    assert(s.range.start_date === null && s.range.end_date === null, 'no range, no dates');
  });

  await add('FINANCE-money-is-what-was-paid-and-recorded-upgrades-add-no-money', async () => {
    const s = await stats();
    assert(s.by_status.pending.amount === 20_000 + 20_000 + 10_000, 'pending: two full fees and one net of its coupon');
    assert(s.by_status.approved.count === 2 && s.by_status.approved.amount === 20_000, 'the admin-recorded upgrade counts but adds no money');
    assert(s.approved_discounts.count === 0 && s.approved_discounts.amount === 0, 'the coupon one is still pending, so no approved discount yet');
  });

  await add('FINANCE-the-cards-follow-the-table', async () => {
    const queries: Record<string, unknown>[] = [
      {},
      { status: 'pending' },
      { status: 'approved' },
      { payment_method: 'transfer' },
      { to_tier: 'associate' },
      { search: 'okafor' },
      { search: 'nobody-by-this-name' },
      { status: 'pending', payment_method: 'transfer' },
    ];
    for (const q of queries) {
      const [s, total] = [await stats(q), await listTotal(q)];
      assert(s.total === total, `${JSON.stringify(q)}: cards say ${s.total}, table says ${total}`);
    }
    const pending = await stats({ status: 'pending' });
    assert(pending.by_status.approved.count === 0 && pending.by_status.pending.count === pending.total, 'a status filter zeroes the others');
  });

  await add('FINANCE-date-range-filters-both-and-is-echoed', async () => {
    const since = new Date(Date.now() - 5 * 86_400_000).toISOString();
    const recent = await stats({ start_date: since });
    assert(recent.total === 3 && recent.range.start_date === since, 'only the three pending requests are from the last five days');
    assert((await listTotal({ start_date: since })) === 3, 'and the table agrees');
    const old = await stats({ end_date: since });
    assert(old.total === 3, 'the other three are older');
    assert((await stats({ start_date: new Date(Date.now() + 86_400_000).toISOString() })).total === 0, 'nothing in the future');
  });

  /* ---------------- Portfolio ---------------- */
  await signIn('as-developer@abode.ng');

  await add('DEVELOPER-portfolio-parses-and-adds-up', async () => {
    const p = await portfolio();
    assert(p.categories.length === 4, 'all four categories, always');
    const dev = p.categories.find((c) => c.category === 'developer_plot')!;
    assert(dev.excluded_from_rollup && p.categories.filter((c) => c.excluded_from_rollup).length === 1, 'only developer plots are excluded');

    const rolled = p.categories.filter((c) => !c.excluded_from_rollup);
    const sum = (pick: (c: (typeof rolled)[number]) => number) => rolled.reduce((total, c) => total + pick(c), 0);
    assert(p.portfolio.total_value_sold === sum((c) => c.value_sold), 'value sold rolls up');
    assert(p.portfolio.total_money_received === sum((c) => c.money_received) && p.portfolio.gross_revenue === p.portfolio.total_money_received, 'money received rolls up');
    assert(p.portfolio.total_balance_owed === p.portfolio.total_value_sold - p.portfolio.total_money_received, 'balance = sold - received');
    assert(p.portfolio.total_capacity_sqm === sum((c) => c.total_capacity_sqm) && p.portfolio.total_sqm_sold === sum((c) => c.sqm_sold), 'capacity and sqm roll up');
    assert(p.portfolio.overall_efficiency > 0 && p.portfolio.overall_efficiency <= 100 && p.portfolio.occupancy_rate > 0 && p.portfolio.occupancy_rate <= 100, 'rates are percentages');
    for (const c of p.categories) {
      assert(c.balance_owed === c.value_sold - c.money_received && c.defaulting.amount_still_owing === c.defaulting.value_of_defaulted_assets - c.defaulting.amount_paid_by_defaulters, `${c.category}: balances reconcile`);
    }
    assert(dev.value_sold === 0 && dev.total_assets === 0, 'no developer-plot product in the fixtures, so a real zero');
  });

  await add('DEVELOPER-summary-and-details-match-the-asset-list', async () => {
    const p = await portfolio();
    const list = (await call('GET', '/admin/assets', { page: 1, limit: 100 })) as Paged;
    assert(p.summary.total_assets === list.meta.total && p.asset_details.length === list.meta.total, `${list.meta.total} live assets, the soft-deleted one left out`);
    assert(!p.asset_details.some((a) => a.name === 'Old Mill Estate'), 'the soft-deleted estate is not counted');
    assert(p.summary.total_flex_assets >= 1 && p.summary.total_full_ownership_assets >= 1 && p.summary.total_commercial_assets >= 1, 'every product line has an estate');
    assert(p.summary.total_worth === p.summary.total_flex_worth + p.summary.total_full_ownership_worth + p.summary.total_commercial_worth + p.summary.total_developer_plot_worth, 'worth adds up across products');
    const aviation = p.asset_details.find((a) => a.name === 'Aviation City')!;
    assert(aviation.available_sizes.length > 0 && aviation.min_price !== null && aviation.min_price <= aviation.max_price!, 'sizes sorted, price range ordered');
    assert(aviation.available_sizes.every((s, i, all) => i === 0 || s > all[i - 1]), 'sizes ascend and are distinct');
  });

  /* ---------------- Support: no figure it must not see ---------------- */
  await signIn('as-cs_manager@abode.ng');
  await add('SUPPORT-portfolio-money-is-refused', async () => {
    await expectError(() => call('GET', '/admin/assets/analytics/portfolio'), 403);
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

void main();
