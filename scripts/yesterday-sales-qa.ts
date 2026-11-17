/**
 * Sales page "Yesterday's sales" card — verification of the only figures the
 * frontend works out itself. Run: npx tsx scripts/yesterday-sales-qa.ts
 *
 * Sold and collected come straight from GET /admin/sales/dashboard. The card
 * adds: the change against the day before, collected as a share of sold, and
 * the split by asset type. These checks pin each of those to the backend
 * totals they are derived from.
 */
import { compareDays, splitByType, summariseYesterday } from '../features/sales/lib/yesterday-sales';
import type { SalesDashboardResponse } from '../features/sales/schemas/sales.schema';

type Result = { id: string; ok: boolean; error?: string };

function run(id: string, fn: () => void): Result {
  try {
    fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${(e as Error).message}`);
    return { id, ok: false, error: (e as Error).message };
  }
}

function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

const card = (total: number, received = 0) => ({
  total,
  received,
  outstanding: total - received,
  received_percentage: total > 0 ? (received / total) * 100 : 0,
});

const day = (
  overall: [number, number],
  flex: number,
  fo: number,
  commercial: number
): SalesDashboardResponse => ({
  overall: card(overall[0], overall[1]),
  flex: card(flex),
  full_ownership: card(fo),
  commercial: card(commercial),
  as_of: '2026-11-10T08:00:00.000Z',
});

const results: Result[] = [
  run('sold and collected are the backend overall figures, untouched', () => {
    const s = summariseYesterday(day([12_000_000, 3_000_000], 7_000_000, 5_000_000, 0), undefined);
    eq(s.sold, 12_000_000, 'sold');
    eq(s.collected, 3_000_000, 'collected');
    eq(s.collectedShare, 25, 'collected share');
  }),
  run('change against the day before: amount, percent, direction', () => {
    const c = compareDays(12_000_000, 10_000_000);
    eq(c.amount, 2_000_000, 'amount');
    eq(c.percent, 20, 'percent');
    eq(c.direction, 'up', 'direction');
    eq(compareDays(5, 10).direction, 'down', 'down');
    eq(compareDays(10, 10).direction, 'flat', 'flat');
  }),
  run('no percent when the day before sold nothing', () => {
    eq(compareDays(4_000_000, 0).percent, null, 'percent');
  }),
  run('no comparison when the day before failed to load', () => {
    eq(summariseYesterday(day([1, 0], 1, 0, 0), undefined).change, null, 'change');
  }),
  run('split adds up to the overall figure', () => {
    const split = splitByType(day([12_000_000, 0], 7_000_000, 5_000_000, 0));
    eq(split.reduce((s, t) => s + t.value, 0), 12_000_000, 'value sum');
    eq(Math.round(split.reduce((s, t) => s + t.share, 0)), 100, 'share sum');
  }),
  run('types with no sales are left out of the split', () => {
    const split = splitByType(day([12_000_000, 0], 7_000_000, 5_000_000, 0));
    eq(split.some((t) => t.key === 'commercial'), false, 'commercial present');
  }),
  run('a gap between overall and the named types shows as Other', () => {
    const split = splitByType(day([10_000_000, 0], 6_000_000, 3_000_000, 0));
    const other = split.find((t) => t.key === 'other');
    eq(other?.value, 1_000_000, 'other value');
    eq(Math.round(split.reduce((s, t) => s + t.share, 0)), 100, 'share sum');
  }),
  run('a zero day: no share, empty split, no divide-by-zero', () => {
    const s = summariseYesterday(day([0, 0], 0, 0, 0), day([5_000_000, 0], 5_000_000, 0, 0));
    eq(s.collectedShare, null, 'collected share');
    eq(s.split.length, 0, 'split rows');
    eq(s.change?.direction, 'down', 'direction');
  }),
];

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
