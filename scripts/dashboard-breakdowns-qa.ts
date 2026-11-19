/**
 * Recruitment dashboard breakdown helpers — verification.
 * Run: npx tsx scripts/dashboard-breakdowns-qa.ts
 *
 * The backend returns `region` as one row per raw "LGA, State" string and
 * `referral` as one row per referrer username. Staging has a handful of rows;
 * production has hundreds, which is what broke the charts. These checks use
 * production-shaped input: totals must be preserved and the output bounded.
 */
import { groupRegionsByState, parseRegion, topWithRemainder } from '../features/recruitment/lib/dashboard-breakdowns';

type Result = { id: string; ok: boolean; error?: string };

function run(id: string, fn: () => void): Result {
  try {
    fn();
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

const sum = (rows: { value: number }[]) => rows.reduce((s, r) => s + r.value, 0);

const REGIONS = [
  { name: 'Mushin, Lagos State', value: 63 },
  { name: 'Ojo, Lagos State', value: 32 },
  { name: 'Ikorodu, Lagos State', value: 97 },
  { name: 'Atiba, Oyo State', value: 1 },
  { name: 'Oshimili South, Delta State', value: 5 },
  { name: 'Abuja Municipal, FCT', value: 191 },
  { name: 'Bwari, Federal Capital Territory', value: 9 },
  { name: 'Lagos State', value: 4 }, // no LGA
  { name: 'lagos  state', value: 1 }, // casing / spacing drift
  { name: 'Unknown', value: 7 },
];

const results: Result[] = [
  run('parseRegion splits LGA and state, dropping the "State" suffix', () => {
    const r = parseRegion('Oshimili South, Delta State');
    eq(r.state, 'Delta', 'state');
    eq(r.lga, 'Oshimili South', 'lga');
  }),
  run('parseRegion treats a comma-less value as a state with no LGA', () => {
    const r = parseRegion('Kano State');
    eq(r.state, 'Kano', 'state');
    eq(r.lga, null, 'lga');
  }),
  run('FCT spellings merge into one state', () => {
    const states = groupRegionsByState(REGIONS);
    const fct = states.filter((s) => s.name === 'FCT');
    eq(fct.length, 1, 'FCT rows');
    eq(fct[0].value, 200, 'FCT total');
  }),
  run('states are summed across LGAs and spelling drift', () => {
    const lagos = groupRegionsByState(REGIONS).find((s) => s.name === 'Lagos');
    eq(lagos?.value, 63 + 32 + 97 + 4 + 1, 'Lagos total');
    eq(lagos?.lgas[0].name, 'Ikorodu', 'biggest LGA first');
    eq(lagos?.lgas.length, 3, 'LGAs listed (rows with no LGA are not invented)');
  }),
  run('grouping preserves the grand total and sorts largest first', () => {
    const states = groupRegionsByState(REGIONS);
    eq(sum(states), sum(REGIONS), 'total');
    for (let i = 1; i < states.length; i++) {
      if (states[i - 1].value < states[i].value) throw new Error('not sorted descending');
    }
  }),
  run('hundreds of LGA rows collapse to at most 37 states + Unknown', () => {
    const states = Array.from({ length: 37 }, (_, i) => `State${i}`);
    const rows = Array.from({ length: 600 }, (_, i) => ({ name: `LGA${i}, ${states[i % 37]} State`, value: 1 + (i % 5) }));
    const grouped = groupRegionsByState(rows);
    eq(grouped.length, 37, 'states');
    eq(sum(grouped), sum(rows), 'total');
  }),
  run('topWithRemainder keeps the largest and accounts for the rest', () => {
    const rows = Array.from({ length: 700 }, (_, i) => ({ name: `user_${i}`, value: (i % 9) + 1 }));
    const r = topWithRemainder(rows, 10);
    eq(r.top.length, 10, 'top rows');
    eq(r.otherCount, 690, 'other count');
    eq(sum(r.top) + r.otherValue, sum(rows), 'total preserved');
    if (r.top[9].value < Math.max(...rows.slice(10).map((x) => x.value)) && r.top[9].value < 9) {
      throw new Error('top rows are not the largest');
    }
  }),
  run('topWithRemainder with fewer rows than the limit has no remainder', () => {
    const r = topWithRemainder([{ name: 'a', value: 2 }, { name: 'b', value: 5 }], 10);
    eq(r.top[0].name, 'b', 'sorted');
    eq(r.otherCount, 0, 'other count');
    eq(r.otherValue, 0, 'other value');
  }),
];

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) process.exit(1);
