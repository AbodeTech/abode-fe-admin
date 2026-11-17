/**
 * Purchase confirmations page — filter URL params — verification.
 * Run: npx tsx scripts/purchase-confirmations-qa.ts
 *
 * The page shows Disputed when the URL has no status, so choosing "All" has to
 * keep `status=all` in the URL (it used to be deleted, which bounced the reader
 * back to Disputed). Product "all" is still the absent default.
 */
import {
  applyConfirmationFilter,
  DEFAULT_CONFIRMATION_STATUS,
} from '../features/purchase-confirmations/lib/filter-params';

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

/** What the page reads back from the URL. */
const statusShown = (params: URLSearchParams) => params.get('status') || DEFAULT_CONFIRMATION_STATUS;

const results: Result[] = [
  run('all-tab-sticks', () => {
    const next = applyConfirmationFilter(new URLSearchParams(), 'status', 'all');
    eq(next.get('status'), 'all', 'status param');
    eq(statusShown(next), 'all', 'status shown');
  }),
  run('disputed-is-default', () => {
    const next = applyConfirmationFilter(new URLSearchParams('status=all'), 'status', 'disputed');
    eq(next.has('status'), false, 'status param removed');
    eq(statusShown(next), 'disputed', 'status shown');
  }),
  run('waiting-and-confirmed-set', () => {
    for (const value of ['waiting', 'confirmed']) {
      const next = applyConfirmationFilter(new URLSearchParams(), 'status', value);
      eq(statusShown(next), value, `status shown for ${value}`);
    }
  }),
  run('product-all-is-absent', () => {
    const next = applyConfirmationFilter(new URLSearchParams('product=flex'), 'product', 'all');
    eq(next.has('product'), false, 'product param removed');
  }),
  run('empty-search-clears', () => {
    const next = applyConfirmationFilter(new URLSearchParams('q=ada'), 'q', '');
    eq(next.has('q'), false, 'q removed');
  }),
  run('filters-reset-page-keep-others', () => {
    const next = applyConfirmationFilter(new URLSearchParams('page=3&status=all&q=ada'), 'product', 'flex');
    eq(next.has('page'), false, 'page removed');
    eq(next.get('status'), 'all', 'status kept');
    eq(next.get('q'), 'ada', 'search kept');
    eq(next.get('product'), 'flex', 'product set');
  }),
];

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
