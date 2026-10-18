/**
 * Asset Overview — per-product roll-up of the sqm ledger (`productPositions`,
 * `ledgerTotals`) and next-event selection (`nextAllocationEvent`).
 * Run: npx tsx scripts/product-position-qa.ts
 *
 * The first cases use rows shaped like the REAL backend's (a pool row plus a
 * size row per sized purchase, the same sqm moved through both); the last
 * runs the roll-up over the mock route's own response.
 */
import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { landConfigurationRoutes } from '../lib/mocks/routes/land-configuration';
import { sqmInventoryRoutes } from '../lib/mocks/routes/sqm-inventory';
import { nextAllocationEvent, type AssetAllocationEvent } from '../features/assets/schemas/allocation-event.schema';
import {
  SqmInventorySchema,
  ledgerTotals,
  lensFigures,
  productPositions,
  type SqmPosition,
} from '../features/assets/schemas/sqm-inventory.schema';

registerRoutes(assetRoutes);
registerRoutes(landConfigurationRoutes);
registerRoutes(sqmInventoryRoutes);

const A1 = '665faaaa00000000000000a1';

type Result = { id: string; ok: boolean };

async function run(id: string, fn: () => Promise<void> | void): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${(e as Error).message}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function position(overrides: Partial<SqmPosition>): SqmPosition {
  return {
    offer_type: 'flex',
    size_id: null,
    size_sqm: null,
    capacity_sqm: 0,
    selling_sqm: 0,
    sold_sqm: 0,
    released_sqm: 0,
    available_sqm: 0,
    defaulted_sqm: 0,
    suspended_sqm: 0,
    customers: 0,
    units: 0,
    purchase_snapshot_value: 0,
    operational_overlay: {
      system_allocated_plots: 0,
      system_allocated_sqm: 0,
      ground_confirmed_customers: 0,
      ground_confirmed_sqm: 0,
    },
    ...overrides,
  };
}

function event(overrides: Partial<AssetAllocationEvent>): AssetAllocationEvent {
  return {
    id: 'e',
    title: 'Event',
    date: '',
    time: '',
    starts_at: '2026-10-03T09:00:00.000Z',
    status: 'published',
    reserved_size: 0,
    remaining_capacity: null,
    ...overrides,
  };
}

async function main() {
  const results: Result[] = [];

  // A Flex pool of 126,000 with one 300 sqm size. 600 sqm is selling and 900
  // sold; the real ledger records that on BOTH rows. Live plans (units,
  // defaulted, allocated plots) hang off the size row only.
  const realShaped: SqmPosition[] = [
    position({ capacity_sqm: 126_000, selling_sqm: 600, sold_sqm: 900, available_sqm: 124_500 }),
    position({
      size_id: 's300',
      size_sqm: 300,
      capacity_sqm: 36_000,
      selling_sqm: 600,
      sold_sqm: 900,
      available_sqm: 34_500,
      defaulted_sqm: 300,
      customers: 5,
      units: 5,
      operational_overlay: {
        system_allocated_plots: 2,
        system_allocated_sqm: 600,
        ground_confirmed_customers: 0,
        ground_confirmed_sqm: 0,
      },
    }),
    // Developer Plot: pool row only, and its plans hang off that same row.
    position({
      offer_type: 'developer-plot',
      capacity_sqm: 48_000,
      sold_sqm: 3_000,
      available_sqm: 45_000,
      customers: 1,
      units: 1,
    }),
  ];

  results.push(
    await run('PP-pool-row-is-not-double-counted', () => {
      const flex = productPositions(realShaped).find((row) => row.offer_type === 'flex');
      assert(flex, 'expected a flex row');
      assert(flex.assigned_sqm === 126_000, `assigned should be the pool's 126,000, got ${flex.assigned_sqm}`);
      assert(flex.selling_sqm === 600, `selling should be 600, got ${flex.selling_sqm}`);
      assert(flex.sold_sqm === 900, `sold should be 900, got ${flex.sold_sqm}`);
      assert(flex.available_sqm === 124_500, `available should be 124,500, got ${flex.available_sqm}`);
    })
  );

  results.push(
    await run('PP-overlay-is-summed-across-rows', () => {
      const flex = productPositions(realShaped).find((row) => row.offer_type === 'flex');
      assert(flex, 'expected a flex row');
      assert(flex.units === 5 && flex.customers === 5, `units/customers should be 5/5, got ${flex.units}/${flex.customers}`);
      assert(flex.defaulted_sqm === 300, `defaulted should be 300, got ${flex.defaulted_sqm}`);
      assert(flex.allocated_sqm === 600 && flex.allocated_plots === 2, 'allocated should be 600 sqm over 2 plots');
    })
  );

  results.push(
    await run('PP-estate-totals-match-the-pools', () => {
      const totals = ledgerTotals(productPositions(realShaped));
      assert(totals.capacity_sqm === 174_000, `capacity should be 126,000 + 48,000, got ${totals.capacity_sqm}`);
      assert(totals.sold_sqm === 3_900, `sold should be 900 + 3,000, got ${totals.sold_sqm}`);
      assert(totals.selling_sqm === 600, `selling should be 600, got ${totals.selling_sqm}`);
      assert(
        totals.sold_sqm + totals.selling_sqm + totals.available_sqm === totals.capacity_sqm,
        'sold + selling + available should equal capacity'
      );
    })
  );

  results.push(
    await run('PP-size-rows-used-when-there-is-no-pool-row', () => {
      const [only] = productPositions([
        position({ size_id: 'a', capacity_sqm: 1_000, sold_sqm: 300, available_sqm: 700 }),
        position({ size_id: 'b', capacity_sqm: 2_000, sold_sqm: 500, available_sqm: 1_500 }),
      ]);
      assert(only.assigned_sqm === 3_000 && only.sold_sqm === 800, 'expected the two size rows summed');
    })
  );

  results.push(
    await run('PP-units-lens-divides-size-rows-by-their-size', () => {
      const units = lensFigures(realShaped, 'flex', () => 1);
      // 36,000 sqm of 300 sqm plots = 120 units; 900 sold = 3; 600 selling = 2.
      assert(units.assigned === 120, `assigned units should be 120, got ${units.assigned}`);
      assert(units.sold === 3 && units.selling === 2, `sold/selling should be 3/2, got ${units.sold}/${units.selling}`);
      assert(units.available === 115, `available units should be 115, got ${units.available}`);
      assert(units.defaulted === 1 && units.allocated === 2, 'defaulted/allocated should be 1/2');
    })
  );

  results.push(
    await run('PP-value-lens-prices-units-and-refuses-a-missing-price', () => {
      const value = lensFigures(realShaped, 'flex', () => 9_600_000);
      assert(value.sold === 3 * 9_600_000, `sold value should be 3 units at 9.6m, got ${value.sold}`);
      assert(value.assigned === 120 * 9_600_000, 'assigned value should be 120 units at 9.6m');
      const unpriced = lensFigures(realShaped, 'flex', () => null);
      assert(unpriced.assigned === null && unpriced.sold === null, 'a size with no price must give null, not a partial total');
    })
  );

  results.push(
    await run('PP-product-without-size-rows-has-no-unit-count', () => {
      const units = lensFigures(realShaped, 'developer-plot', () => 1);
      assert(units.assigned === null && units.sold === null, 'developer plot has no size rows to count');
    })
  );

  results.push(
    await run('PP-next-event-skips-closed-and-past', () => {
      const now = new Date('2026-10-01T00:00:00.000Z').getTime();
      const next = nextAllocationEvent(
        [
          event({ id: 'past', starts_at: '2026-09-16T09:00:00.000Z' }),
          event({ id: 'later', starts_at: '2026-11-01T09:00:00.000Z' }),
          event({ id: 'closed', starts_at: '2026-10-02T09:00:00.000Z', status: 'closed' }),
          event({ id: 'soonest', starts_at: '2026-10-03T09:00:00.000Z' }),
        ],
        now
      );
      assert(next?.id === 'soonest', `expected "soonest", got ${next?.id}`);
      assert(nextAllocationEvent([event({ id: 'past', starts_at: '2026-09-16T09:00:00.000Z' })], now) === null, 'expected null');
    })
  );

  results.push(
    await run('PP-mock-route-rolls-up', async () => {
      const raw = await dispatchMockRoute({ method: 'GET', path: `/admin/assets/${A1}/sqm-inventory`, query: {}, body: undefined });
      const inventory = SqmInventorySchema.parse(raw);
      const products = productPositions(inventory.positions);
      assert(new Set(products.map((row) => row.offer_type)).size === products.length, 'one row per product');
      for (const row of products) {
        assert(row.available_sqm <= row.assigned_sqm, `${row.offer_type}: available exceeds assigned`);
      }
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
