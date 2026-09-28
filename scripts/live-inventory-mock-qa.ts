/**
 * Live Inventory / Plot Allocation foundation slice — mock API smoke test.
 * Run: npx tsx scripts/live-inventory-mock-qa.ts
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { landConfigurationRoutes } from '../lib/mocks/routes/land-configuration';
import { companyEventsRoutes } from '../lib/mocks/routes/company-events';
import { inventoryReconciliationRoutes } from '../lib/mocks/routes/inventory-reconciliation';

registerRoutes(assetRoutes);
registerRoutes(landConfigurationRoutes);
registerRoutes(companyEventsRoutes);
registerRoutes(inventoryReconciliationRoutes);

const A1 = '665faaaa00000000000000a1'; // Aviation City — has blocks/plots and seeded land-use rows
const A2 = '665faaaa00000000000000a2'; // Harmony Gardens — no blocks at all, the honest empty case

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
    await run('LI-land-configuration-seeded', async () => {
      // The real `AssetLandUseSchema` is `{id, category, label, allocated_sqm}`
      // only — no `source`/`updated_at` field exists anywhere on the real
      // Land Configuration model (confirmed against `LandConfigurationService`
      // directly). The old version of this test checked fields from a
      // pre-real-backend, provisional shape that no longer exists.
      const r: any = await call('GET', `/admin/assets/${A1}/land-configuration`);
      assert(r.non_saleable.length === 4, `expected 4 seeded non-saleable rows, got ${r.non_saleable.length}`);
      assert(r.non_saleable[0]?.category === 'road-circulation', 'expected the first seeded row to be road-circulation');
      assert(r.non_saleable[0]?.label === 'Internal roads', 'expected the first seeded row to be labelled "Internal roads"');
      assert(r.version === 2, `expected the seeded land account at version 2, got ${r.version}`);
      assert(r.non_saleable_sqm === 40_000 + 3_270 + 12_000 + 13_500, `unexpected non_saleable_sqm ${r.non_saleable_sqm}`);
    })
  );

  results.push(
    await run('LI-land-use-roundtrip-and-history-diff', async () => {
      const before: any = await call('GET', `/admin/assets/${A1}/land-configuration`);
      const targetRowId = before.non_saleable[0].id;

      // `products` (not `product_pools`) and `non_saleable[].land_use_id` (not
      // `_id`) match the real `ReplaceLandConfigurationDto` exactly — the old
      // version of this test used both wrong field names, which is why it
      // never actually exercised a real round-trip.
      const after: any = await call('PUT', `/admin/assets/${A1}/land-configuration`, {}, {
        expected_version: before.version,
        reason: 'QA: update a label',
        total_land_sqm: before.total_land_sqm,
        products: before.products.map((p: any) => ({ offer_type: p.offer_type, assigned_sqm: p.assigned_sqm })),
        non_saleable: before.non_saleable.map((row: any) => ({
          land_use_id: row.id,
          category: row.category,
          label: row.id === targetRowId ? 'QA updated label' : row.label,
          allocated_sqm: row.allocated_sqm,
        })),
      });

      const updatedRow = after.non_saleable.find((row: any) => row.id === targetRowId);
      assert(updatedRow?.label === 'QA updated label', 'label did not round-trip through PUT');
      assert(after.version === before.version + 1, 'version did not advance after a save');

      const history: any = await call('GET', `/admin/assets/${A1}/land-configuration/history`);
      assert(history.data[0].version === after.version, 'history is not sorted newest-first after the save');
    })
  );

  results.push(
    await run('LI-plots-list-totals-consistent-a1', async () => {
      // Confirmed REAL against abode-be-v2 staging's field-staff module — see
      // plot-inventory.schema.ts's header. One response carries the list AND
      // both totals; there is no separate `/plots/summary` endpoint on the
      // real backend (that was this app's own earlier invention).
      const list: any = await call('GET', `/admin/assets/${A1}/plots`, { limit: 50 });
      assert(list.data.plots.length === 9, `expected 9 plots, got ${list.data.plots.length}`);
      assert(list.meta.total === 9, `expected meta.total 9, got ${list.meta.total}`);

      const totals = list.data.totals;
      assert(totals.plots === 9, `expected totals.plots 9, got ${totals.plots}`);
      assert(totals.allocated === 1, `expected totals.allocated 1, got ${totals.allocated}`);
      assert(totals.plots - totals.allocated === 8, `expected 8 available, got ${totals.plots - totals.allocated}`);
      assert(totals.sqm === 6 * 500 + 3 * 300, `unexpected totals.sqm ${totals.sqm}`);
      assert(JSON.stringify(list.data.filtered_totals) === JSON.stringify(totals), 'unfiltered totals and filtered_totals should match when no filter is applied');
    })
  );

  results.push(
    await run('LI-plots-empty-asset-a2', async () => {
      const list: any = await call('GET', `/admin/assets/${A2}/plots`);
      assert(list.data.plots.length === 0, 'expected an empty plot list for an asset with no blocks');
      assert(
        list.data.totals.plots === 0 && list.data.totals.allocated === 0 && list.data.totals.sqm === 0,
        'expected an all-zero totals block for an asset with no blocks'
      );
    })
  );

  results.push(
    await run('LI-plots-filter-status', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/plots`, { status: 'allocated' });
      assert(r.data.plots.length === 1, `expected exactly 1 allocated plot, got ${r.data.plots.length}`);
      assert(r.data.plots[0].commercial_status === 'allocated', 'filtered row is not allocated');
    })
  );

  results.push(
    await run('LI-plots-filter-search', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/plots`, { search: 'A-1' });
      assert(
        r.data.plots.length === 1 && r.data.plots[0].label === 'A-1',
        `search "A-1" returned unexpected rows: ${JSON.stringify(r.data.plots)}`
      );
    })
  );

  results.push(
    await run('LI-plots-filter-block', async () => {
      // Real `ListPlotsDto.block` matches the block LABEL exactly, not an id,
      // and has no min/max range concept — `size` (also exact) is the only
      // numeric filter the real endpoint supports.
      const r: any = await call('GET', `/admin/assets/${A1}/plots`, { block: 'A' });
      assert(
        r.data.plots.length === 6 && r.data.plots.every((p: any) => p.block === 'A' && p.size_sqm === 500),
        `block=A should return the 6 500sqm plots in Block A, got ${r.data.plots.length}`
      );
    })
  );

  results.push(
    await run('LI-plots-filter-size-exact', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/plots`, { size: 300 });
      assert(
        r.data.plots.length === 3 && r.data.plots.every((p: any) => p.size_sqm === 300),
        `size=300 should return the 3 300sqm plots, got ${r.data.plots.length}`
      );
    })
  );

  results.push(
    await run('LI-blocks-list', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/blocks`);
      assert(Array.isArray(r) && r.length === 2, `expected 2 blocks, got ${r?.length}`);
    })
  );

  results.push(
    await run('LI-company-events-asset-filter', async () => {
      const all: any = await call('GET', '/admin/company-events', { limit: 50 });
      const seededAssetId = all.data[0]?.asset_id;
      assert(seededAssetId, 'no seeded company events to test asset_id filtering against');

      const filtered: any = await call('GET', '/admin/company-events', { asset_id: seededAssetId, limit: 50 });
      assert(filtered.data.length > 0, 'asset_id filter returned no events');
      assert(
        filtered.data.every((e: any) => e.asset_id === seededAssetId),
        "asset_id filter leaked another asset's events"
      );

      const excluded: any = await call('GET', '/admin/company-events', { asset_id: 'not-a-real-asset-id', limit: 50 });
      assert(excluded.data.length === 0, 'an unrelated asset_id should return zero events');
    })
  );

  results.push(
    await run('LI-plots-field-ops-fields-present', async () => {
      // The real endpoint carries field-ops readiness, never a buyer name or
      // sale value (that commercial detail lives on the Performance tab) —
      // see plot-inventory.schema.ts's header for why this replaced the old
      // customer_name/attributable_value assertion.
      const r: any = await call('GET', `/admin/assets/${A1}/plots`, { status: 'allocated' });
      const plot = r.data.plots[0];
      assert(typeof plot?.parcelled === 'boolean', 'plot row missing parcelled');
      assert(typeof plot?.clearing_percent === 'number', 'plot row missing clearing_percent');
      assert(typeof plot?.allocation_ready === 'boolean', 'plot row missing allocation_ready');
      assert(typeof plot?.field_events === 'number', 'plot row missing field_events');
      assert(!('customer_name' in plot), 'the real endpoint has no customer_name — this app must not invent one');
    })
  );

  results.push(
    await run('LI-reconciliation-a1-exceptions', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/inventory-reconciliation`);
      assert(Array.isArray(r.rows) && r.rows.length > 0, 'expected reconciliation rows for Aviation City');

      const size500 = r.rows.find((row: any) => row.size === 500);
      assert(size500?.physical, 'size 500 should have physical data (Block A)');
      assert(size500?.commercial, 'size 500 should have commercial data (analytics)');
      assert(size500.physical.allocated_count === 1, `expected 1 allocated at size 500, got ${size500.physical.allocated_count}`);
      assert(
        size500.commercial.units_sold > size500.physical.allocated_count,
        'expected the seeded commercial units_sold to exceed physical allocated_count at size 500'
      );
      assert(
        size500.exceptions.some((e: any) => e.code === 'OVERSOLD'),
        `expected an over-sold exception at size 500, got ${JSON.stringify(size500.exceptions)}`
      );

      const holder = size500.physical.allocated_holders[0];
      assert(holder?.customer_name && typeof holder.attributable_value === 'number', 'allocated_holders row missing customer/value');
    })
  );

  results.push(
    await run('LI-reconciliation-estate-totals-sum-rows', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/inventory-reconciliation`);
      const expectedPhysicalPlots = r.rows.reduce(
        (sum: number, row: any) => sum + (row.physical ? row.physical.allocated_count + row.physical.available_count : 0),
        0
      );
      const expectedExceptions = r.rows.reduce((sum: number, row: any) => sum + row.exceptions.length, 0);
      assert(
        r.estate_totals.physical_plot_count === expectedPhysicalPlots,
        `estate_totals.physical_plot_count (${r.estate_totals.physical_plot_count}) should sum the per-size rows (${expectedPhysicalPlots})`
      );
      assert(
        r.estate_totals.exception_count === expectedExceptions,
        `estate_totals.exception_count (${r.estate_totals.exception_count}) should sum the per-size rows (${expectedExceptions})`
      );
      assert(r.estate_totals.exception_count > 0, 'expected at least one exception across Aviation City given the known over-sold row');
    })
  );

  results.push(
    await run('LI-reconciliation-a2-no-physical-plots', async () => {
      const r: any = await call('GET', `/admin/assets/${A2}/inventory-reconciliation`);
      assert(r.warnings.some((w: string) => w.toLowerCase().includes('no blocks')), 'expected a no-blocks warning for Harmony Gardens');

      const commercialOnlyRow = r.rows.find((row: any) => row.commercial && !row.physical);
      assert(commercialOnlyRow, 'expected at least one size with commercial data but no physical plots');
      assert(
        commercialOnlyRow.exceptions.some((e: any) => e.code === 'NO_PHYSICAL_PLOTS'),
        `expected the no-physical-plots exception, got ${JSON.stringify(commercialOnlyRow.exceptions)}`
      );
    })
  );

  const pass = results.filter((r) => r.ok).length;
  console.log(`\nLive Inventory mock QA: ${pass}/${results.length} passed`);
  if (pass !== results.length) process.exit(1);
}

main();
