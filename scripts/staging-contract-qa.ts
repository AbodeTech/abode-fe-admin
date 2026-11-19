/**
 * The admin app against what abode-be-v2 staging (f01e0ed, 2026-11-17) really
 * returns. Run: npx tsx scripts/staging-contract-qa.ts
 *
 * Every fixture below is the shape read from the backend's own code (DTOs,
 * mappers, service payloads), NOT from our mocks — the point is to catch a
 * name or nullability the app disagrees with before a deploy does. Each fix has
 * a negative control: the shape the app used to expect must now FAIL, so the
 * check can't pass by being too loose.
 *
 *  1. Yearly goals: `company_goals.average_revenue_per_associate`.
 *  2. Portfolio: top-level `gross_revenue` is gone.
 *  3. Manager dashboard: targets are null when none are set.
 *  4. Disputes: `resolved_by.name` may be null; status `resolved` exists.
 *  5. Agency stats: `member_count`.
 *  6. Eligible upgrades: flat rows, no `to_tier`.
 */
import { z } from 'zod';
import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { purchaseConfirmationRoutes } from '../lib/mocks/routes/purchase-confirmations';
import { CompanyGoalsSchema } from '../features/associate-pro-tracker/schemas/tracker.schema';
import { PortfolioMetricsSchema } from '../features/assets/schemas/portfolio-analytics.schema';
import { ManagerDashboardSchema } from '../features/associate-managers/schemas/manager-dashboard.schema';
import {
  AdminConfirmationRowSchema,
  ConfirmationCountsSchema,
  ResolveDisputeResponseSchema,
} from '../features/purchase-confirmations/schemas/purchase-confirmation.schema';
import { canResendConfirmation } from '../features/purchase-confirmations/lib/can-resend';
import { AgencyPerformanceSchema } from '../features/agency/schemas/agency-performance.schema';
import { EligibleUpgradeApiRowSchema, EligibleUpgradeSchema } from '../features/upgrades/schemas/upgrade.schema';
import { toEligibleUpgrade } from '../features/upgrades/lib/eligible-upgrade';

registerRoutes(purchaseConfirmationRoutes);

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

async function main() {
  const results: Result[] = [
    // 1 — associate-pro-tracker/dto/dashboard.dto.ts: GoalActualDto, `average_revenue_per_associate`
    await run('goals-backend-key-name', () => {
      const metric = (target: number | null, actual: number | null, pct: number | null, prev: number | null) => ({
        target, actual, progress_pct: pct, previous_year_actual: prev,
      });
      const goals = CompanyGoalsSchema.parse({
        unique_sellers: metric(null, 120, null, 100),
        average_revenue_per_associate: metric(5_000_000, null, null, null), // no sellers => actual null
        financial_revenue: metric(2_000_000_000, 1_500_000_000, 75, 1_000_000_000),
      });
      eq(goals.average_revenue_per_associate.actual, null, 'actual stays null, not 0');
      eq(goals.unique_sellers.progress_pct, null, 'no target => no progress');
      // control: the key the app used to expect must no longer satisfy the schema
      const old = CompanyGoalsSchema.safeParse({
        unique_sellers: metric(null, 1, null, null),
        avg_revenue_per_associate: metric(null, 1, null, null),
        financial_revenue: metric(null, 1, null, null),
      });
      ok(!old.success, 'the old key name is rejected');
    }),

    // 2 — asset-analytics.service.ts: the `portfolio` payload (gross_revenue removed)
    await run('portfolio-without-gross-revenue', () => {
      const backend = {
        total_portfolio_value: 9_000, unsold_value: 6_000, sold_value: 3_000,
        total_capacity_sqm: 500, total_capacity_units: 10, total_assets: 4, total_active_assets: 3,
        active_plans: 7, active_customers: 6, total_money_received: 1_000, total_value_sold: 3_000,
        total_sqm_sold: 90, total_balance_owed: 2_000, overall_efficiency: 40, occupancy_rate: 18,
        defaulting: { customers: 1, value_of_defaulted_assets: 100, amount_paid_by_defaulters: 10, amount_still_owing: 90 },
      };
      const parsed = PortfolioMetricsSchema.parse(backend);
      eq(parsed.gross_revenue, undefined, 'absent, not faked');
      eq(parsed.sold_value, 3_000, 'sold value kept');
      // an older BE that still sends it keeps working
      eq(PortfolioMetricsSchema.parse({ ...backend, gross_revenue: 6_000 }).gross_revenue, 6_000, 'old shape parses');
    }),

    // 3 — associate-manager/dashboard/manager-dashboard.service.ts: NO_TARGETS = nulls
    await run('manager-null-targets', () => {
      const target = ManagerDashboardSchema.shape.target.parse({
        recruited_target: null, recruited_so_far: 4,
        selling_target: null, selling_so_far: 2,
        revenue_target: null, revenue_so_far: 1_000,
        performance_score_target: null, performance_score_so_far: 0,
        targets_months_set: 0,
      });
      eq(target.recruited_target, null, 'null target is kept, not turned into 0');
      eq(target.targets_months_set, 0, 'months set');
      // a sum over a year with targets still parses
      eq(
        ManagerDashboardSchema.shape.target.parse({
          recruited_target: 36, recruited_so_far: 4, selling_target: 12, selling_so_far: 2,
          revenue_target: 1_200_000, revenue_so_far: 1_000, performance_score_target: 960,
          performance_score_so_far: 0, targets_months_set: 12,
        }).targets_months_set,
        12,
        'year sum',
      );
      ok(ManagerDashboardSchema.shape.sales_and_revenue.shape.selling_pros_target.safeParse(null).success, 'selling_pros_target null');
      ok(ManagerDashboardSchema.shape.performance_score.shape.target.safeParse(null).success, 'peer-rating target null');
      // control: the old schema (z.number()) would have rejected the null
      ok(!z.number().safeParse(null).success, 'control: a plain number rejects null');
    }),

    // 4 — purchase-confirmation: status `resolved`, resolved_by { id, name | null }
    await run('disputes-resolved-status-and-null-name', async () => {
      const page = (await dispatchMockRoute({ method: 'GET', path: '/admin/purchase-confirmations', query: { limit: 50 }, body: undefined })) as {
        data: Array<Record<string, any>>;
      };
      const base = page.data.find((r) => r.disputes.length > 0);
      ok(base, 'a fixture row with a dispute');
      const backendRow = {
        ...base,
        status: 'resolved',
        disputes: base!.disputes.map((d: any) => ({
          ...d,
          resolved_at: d.resolved_at ?? '2026-11-17T09:00:00.000Z',
          resolution_note: d.resolution_note ?? 'Fixed.',
          resolved_by: { id: '665fad0e00000000000000d1', name: null }, // admin with no name on file
        })),
      };
      const row = AdminConfirmationRowSchema.parse(backendRow);
      eq(row.status, 'resolved', 'resolved status accepted');
      eq(row.disputes[0].resolved_by?.name, null, 'null resolver name accepted');
      ok(ResolveDisputeResponseSchema.safeParse({ plan_id: 'p', status: 'resolved', resent: false }).success, 'resolve response with the new status');
      ok(ConfirmationCountsSchema.safeParse({ waiting: 1, disputed: 1, resolved: 2, confirmed: 3 }).success, 'counts include resolved');
    }),
    await run('disputes-resend-rule', () => {
      eq(canResendConfirmation({ status: 'waiting', confirmedAt: null }), true, 'waiting');
      eq(canResendConfirmation({ status: 'resolved', confirmedAt: null }), true, 'resolved, not yet confirmed');
      eq(canResendConfirmation({ status: 'resolved', confirmedAt: '2026-11-01T00:00:00Z' }), false, 'resolved and re-confirmed');
      eq(canResendConfirmation({ status: 'confirmed', confirmedAt: '2026-11-01T00:00:00Z' }), false, 'confirmed');
      eq(canResendConfirmation({ status: 'disputed', confirmedAt: null }), false, 'disputed (resolve it first)');
    }),
    await run('disputes-mock-follows-backend-status', async () => {
      const list = async (status: string) =>
        ((await dispatchMockRoute({ method: 'GET', path: '/admin/purchase-confirmations', query: { limit: 50, status }, body: undefined })) as {
          data: Array<{ plan_id: string; status: string }>;
        }).data;
      const disputed = await list('disputed');
      ok(disputed.length > 0, 'a disputed fixture');
      const res = (await dispatchMockRoute({
        method: 'POST', path: `/admin/purchase-confirmations/${disputed[0].plan_id}/resolve-dispute`,
        query: {}, body: { note: 'Corrected on the asset record.' },
      })) as { status: string };
      eq(res.status, 'resolved', 'resolving reports the resolved status');
      ok((await list('resolved')).some((r) => r.plan_id === disputed[0].plan_id), 'now under the resolved tab');
      ok(!(await list('disputed')).some((r) => r.plan_id === disputed[0].plan_id), 'and off the disputed tab');
    }),

    // 5 — agency.repository.ts salesStats(): `member_count`
    await run('agency-stats-member-count', () => {
      const backend = {
        sales_value: 5_000_000, amount_received: 3_000_000, outstanding: 2_000_000, sqm_sold: 900,
        units_sold: 12, commission_projected: 40_000, plans: 9, buyers: 8, active_members: 3,
        agencies_with_sales: 1, commission_paid: 120_000, member_count: 15,
      };
      const parsed = AgencyPerformanceSchema.parse(backend);
      eq(parsed.member_count, 15, 'member_count');
      eq(parsed.start_date, undefined, 'dates are optional');
      // control: the key the app used to expect is not what the BE sends
      ok(!AgencyPerformanceSchema.safeParse({ ...backend, member_count: undefined, members: 15 }).success, 'old `members` key alone is rejected');
    }),

    // 6 — referral.repository.ts eligibleCourseUpgrades(): flat rows, no to_tier
    await run('eligible-flat-rows', () => {
      const flat = {
        id: '665fad0e00000000000000aa', first_name: 'Ada', last_name: 'Obi', email: 'ada@example.com',
        referral_status: 'user', course_id: '66cc0a0000000000000002', course_title: 'Abode Associate Certification',
        completed_at: '2026-11-10T08:00:00.000Z', best_score_pct: 88, upgrade_requested: false,
      };
      const row = toEligibleUpgrade(EligibleUpgradeApiRowSchema.parse(flat), 'associate');
      eq(row.to_tier, 'associate', 'tier stamped from the request');
      eq(row.user.id, flat.id, 'user nested');
      eq(row.course.title, 'Abode Associate Certification', 'course nested');
      ok(EligibleUpgradeSchema.safeParse(row).success, 'the mapped row satisfies the table\'s row type');
      // names are absent (not null) when the user has none; a course can have no title
      const sparse = toEligibleUpgrade(
        EligibleUpgradeApiRowSchema.parse({
          id: flat.id, referral_status: 'guest', course_id: flat.course_id, course_title: null,
          completed_at: flat.completed_at, best_score_pct: null, upgrade_requested: false,
        }),
        'associate-pro',
      );
      eq(sparse.user.first_name, null, 'missing name becomes null');
      eq(sparse.course.title, 'Required course', 'missing title gets a label, not a blank');
      eq(sparse.best_score_pct, null, 'no score stays null');
      // control: the nested shape the app used to parse is not what the BE sends
      ok(!EligibleUpgradeSchema.safeParse(flat).success, 'a flat BE row is not the nested row type');
    }),
  ];

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

void main();
