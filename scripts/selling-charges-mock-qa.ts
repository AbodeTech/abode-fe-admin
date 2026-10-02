/**
 * Selling charges — mock route and schema, against the contract abode-be-v2
 * has served since commit 0f042ef (in_force / scheduled / latest_version,
 * `is_latest`, and `expected_version` on the PUT).
 * Run: npx tsx scripts/selling-charges-mock-qa.ts
 */
import { z } from 'zod';

import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { sellingChargesRoutes } from '../lib/mocks/routes/selling-charges';
import {
  SellingChargesHistoryEntrySchema,
  SellingChargesSchema,
  SetSellingChargesResultSchema,
  latestSellingChargeVersion,
} from '../features/assets/schemas/selling-charges.schema';

registerRoutes(assetRoutes);
registerRoutes(sellingChargesRoutes);

const A1 = '665faaaa00000000000000a1';
const PATH = `/admin/assets/${A1}/selling-charges`;

type Result = { id: string; ok: boolean };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const get = async () => SellingChargesSchema.parse(await dispatchMockRoute({ method: 'GET', path: PATH, query: {}, body: undefined }));
const put = async (body: unknown) =>
  SetSellingChargesResultSchema.parse(await dispatchMockRoute({ method: 'PUT', path: PATH, query: {}, body }));

const line = (amount: number) => ({ charge_type: 'land_price', label: 'Land price', amount, basis: 'per_unit' });

async function main() {
  const results: Result[] = [];

  results.push(
    await run('SC-empty-estate-parses', async () => {
      const state = await get();
      assert(state.in_force === null && state.scheduled.length === 0, 'expected nothing in force or scheduled');
      assert(state.latest_version === 0, `expected latest_version 0, got ${state.latest_version}`);
      assert(latestSellingChargeVersion(state) === null, 'expected no version to seed the editor from');
    })
  );

  results.push(
    await run('SC-first-version-goes-in-force', async () => {
      const saved = await put({ expected_version: 0, charges: [line(9_600_000)], effective_date: '2026-01-01', reason: 'First list' });
      assert(saved.version === 1 && saved.starts_in_future === false, 'expected version 1, in force now');
      const state = await get();
      assert(state.in_force?.version === 1, 'expected version 1 in force');
      assert(state.latest_version === 1, 'expected latest_version 1');
    })
  );

  results.push(
    await run('SC-stale-save-is-refused', async () => {
      let status = 0;
      try {
        await put({ expected_version: 0, charges: [line(1)], effective_date: '2026-01-02', reason: 'Stale' });
      } catch (e) {
        status = e instanceof MockHttpError ? e.statusCode : -1;
      }
      assert(status === 409, `expected a 409 for a stale expected_version, got ${status}`);
      assert((await get()).latest_version === 1, 'a refused save must not create a version');
    })
  );

  results.push(
    await run('SC-future-version-is-scheduled-not-in-force', async () => {
      const saved = await put({ expected_version: 1, charges: [line(10_200_000)], effective_date: '2099-01-01', reason: 'Next year' });
      assert(saved.version === 2 && saved.starts_in_future === true, 'expected version 2, scheduled');
      const state = await get();
      assert(state.in_force?.version === 1, 'version 1 should still be in force');
      assert(state.scheduled.length === 1 && state.scheduled[0].version === 2, 'version 2 should be scheduled');
      assert(state.latest_version === 2, 'expected latest_version 2');
      assert(latestSellingChargeVersion(state)?.version === 2, 'the editor should start from version 2');
    })
  );

  results.push(
    await run('SC-history-lists-every-version', async () => {
      const raw = await dispatchMockRoute({ method: 'GET', path: `${PATH}/history`, query: {}, body: undefined });
      const history = z.array(SellingChargesHistoryEntrySchema).parse(raw);
      assert(history.length === 2, `expected 2 versions, got ${history.length}`);
      assert(history[0].is_latest === false && history[1].is_latest === true, 'only the newest is latest');
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
