/**
 * The Revise modal for one cost record: replacing a budget
 * (`runBudgetRevision`), adding a staged entry (`runStageEntry`), the impact
 * preview arithmetic (`forecastImpact`) — run against the mock backend,
 * including a revision that fails halfway and is retried.
 * Run: npx tsx scripts/revise-cost-qa.ts
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { assetCostRoutes } from '../lib/mocks/routes/asset-costs';
import {
  AssetCostEventSchema,
  AssetCostItemSchema,
  ObligationDetailSchema,
  type ObligationDetail,
} from '../features/assets/schemas/asset-cost.schema';
import {
  ReviseStepError,
  approvedBudgetEntries,
  budgetRevisionFormSchema,
  draftEntries,
  forecastImpact,
  planBudgetRevision,
  recordFigures,
  runBudgetRevision,
  runStageEntry,
  stageEntryFormSchema,
  stageEntryPayload,
  type ReviseCostApi,
  type ReviseProgress,
} from '../features/assets/schemas/revise-cost.schema';

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

const call = (method: string, path: string, body?: unknown) => dispatchMockRoute({ method, path, query: {}, body });

const getRecord = async (id: string): Promise<ObligationDetail> =>
  ObligationDetailSchema.parse(await call('GET', `/admin/assets/${A1}/costs/${id}`));

/** The same calls the app makes for one record, pointed at the mock router. */
function apiFor(obligationId: string): ReviseCostApi {
  return {
    addEntry: async (payload) =>
      AssetCostEventSchema.parse(await call('POST', `/admin/assets/${A1}/costs/${obligationId}/stages`, payload)),
    approveEntry: async (entryId) => AssetCostEventSchema.parse(await call('POST', `/admin/cost-entries/${entryId}/approve`, {})),
    reverseEntry: async (entryId, reason) =>
      AssetCostEventSchema.parse(await call('POST', `/admin/cost-entries/${entryId}/reverse`, { reason })),
  };
}

let seq = 0;
/** A fresh cost item and record, with an approved budget of `budget` when one is given. */
async function newRecord(budget?: number): Promise<ObligationDetail> {
  seq += 1;
  const item = AssetCostItemSchema.parse(
    await call('POST', `/admin/assets/${A1}/costs/items`, { group: 'development', name: `Revise QA item ${seq}` })
  );
  const created = ObligationDetailSchema.parse(
    await call('POST', `/admin/assets/${A1}/costs`, {
      cost_item_id: item.id,
      title: `Revise QA record ${seq}`,
      product: 'flex',
      effective_date: '2026-09-01',
      ...(budget !== undefined ? { amount: budget, stage: 'budget' } : {}),
    })
  );
  for (const entry of draftEntries(created)) await call('POST', `/admin/cost-entries/${entry.id}/approve`, {});
  return getRecord(created.obligation.id);
}

const revision = (amount: number) =>
  budgetRevisionFormSchema.parse({
    amount,
    effective_date: '2026-10-01',
    source: 'contract_variation',
    reason: 'Drainage scope increased',
    reference: 'VAR-1',
  });

async function main() {
  const results: Result[] = [];

  results.push(
    await run('RC-a-revision-replaces-the-budget-and-keeps-the-old-one-on-record', async () => {
      const record = await newRecord(1_000_000);
      assert(recordFigures(record).budget === 1_000_000, 'the starting budget should be 1,000,000');

      await runBudgetRevision(apiFor(record.obligation.id), planBudgetRevision(record, revision(1_400_000)), {});

      const after = await getRecord(record.obligation.id);
      assert(recordFigures(after).budget === 1_400_000, `the budget should be 1,400,000, not a sum; got ${recordFigures(after).budget}`);
      assert(approvedBudgetEntries(after).length === 1, 'exactly one budget entry should be in force');
      const old = after.events.find((entry) => entry.amount === 1_000_000);
      assert(old?.status === 'reversed', 'the earlier budget should stay on record, marked reversed');
      const fresh = approvedBudgetEntries(after)[0];
      assert(fresh.note === 'Contract variation: Drainage scope increased', `the source and reason should be in the note, got "${fresh.note}"`);
      assert(fresh.reference === 'VAR-1', 'the reference should be kept');
    })
  );

  results.push(
    await run('RC-a-revision-on-a-record-with-no-budget-just-sets-one', async () => {
      const record = await newRecord();
      const plan = planBudgetRevision(record, revision(500_000));
      assert(plan.reverseIds.length === 0, 'there is nothing to reverse');
      await runBudgetRevision(apiFor(record.obligation.id), plan, {});
      assert(recordFigures(await getRecord(record.obligation.id)).budget === 500_000, 'the budget should be 500,000');
    })
  );

  results.push(
    await run('RC-a-revision-that-fails-halfway-is-finished-by-a-retry-without-double-entry', async () => {
      const record = await newRecord(2_000_000);
      const api = apiFor(record.obligation.id);
      const plan = planBudgetRevision(record, revision(2_500_000));
      const progress: ReviseProgress = {};

      let failures = 0;
      const flaky: ReviseCostApi = {
        ...api,
        reverseEntry: async (entryId, reason) => {
          if (failures === 0) {
            failures += 1;
            throw new Error('network dropped');
          }
          return api.reverseEntry(entryId, reason);
        },
      };

      let step: string | null = null;
      try {
        await runBudgetRevision(flaky, plan, progress);
      } catch (e) {
        step = e instanceof ReviseStepError ? e.step : 'unknown';
      }
      assert(step === 'reverse', `the first attempt should fail at the reverse step, got ${step}`);

      // Stopped after "add": the old budget is still the one in force.
      const midway = await getRecord(record.obligation.id);
      assert(recordFigures(midway).budget === 2_000_000, 'midway, the old budget should still stand');
      assert(draftEntries(midway).length === 1, 'midway, the revised budget should be waiting as one draft');

      await runBudgetRevision(flaky, plan, progress);
      const after = await getRecord(record.obligation.id);
      assert(recordFigures(after).budget === 2_500_000, `after the retry the budget should be 2,500,000, got ${recordFigures(after).budget}`);
      const budgetEntries = after.events.filter((entry) => entry.financial_stage === 'budget');
      assert(budgetEntries.length === 2, `there should be the old entry and one new one, got ${budgetEntries.length}`);
    })
  );

  results.push(
    await run('RC-an-invoice-is-incurred-once-approved-and-not-before', async () => {
      const record = await newRecord(1_000_000);
      const api = apiFor(record.obligation.id);
      const payload = stageEntryPayload(
        'incurred',
        stageEntryFormSchema.parse({ amount: 300_000, effective_date: '2026-10-01', reference: 'INV-7' })
      );

      await runStageEntry(api, payload, false, {});
      const drafted = await getRecord(record.obligation.id);
      assert(recordFigures(drafted).incurred === null, 'a draft invoice must not count as incurred');

      await runStageEntry(api, payload, true, {});
      const approved = await getRecord(record.obligation.id);
      assert(recordFigures(approved).incurred === 300_000, 'the approved invoice should count');
      assert(recordFigures(approved).remaining === 700_000, 'remaining should be budget less incurred');
    })
  );

  results.push(
    await run('RC-impact-preview-is-budget-less-incurred', async () => {
      const record = await newRecord(1_000_000);
      const revisionImpact = forecastImpact(record, 'revision', 1_300_000);
      assert(revisionImpact?.previousRemaining === 1_000_000 && revisionImpact.revisedRemaining === 1_300_000, 'a revision moves remaining with the budget');
      assert(revisionImpact.profitChange === 0, 'a budget does not move profit');

      const invoiceImpact = forecastImpact(record, 'incurred', 250_000);
      assert(invoiceImpact?.revisedRemaining === 750_000 && invoiceImpact.profitChange === -250_000, 'an invoice lowers remaining and profit by its amount');

      assert(forecastImpact(record, 'paid', 100_000) === null, 'a payment has no forecast impact');
      assert(forecastImpact(record, 'revision', undefined) === null, 'no amount, no preview');
    })
  );

  results.push(
    await run('RC-KNOWN-BACKEND-BUG-reversing-an-incurred-cost-subtracts-it-twice', async () => {
      // Mirrors `AssetCostService.reverseEvent()` + `getObligation()` on abode-be-v2: the
      // reversed entry stops being counted AND a reversal entry subtracts it again, so the
      // record ends at MINUS the amount instead of zero. This case passes while the bug
      // exists (the mock copies the backend's logic). When the backend is fixed and the
      // mock updated to match, the expected figure here becomes 0.
      const record = await newRecord();
      const api = apiFor(record.obligation.id);
      await runStageEntry(api, stageEntryPayload('incurred', stageEntryFormSchema.parse({ amount: 400_000, effective_date: '2026-10-01' })), true, {});
      const incurred = (await getRecord(record.obligation.id)).events.find((entry) => entry.financial_stage === 'incurred');
      assert(incurred, 'expected an incurred entry');

      await api.reverseEntry(incurred.id, 'Booked against the wrong estate');
      const after = await getRecord(record.obligation.id);
      assert(
        after.recognised_cost === -400_000,
        `expected the known double subtraction (-400,000); got ${after.recognised_cost} — if this is 0 the bug is fixed, update this case`
      );
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
