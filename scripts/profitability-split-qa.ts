/**
 * Performance tab — the direct / shared cost split behind "Profitability by
 * product" (`costSplitByProduct`), including against the mock drill-down.
 * Run: npx tsx scripts/profitability-split-qa.ts
 */
import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { assetAnalyticsRoutes } from '../lib/mocks/routes/asset-analytics';
import { assetCostRoutes } from '../lib/mocks/routes/asset-costs';
import { estateProfitabilityRoutes } from '../lib/mocks/routes/estate-profitability';
import { landConfigurationRoutes } from '../lib/mocks/routes/land-configuration';
import { AssetDetailSchema } from '../features/assets/schemas/asset-detail.schema';
import { EstateProfitabilitySchema } from '../features/assets/schemas/estate-profitability.schema';
import { ProfitabilityMatrixSchema, planProfitRows } from '../features/assets/schemas/profitability-matrix.schema';
import {
  ProfitabilityDrillDownSchema,
  calculationBreakdown,
  costSplitByProduct,
  type DrillDownCostRow,
} from '../features/assets/schemas/profitability-drilldown.schema';

registerRoutes(assetRoutes);
registerRoutes(landConfigurationRoutes);
registerRoutes(assetCostRoutes);
registerRoutes(assetAnalyticsRoutes);
registerRoutes(estateProfitabilityRoutes);

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

function cost(overrides: Partial<DrillDownCostRow>): DrillDownCostRow {
  return {
    cost_item_id: 'c',
    name: 'Cost',
    group: 'development',
    group_label: 'Development',
    amount: 0,
    basis: null,
    included_products: [],
    excluded_products: [],
    shares: [],
    counted: true,
    warning: null,
    ...overrides,
  };
}

async function main() {
  const results: Result[] = [];

  const rows: DrillDownCostRow[] = [
    // Charged to Flex alone → Flex direct.
    cost({ cost_item_id: 'a', amount: 500, shares: [{ offer_type: 'flex', amount: 500, share_pct: 100 }] }),
    // A road split 60/40 → shared for both.
    cost({
      cost_item_id: 'b',
      amount: 1_000,
      basis: 'saleable_sqm',
      shares: [
        { offer_type: 'flex', amount: 600, share_pct: 60 },
        { offer_type: 'commercial', amount: 400, share_pct: 40 },
      ],
    }),
    // Not counted by the backend (no amount) → contributes nothing.
    cost({ cost_item_id: 'c', amount: null, counted: false, warning: '"Fencing" has no amount recorded yet' }),
  ];

  results.push(
    await run('PS-single-product-cost-is-direct-split-cost-is-shared', () => {
      const split = costSplitByProduct(rows);
      const flex = split.get('flex');
      const commercial = split.get('commercial');
      assert(flex?.direct === 500 && flex.shared === 600, `flex should be 500 direct / 600 shared, got ${JSON.stringify(flex)}`);
      assert(commercial?.direct === 0 && commercial.shared === 400, `commercial should be 0 / 400, got ${JSON.stringify(commercial)}`);
      assert(!split.has('full-ownership'), 'a product no cost names should be absent');
    })
  );

  results.push(
    await run('PS-uncounted-rows-add-nothing', () => {
      const total = [...costSplitByProduct(rows).values()].reduce((sum, row) => sum + row.direct + row.shared, 0);
      assert(total === 1_500, `expected 1,500 across both products, got ${total}`);
    })
  );

  results.push(
    await run('PS-split-adds-up-to-the-backend-totals-per-product', async () => {
      const query = {};
      const profitability = EstateProfitabilitySchema.parse(
        await dispatchMockRoute({ method: 'GET', path: `/admin/assets/${A1}/profitability`, query, body: undefined })
      );
      const drillDown = ProfitabilityDrillDownSchema.parse(
        await dispatchMockRoute({ method: 'GET', path: `/admin/assets/${A1}/profitability/drill-down`, query, body: undefined })
      );
      const split = costSplitByProduct(drillDown.cost_rows);

      for (const row of profitability.by_product) {
        const mine = split.get(row.offer_type) ?? { direct: 0, shared: 0 };
        const theirs = row.direct_cost + row.allocated_opex;
        assert(
          Math.abs(mine.direct + mine.shared - theirs) < 1,
          `${row.offer_type}: direct + shared (${mine.direct + mine.shared}) should equal direct_cost + allocated_opex (${theirs})`
        );
      }
    })
  );

  results.push(
    await run('PS-breakdown-sorts-costs-into-direct-shared-and-uncounted', () => {
      const breakdown = calculationBreakdown({ revenue_rows: [], cost_rows: rows });
      assert(breakdown.direct.map((r) => r.cost_item_id).join() === 'a', 'the single-product cost should be direct');
      assert(breakdown.shared.map((r) => r.cost_item_id).join() === 'b', 'the split cost should be shared');
      assert(breakdown.uncounted.map((r) => r.cost_item_id).join() === 'c', 'the cost with no amount should be uncounted');
      assert(breakdown.directTotal === 500 && breakdown.sharedTotal === 1_000, 'totals should be 500 direct, 1,000 shared');
    })
  );

  results.push(
    await run('PS-breakdown-gathers-sale-lines-under-their-product', () => {
      const line = (offer_type: 'flex' | 'commercial', sold_value: number, units: number, tenor_months: number) => ({
        offer_type,
        size_id: 's',
        tenor_months,
        sold_value,
        received: sold_value / 2,
        units,
        sqm: 0,
      });
      const breakdown = calculationBreakdown({
        revenue_rows: [line('flex', 100, 1, 6), line('commercial', 900, 3, 0), line('flex', 400, 2, 12)],
        cost_rows: [],
      });
      assert(breakdown.revenue.map((p) => p.offer_type).join() === 'commercial,flex', 'products should be largest first');
      const flex = breakdown.revenue[1];
      assert(flex.sold_value === 500 && flex.units === 3 && flex.received === 250, 'flex should total its two lines');
      assert(flex.lines[0].sold_value === 400, "a product's lines should be largest first");
    })
  );

  results.push(
    await run('PS-the-drawer-sum-adds-up-on-the-mock-estate', async () => {
      const drillDown = ProfitabilityDrillDownSchema.parse(
        await dispatchMockRoute({ method: 'GET', path: `/admin/assets/${A1}/profitability/drill-down`, query: {}, body: undefined })
      );
      const breakdown = calculationBreakdown(drillDown);
      const { direct_cost, allocated_opex } = drillDown.subtotals;
      // Direct + shared is the same money as the backend's direct cost + operating cost, cut differently.
      assert(
        Math.abs(breakdown.directTotal + breakdown.sharedTotal - (direct_cost + allocated_opex)) < 1,
        `direct + shared (${breakdown.directTotal + breakdown.sharedTotal}) should equal the backend's total cost (${direct_cost + allocated_opex})`
      );
      assert(
        breakdown.direct.length + breakdown.shared.length + breakdown.uncounted.length === drillDown.cost_rows.length,
        'every cost row should land in exactly one section'
      );
    })
  );

  results.push(
    await run('PS-plan-profit-rows-are-labelled-by-size-and-ordered', async () => {
      const row = (offer_type: 'flex' | 'commercial', size_id: string | null, tenor_months: number | null) => ({
        offer_type,
        size_id,
        tenor_months,
        sold_value: 100,
        received: 40,
        balance: 60,
        collection_efficiency_pct: 40,
        units: 1,
        forecast_gross_profit: 70,
        allocated_opex: 10,
        forecast_net_contribution: 60,
        margin_pct: 60,
        complete: true,
      });
      const offers = [
        { offer_type: 'flex', sizes: [{ _id: 's300', size_sqm: 300 }, { _id: 's150', size_sqm: 150 }] },
        { offer_type: 'commercial', sizes: [{ _id: 'c500', size_sqm: 500 }] },
      ];
      const rows = planProfitRows(
        [row('commercial', 'c500', 12), row('flex', 's300', 6), row('flex', 'gone', 6), row('flex', 's150', 12), row('flex', 's150', null)],
        offers
      );
      const order = rows.map((r) => `${r.offer_type}:${r.size_sqm ?? 'none'}:${r.tenor_months ?? 'outright'}`).join(' ');
      assert(
        order === 'flex:150:outright flex:150:12 flex:300:6 flex:none:6 commercial:500:12',
        `unexpected order "${order}"`
      );
      assert(rows[3].size_sqm === null, 'a size no longer on the asset stays unknown, not 0');
      assert(rows[0].forecast_net_contribution === 60, 'the backend figures pass through untouched');
    })
  );

  results.push(
    await run('PS-the-mock-matrix-parses-and-every-row-finds-its-size', async () => {
      const get = (path: string) => dispatchMockRoute({ method: 'GET', path, query: {}, body: undefined });
      const matrix = ProfitabilityMatrixSchema.parse(await get(`/admin/assets/${A1}/profitability/matrix`));
      const asset = AssetDetailSchema.parse(await get(`/admin/assets/${A1}`));
      const rows = planProfitRows(matrix.rows, asset.offers);
      assert(rows.length === matrix.rows.length && rows.length > 0, 'no row should be dropped');
      assert(rows.every((r) => r.size_sqm !== null), 'every mock row should map to a size on the asset');
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
