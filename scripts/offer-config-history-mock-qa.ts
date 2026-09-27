/**
 * Offer configuration history (activity log) — mock API smoke test.
 * Run: npx tsx scripts/offer-config-history-mock-qa.ts
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';

registerRoutes(assetRoutes);

const A1 = '665faaaa00000000000000a1'; // Aviation City

async function call(method: string, path: string, query: Record<string, unknown> = {}, body?: unknown) {
  return dispatchMockRoute({ method, path, query, body });
}

type Result = { id: string; ok: boolean; error?: string };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false, error: msg };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const results: Result[] = [];

  results.push(
    await run('OCH-empty-before-any-write', async () => {
      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      assert(history.data.length === 0, `expected no history before any mutation, got ${history.data.length}`);
    })
  );

  let sizeId = '';
  let offerType = '';

  results.push(
    await run('OCH-add-size-recorded', async () => {
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      offerType = asset.offers[0].offer_type;

      const size: any = await call('POST', `/admin/assets/${A1}/offers/${offerType}/sizes`, {}, {
        size_sqm: 999,
        configured_units: 1,
        plans: [{ tenor_months: 0, land_price: 1_000_000, initial_payment: 1_000_000, monthly_installment: 0 }],
      });
      sizeId = size._id;

      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      assert(history.data.length === 1, `expected exactly 1 history entry after one write, got ${history.data.length}`);
      assert(history.data[0].action === 'add-size', `expected action 'add-size', got ${history.data[0].action}`);
      assert(history.data[0].summary.includes('999'), `expected the summary to mention the new size, got "${history.data[0].summary}"`);
      assert(history.data[0].changed_by, 'history entry missing changed_by');
      assert(history.data[0].version === 1, `expected the first entry to be version 1, got ${history.data[0].version}`);
    })
  );

  results.push(
    await run('OCH-plan-patch-does-not-log-a-noop', async () => {
      // is_active already true — PATCH with the same value should record nothing.
      await call('PATCH', `/admin/assets/${A1}/offers/${offerType}/sizes/${sizeId}`, {}, { is_active: true });
      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      assert(history.data.length === 1, `a no-op PATCH should not append a history entry, got ${history.data.length} entries`);
    })
  );

  results.push(
    await run('OCH-add-plan-and-delete-size-recorded-newest-first', async () => {
      await call('POST', `/admin/assets/${A1}/offers/${offerType}/sizes/${sizeId}/plans`, {}, {
        tenor_months: 6,
        land_price: 1_000_000,
        initial_payment: 300_000,
        monthly_installment: 140_000,
      });
      await call('DELETE', `/admin/assets/${A1}/offers/${offerType}/sizes/${sizeId}`);

      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      assert(history.data.length === 3, `expected 3 history entries total, got ${history.data.length}`);
      assert(history.data[0].action === 'delete-size', `expected the newest entry to be delete-size, got ${history.data[0].action}`);
      assert(history.data[1].action === 'add-plan', `expected the middle entry to be add-plan, got ${history.data[1].action}`);
      assert(
        history.data[0].version > history.data[1].version && history.data[1].version > history.data[2].version,
        'history is not sorted newest-first'
      );
    })
  );

  const pass = results.filter((r) => r.ok).length;
  console.log(`\nOffer configuration history mock QA: ${pass}/${results.length} passed`);
  if (pass !== results.length) process.exit(1);
}

main();
