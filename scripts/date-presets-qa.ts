/**
 * Shared DateFilter presets — verification.
 * Run: npx tsx scripts/date-presets-qa.ts
 *
 * Today / Yesterday are opt-in (only Sales turns them on, for the "yesterday's sales"
 * view). "All year" is opt-in through `showYearOption` and only
 * Top Associates turns it on. Every preset must be an inclusive local-day
 * range, and a URL range must map back to the preset that produced it
 * (otherwise the select shows "Custom range" for a preset click).
 */
import { format } from 'date-fns';
import { BASE_PRESETS, matchPreset, presetBounds, presetsFor } from '../components/shared/date-presets';

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

const day = (d: Date) => format(d, 'yyyy-MM-dd');
// Mid-afternoon so no preset depends on the time of day.
const NOW = new Date(2026, 10, 9, 15, 30);
const NEW_YEAR = new Date(2026, 0, 1, 9, 0);

const results: Result[] = [
  run('today is a single day: today', () => {
    const r = presetBounds('today', NOW);
    eq(day(r.from), '2026-11-09', 'from');
    eq(day(r.to), '2026-11-09', 'to');
  }),
  run('yesterday is a single day: yesterday', () => {
    const r = presetBounds('yesterday', NOW);
    eq(day(r.from), '2026-11-08', 'from');
    eq(day(r.to), '2026-11-08', 'to');
  }),
  run('yesterday crosses a year boundary on 1 Jan', () => {
    eq(day(presetBounds('yesterday', NEW_YEAR).from), '2025-12-31', 'from');
  }),
  run('all year runs 1 Jan to today', () => {
    const r = presetBounds('year', NOW);
    eq(day(r.from), '2026-01-01', 'from');
    eq(day(r.to), '2026-11-09', 'to');
  }),
  run('existing presets unchanged (7 days / 2 weeks / 4 weeks end today)', () => {
    eq(day(presetBounds('7days', NOW).from), '2026-11-02', '7days from');
    eq(day(presetBounds('2weeks', NOW).from), '2026-10-26', '2weeks from');
    eq(day(presetBounds('4weeks', NOW).from), '2026-10-12', '4weeks from');
    eq(day(presetBounds('4weeks', NOW).to), '2026-11-09', '4weeks to');
  }),
  run('pages get only the three base presets unless they opt in', () => {
    eq(presetsFor().join(','), BASE_PRESETS.join(','), 'default list');
    eq(presetsFor().join(','), '7days,2weeks,4weeks', 'base unchanged from before');
  }),
  run('Sales flag adds Today and Yesterday only', () => {
    eq(presetsFor({ showDayOptions: true }).join(','), 'today,yesterday,7days,2weeks,4weeks', 'sales list');
  }),
  run('Top Associates flag adds All year only', () => {
    eq(presetsFor({ showYearOption: true }).join(','), '7days,2weeks,4weeks,year', 'top associates list');
  }),
  run('a Yesterday URL on a page without day options reads as custom', () => {
    const r = presetBounds('yesterday', NOW);
    eq(matchPreset(r.from, r.to, presetsFor(), NOW), 'custom', 'match');
  }),
  run('every offered preset round-trips through matchPreset', () => {
    const presets = presetsFor({ showDayOptions: true, showYearOption: true });
    for (const option of presets) {
      const r = presetBounds(option, NOW);
      eq(matchPreset(r.from, r.to, presets, NOW), option, option);
    }
  }),
  run('an "All year" URL on a page without that option reads as custom', () => {
    const r = presetBounds('year', NOW);
    eq(matchPreset(r.from, r.to, presetsFor(), NOW), 'custom', 'match');
  }),
  run('on 1 Jan "All year" and "Today" are the same range — Today wins', () => {
    const r = presetBounds('year', NEW_YEAR);
    eq(matchPreset(r.from, r.to, presetsFor({ showDayOptions: true, showYearOption: true }), NEW_YEAR), 'today', 'match');
  }),
  run('an arbitrary range is custom', () => {
    eq(matchPreset(new Date(2026, 9, 3), new Date(2026, 9, 20), presetsFor({ showDayOptions: true, showYearOption: true }), NOW), 'custom', 'match');
  }),
];

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
