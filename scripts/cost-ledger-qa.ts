/**
 * Costs tab — the per-cost-item figures added up from each record's detail
 * (`costLedger`, `costLedgerTotals`, `costHistory`), including a cross-check
 * against the backend-shaped coverage total on the mock estate.
 * Run: npx tsx scripts/cost-ledger-qa.ts
 */
import { z } from 'zod';

import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { assetCostRoutes } from '../lib/mocks/routes/asset-costs';
import {
  AssetCostItemSchema,
  AssetCostObligationSchema,
  ObligationDetailSchema,
  type AssetCostEvent,
  type AssetCostItem,
  type ObligationDetail,
} from '../features/assets/schemas/asset-cost.schema';
import { CostCoverageSchema } from '../features/assets/schemas/cost-coverage.schema';
import { costHistory, costLedger, costLedgerTotals } from '../features/assets/schemas/cost-ledger.schema';

registerRoutes(assetRoutes);
registerRoutes(assetCostRoutes);

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

function item(id: string, overrides: Partial<AssetCostItem> = {}): AssetCostItem {
  return {
    id,
    asset_id: A1,
    group: 'development',
    group_label: 'Development',
    name: id,
    description: null,
    is_shared: false,
    allocation_basis: null,
    allocation_label: null,
    applies_to_products: [],
    excluded_products: [],
    manual_shares: [],
    applicability_version: 1,
    is_active: true,
    needs_allocation_rule: false,
    created_at: null,
    ...overrides,
  };
}

function event(
  id: string,
  stage: AssetCostEvent['financial_stage'],
  status: AssetCostEvent['status'],
  at: string
): AssetCostEvent {
  return {
    id,
    obligation_id: 'o',
    cost_item_id: 'i',
    financial_stage: stage,
    stage_label: stage,
    counts_as_cost: false,
    amount: 1,
    effective_date: at,
    vendor: null,
    reference: null,
    note: null,
    evidence: [],
    status,
    source_type: 'manual',
    source_id: null,
    revision: 1,
    reverses_event_id: null,
    reversal_reason: null,
    approved_at: status === 'approved' ? at : null,
    created_at: at,
  };
}

function record(
  id: string,
  itemId: string,
  stages: ObligationDetail['stages'],
  recognised: number,
  events: AssetCostEvent[]
): ObligationDetail {
  return {
    obligation: {
      id,
      asset_id: A1,
      cost_item: { id: itemId, name: itemId, group: 'development', is_shared: false, allocation_basis: null },
      title: id,
      description: null,
      product: null,
      size_id: null,
      vendor: null,
      reference: null,
      status: 'open',
      source_type: 'manual',
      source_id: null,
      effective_date: null,
      archived_reason: null,
      created_at: null,
    },
    cost_item: null,
    stages,
    recognised_cost: recognised,
    events,
  };
}

async function main() {
  const results: Result[] = [];

  const items = [item('roads'), item('fencing'), item('survey'), item('legal')];
  const records = [
    // Roads: two records. Budget 1,000 + 500, committed 800, incurred 600 + 100, paid 600.
    record('roads-1', 'roads', { budget: 1_000, committed: 800, incurred: 600, paid: 600 }, 600, [
      event('e1', 'incurred', 'approved', '2026-09-10T00:00:00.000Z'),
    ]),
    record('roads-2', 'roads', { budget: 500, incurred: 100 }, 100, [
      event('e2', 'incurred', 'approved', '2026-09-18T00:00:00.000Z'),
    ]),
    // Survey: one approved budget and one entry still in draft.
    record('survey-1', 'survey', { budget: 300 }, 0, [
      event('e3', 'budget', 'approved', '2026-09-01T00:00:00.000Z'),
      event('e4', 'incurred', 'draft', '2026-09-20T00:00:00.000Z'),
    ]),
    // Legal: incurred 250 against a budget of 200, and paid in full.
    record('legal-1', 'legal', { budget: 200, incurred: 250, paid: 250 }, 250, [
      event('e5', 'paid', 'approved', '2026-09-05T00:00:00.000Z'),
    ]),
  ];
  const rows = costLedger(items, records);
  const row = (id: string) => rows.find((r) => r.item.id === id)!;

  results.push(
    await run('CL-stages-are-added-up-across-the-records-of-an-item', () => {
      const roads = row('roads');
      assert(roads.totals.budget === 1_500, `roads budget should be 1,500, got ${roads.totals.budget}`);
      assert(roads.totals.incurred === 700, `roads incurred should be 700, got ${roads.totals.incurred}`);
      assert(roads.totals.committed === 800 && roads.totals.paid === 600, 'roads committed/paid should be 800/600');
      assert(roads.remaining === 800, `roads remaining should be 1,500 - 700, got ${roads.remaining}`);
      assert(roads.status === 'in_progress', `roads should be in progress, got ${roads.status}`);
    })
  );

  results.push(
    await run('CL-nothing-recorded-is-unknown-not-zero', () => {
      const fencing = row('fencing');
      assert(fencing.records.length === 0 && fencing.status === 'missing', 'fencing should be "missing"');
      assert(
        fencing.totals.budget === null && fencing.totals.incurred === null && fencing.remaining === null,
        'every fencing figure should be null, never 0'
      );
    })
  );

  results.push(
    await run('CL-draft-entries-are-pending-and-not-counted', () => {
      const survey = row('survey');
      assert(survey.pending === 1 && survey.status === 'pending', 'survey should have 1 pending entry');
      assert(survey.totals.incurred === null, 'a draft incurred entry must not count as incurred');
      assert(survey.remaining === 300, 'the whole survey budget should still be remaining');
    })
  );

  results.push(
    await run('CL-over-budget-is-flagged-and-not-a-negative-forecast', () => {
      const legal = row('legal');
      assert(legal.remaining === -50 && legal.status === 'over_budget', 'legal should be over budget by 50');
      const totals = costLedgerTotals(rows);
      assert(totals.budget === 2_000, `budget total should be 2,000, got ${totals.budget}`);
      assert(totals.incurred === 950, `incurred total should be 950, got ${totals.incurred}`);
      assert(totals.remaining === 1_100, `remaining should be 800 + 300 + 0, got ${totals.remaining}`);
      assert(totals.withoutBudget === 1, 'only fencing has no budget');
    })
  );

  results.push(
    await run('CL-totals-stay-unknown-with-no-entries', () => {
      const totals = costLedgerTotals(costLedger([item('fencing')], []));
      assert(totals.budget === null && totals.paid === null && totals.remaining === null, 'empty totals should be null');
    })
  );

  results.push(
    await run('CL-history-is-newest-first', () => {
      const history = costHistory(records);
      assert(history.length === 5, `expected 5 entries, got ${history.length}`);
      assert(history[0].event.id === 'e4' && history[4].event.id === 'e3', 'entries should run newest to oldest');
      assert(history[0].recordTitle === 'survey-1', 'an entry should carry its record title');
    })
  );

  results.push(
    await run('CL-incurred-matches-the-coverage-total-on-the-mock-estate', async () => {
      const get = (path: string, query: Record<string, unknown> = {}) =>
        dispatchMockRoute({ method: 'GET', path, query, body: undefined });

      const mockItems = z.array(AssetCostItemSchema).parse(await get(`/admin/assets/${A1}/costs/items`));
      const list = z
        .object({ data: z.array(AssetCostObligationSchema) })
        .parse(await get(`/admin/assets/${A1}/costs`, { page: 1, limit: 100 }));
      const details = await Promise.all(
        list.data.map(async (o) => ObligationDetailSchema.parse(await get(`/admin/assets/${A1}/costs/${o.id}`)))
      );
      const coverage = CostCoverageSchema.parse(await get(`/admin/assets/${A1}/costs/coverage`));

      const totals = costLedgerTotals(costLedger(mockItems, details));
      assert(details.length > 0, 'the mock estate should have cost records');
      assert(
        Math.abs((totals.incurred ?? 0) - coverage.totals.recognised_cost) < 1,
        `incurred (${totals.incurred}) should equal the recognised cost in coverage (${coverage.totals.recognised_cost})`
      );
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
