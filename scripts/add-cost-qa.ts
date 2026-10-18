/**
 * The one-form "Add cost": the form's rules (`addCostFormSchema`), the plan
 * it turns into (`planAddCost`), and running that plan against the mock
 * backend (`runAddCost`) — including a save that fails halfway and is retried.
 * Run: npx tsx scripts/add-cost-qa.ts
 */
import { z } from 'zod';

import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { assetCostRoutes } from '../lib/mocks/routes/asset-costs';
import {
  AddCostStepError,
  NEW_COST_ITEM,
  SHARED_SCOPE,
  addCostFormSchema,
  isPlanError,
  planAddCost,
  runAddCost,
  type AddCostApi,
  type AddCostFormValues,
  type AddCostPlan,
  type AddCostProgress,
} from '../features/assets/schemas/add-cost.schema';
import {
  AssetCostEventSchema,
  AssetCostItemSchema,
  ObligationDetailSchema,
} from '../features/assets/schemas/asset-cost.schema';
import { costLedger } from '../features/assets/schemas/cost-ledger.schema';

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
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const call = (method: string, path: string, body?: unknown) =>
  dispatchMockRoute({ method, path, query: {}, body });

/** The same three calls the app makes, pointed at the mock router. */
const api: AddCostApi = {
  createItem: async (payload) => AssetCostItemSchema.parse(await call('POST', `/admin/assets/${A1}/costs/items`, payload)),
  createRecord: async (payload) => ObligationDetailSchema.parse(await call('POST', `/admin/assets/${A1}/costs`, payload)),
  approveEntry: async (entryId) => AssetCostEventSchema.parse(await call('POST', `/admin/cost-entries/${entryId}/approve`, {})),
};

const listItems = async () => z.array(AssetCostItemSchema).parse(await call('GET', `/admin/assets/${A1}/costs/items`));
const getRecord = async (id: string) => ObligationDetailSchema.parse(await call('GET', `/admin/assets/${A1}/costs/${id}`));

function form(overrides: Partial<AddCostFormValues>): AddCostFormValues {
  return {
    stage: 'budget',
    cost_item_id: NEW_COST_ITEM,
    new_item_name: 'QA item',
    new_item_group: 'development',
    scope: SHARED_SCOPE,
    allocation_basis: 'saleable_sqm',
    title: 'QA cost',
    effective_date: '2026-10-01',
    amount: 1_000_000,
    ...overrides,
  };
}

function planFor(values: AddCostFormValues, items: { id: string; is_shared: boolean }[], approve: boolean): AddCostPlan {
  const plan = planAddCost(addCostFormSchema.parse(values), items, { approve });
  if (isPlanError(plan)) throw new Error(`unexpected plan error: ${plan.message}`);
  return plan;
}

async function main() {
  const results: Result[] = [];

  results.push(
    await run('AC-a-new-item-needs-its-name-scope-and-split', () => {
      const parsed = addCostFormSchema.safeParse(
        form({ new_item_name: '', scope: undefined, allocation_basis: undefined })
      );
      assert(!parsed.success, 'a new item with no name or scope must not validate');
      const fields = parsed.error.issues.map((issue) => issue.path.join('.'));
      assert(fields.includes('new_item_name') && fields.includes('scope'), `expected name and scope errors, got ${fields}`);

      const noSplit = addCostFormSchema.safeParse(form({ allocation_basis: undefined }));
      assert(!noSplit.success, 'a shared new item with no split rule must not validate');
    })
  );

  results.push(
    await run('AC-plan-for-a-new-shared-item', () => {
      const plan = planFor(form({}), [], true);
      assert(plan.newItem?.is_shared === true && plan.newItem.allocation_basis === 'saleable_sqm', 'item should be shared, split by saleable sqm');
      assert(plan.existingItemId === null, 'there is no existing item');
      assert(plan.record.product === undefined, 'a shared cost is booked to no single product');
      assert(plan.approve === true, 'Add cost should approve');
    })
  );

  results.push(
    await run('AC-plan-for-a-new-single-product-item', () => {
      const plan = planFor(form({ scope: 'flex', allocation_basis: undefined }), [], false);
      assert(plan.newItem?.is_shared === false && plan.newItem.allocation_basis === undefined, 'item should not be shared and carry no split rule');
      assert(plan.record.product === 'flex', 'the record should be booked to Flex');
      assert(plan.approve === false, 'Save draft should not approve');
    })
  );

  results.push(
    await run('AC-an-unshared-existing-item-needs-a-product', () => {
      const items = [{ id: 'x', is_shared: false }];
      const missing = planAddCost(addCostFormSchema.parse(form({ cost_item_id: 'x', scope: undefined })), items, { approve: false });
      assert(isPlanError(missing) && missing.field === 'scope', 'expected a scope error');
      const ok = planFor(form({ cost_item_id: 'x', scope: 'flex' }), items, false);
      assert(ok.newItem === null && ok.existingItemId === 'x' && ok.record.product === 'flex', 'expected a record on item x, booked to Flex');
    })
  );

  results.push(
    await run('AC-no-amount-can-be-a-draft-but-cannot-be-added', () => {
      const values = addCostFormSchema.parse(form({ amount: undefined }));
      const add = planAddCost(values, [], { approve: true });
      assert(isPlanError(add) && add.field === 'amount', 'Add cost with no amount should ask for one');
      const draft = planAddCost(values, [], { approve: false });
      assert(!isPlanError(draft) && draft.record.amount === undefined, 'a draft may leave the amount out entirely');
    })
  );

  results.push(
    await run('AC-add-cost-creates-the-item-the-record-and-approves', async () => {
      const before = (await listItems()).length;
      const progress: AddCostProgress = {};
      const record = await runAddCost(api, planFor(form({ new_item_name: 'QA shared drainage', stage: 'incurred' }), [], true), progress);

      const items = await listItems();
      assert(items.length === before + 1, 'exactly one cost item should be created');
      const item = items.find((i) => i.name === 'QA shared drainage');
      assert(item?.is_shared && item.allocation_basis === 'saleable_sqm' && !item.needs_allocation_rule, 'the item should be shared with its split rule set');

      const saved = await getRecord(record.obligation.id);
      assert(saved.events.length === 1 && saved.events[0].status === 'approved', 'the entry should be approved');
      assert(saved.stages.incurred === 1_000_000 && saved.recognised_cost === 1_000_000, 'the incurred amount should count');

      const row = costLedger(items, [saved]).find((r) => r.item.id === item.id);
      assert(row?.totals.incurred === 1_000_000 && row.pending === 0, 'the table row should show it as incurred, nothing pending');
    })
  );

  results.push(
    await run('AC-save-draft-leaves-the-entry-unapproved-and-uncounted', async () => {
      const record = await runAddCost(api, planFor(form({ new_item_name: 'QA draft item' }), [], false), {});
      const saved = await getRecord(record.obligation.id);
      assert(saved.events.length === 1 && saved.events[0].status === 'draft', 'the entry should be a draft');
      assert(Object.keys(saved.stages).length === 0, 'a draft must not appear in any stage total');
    })
  );

  results.push(
    await run('AC-a-draft-with-no-amount-writes-no-entry', async () => {
      const record = await runAddCost(api, planFor(form({ new_item_name: 'QA unknown amount', amount: undefined }), [], false), {});
      const saved = await getRecord(record.obligation.id);
      assert(saved.events.length === 0, 'no amount means no entry at all');
    })
  );

  results.push(
    await run('AC-a-failed-record-step-is-retried-without-a-second-item', async () => {
      const before = (await listItems()).length;
      const plan = planFor(form({ new_item_name: 'QA retry item' }), [], true);
      const progress: AddCostProgress = {};

      let failures = 0;
      const flaky: AddCostApi = {
        ...api,
        createRecord: async (payload) => {
          if (failures === 0) {
            failures += 1;
            throw new Error('network dropped');
          }
          return api.createRecord(payload);
        },
      };

      let step: string | null = null;
      try {
        await runAddCost(flaky, plan, progress);
      } catch (e) {
        step = e instanceof AddCostStepError ? e.step : 'unknown';
      }
      assert(step === 'record', `the first attempt should fail at the record step, got ${step}`);
      assert(progress.itemId && !progress.record, 'the item should be remembered, the record not yet');
      assert((await listItems()).length === before + 1, 'the item exists after the failed attempt');

      const record = await runAddCost(flaky, plan, progress);
      assert((await listItems()).length === before + 1, 'the retry must not create a second item');
      assert(record.obligation.cost_item.id === progress.itemId, 'the record should sit on the item made by the first attempt');
      assert((await getRecord(record.obligation.id)).events[0].status === 'approved', 'the retry should finish with the approval');
    })
  );

  results.push(
    await run('AC-a-failed-approval-keeps-the-saved-draft', async () => {
      const plan = planFor(form({ new_item_name: 'QA approval fails' }), [], true);
      const progress: AddCostProgress = {};
      let step: string | null = null;
      try {
        await runAddCost({ ...api, approveEntry: async () => { throw new Error('forbidden'); } }, plan, progress);
      } catch (e) {
        step = e instanceof AddCostStepError ? e.step : 'unknown';
      }
      assert(step === 'approve', `expected the approval step to fail, got ${step}`);
      assert(progress.record, 'the record should already be saved');
      assert((await getRecord(progress.record.obligation.id)).events[0].status === 'draft', 'it should be left as a draft');
    })
  );

  results.push(
    await run('AC-a-duplicate-item-name-fails-at-the-item-step', async () => {
      let step: string | null = null;
      try {
        await runAddCost(api, planFor(form({ new_item_name: 'QA retry item' }), [], false), {});
      } catch (e) {
        step = e instanceof AddCostStepError ? e.step : 'unknown';
      }
      assert(step === 'item', `expected the item step to refuse the duplicate name, got ${step}`);
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
