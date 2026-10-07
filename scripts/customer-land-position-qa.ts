/**
 * Customers tab — how one subscriber row becomes the design's
 * "Customer land position" row, including against the mock subscribers route.
 * Run: npx tsx scripts/customer-land-position-qa.ts
 */
import { z } from 'zod';

import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { assetSubscribersRoutes } from '../lib/mocks/routes/asset-subscribers';
import {
  SubscriberRowSchema,
  customerLandPosition,
} from '../features/assets/schemas/asset-subscribers.schema';

registerRoutes(assetRoutes);
registerRoutes(assetSubscribersRoutes);

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

const plan = (overrides: Partial<Parameters<typeof customerLandPosition>[0]> = {}) => ({
  plan_id: 'p1',
  asset_type: 'flex',
  status: 'active',
  is_defaulted: false,
  allocation_status: null,
  allocated_plots: [],
  allocation_events: [],
  ...overrides,
});

async function main() {
  const results: Result[] = [];

  results.push(
    await run('CP-purchase-state-follows-plan-status', () => {
      const state = (overrides: Parameters<typeof plan>[0]) => customerLandPosition(plan(overrides)).purchaseState;
      assert(state({}).label === 'Selling', 'an active plan is still selling');
      assert(state({ status: 'completed' }).label === 'Sold' && state({ status: 'completed' }).tone === 'good', 'a completed plan is sold');
      assert(state({ status: 'overdue' }).label === 'Overdue', 'an overdue plan says so');
      assert(state({ is_defaulted: true }).label === 'Defaulted' && state({ is_defaulted: true }).tone === 'bad', 'a defaulted plan is flagged');
      assert(state({ status: 'suspended' }).label === 'Suspended', 'a suspended plan says so');
    })
  );

  results.push(
    await run('CP-a-closed-plan-is-closed-even-if-it-was-in-default', () => {
      const position = customerLandPosition(plan({ status: 'closed', is_defaulted: true }));
      assert(position.purchaseState.label === 'Closed', `expected Closed, got ${position.purchaseState.label}`);
    })
  );

  results.push(
    await run('CP-live-plans-retain-land-and-ended-ones-are-not-guessed', () => {
      assert(customerLandPosition(plan({})).landTreatment === 'Retained', 'a live plan retains its land');
      assert(customerLandPosition(plan({ is_defaulted: true })).landTreatment === 'Retained', 'a defaulted plan still retains its land');
      assert(customerLandPosition(plan({ status: 'closed' })).landTreatment === 'Released', 'a closed plan releases its land');
      assert(customerLandPosition(plan({ status: 'cancelled' })).landTreatment === null, 'a cancelled plan must not be guessed');
    })
  );

  results.push(
    await run('CP-allocation-comes-from-the-plots-held-by-the-plan', () => {
      const mine = customerLandPosition(plan({ allocated_plots: ['A-12', 'A-13'] })).allocation;
      assert(Array.isArray(mine) && mine.join() === 'A-12,A-13', `expected both plots, got ${JSON.stringify(mine)}`);
      assert(customerLandPosition(plan({})).allocation === 'awaiting', 'a live plan with no plot is awaiting allocation');
    })
  );

  results.push(
    await run('CP-unmatched-allocation-is-not-reported-as-awaiting', () => {
      assert(customerLandPosition(plan({ allocation_status: 'allocated' })).allocation === null, 'allocated status without a current plot needs review');
      assert(customerLandPosition(plan({ status: 'closed' })).allocation === null, 'an ended plan is not awaiting anything');
    })
  );

  results.push(
    await run('CP-product-names', () => {
      assert(customerLandPosition(plan({ asset_type: 'developer_plot' })).product === 'Developer plot', 'the plan type with an underscore should read as Developer plot');
      assert(customerLandPosition(plan({ asset_type: 'full-ownership' })).product === 'Full ownership', 'full-ownership should read as Full ownership');
      assert(customerLandPosition(plan({ asset_type: null })).product === null, 'no plan type means no product, not a guess');
    })
  );

  results.push(
    await run('CP-the-mock-estate-renders-without-error', async () => {
      const get = (path: string, query: Record<string, unknown>) =>
        dispatchMockRoute({ method: 'GET', path, query, body: undefined });

      const subscribers = z
        .object({ data: z.array(SubscriberRowSchema) })
        .parse(await get(`/admin/assets/${A1}/subscribers`, { page: 1, limit: 25 }));
      for (const row of subscribers.data) {
        const position = customerLandPosition(row);
        assert(position.purchaseState.label.length > 0, 'every row should have a purchase state');
      }
      assert(subscribers.data.length > 0, 'the mock estate should have subscribers');
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
