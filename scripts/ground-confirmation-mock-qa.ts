/**
 * Ground confirmation ("Separate system allocation from ground confirmation") — mock API smoke test.
 * Run: npx tsx scripts/ground-confirmation-mock-qa.ts
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { inventoryReconciliationRoutes } from '../lib/mocks/routes/inventory-reconciliation';
import { assetAnalyticsRoutes } from '../lib/mocks/routes/asset-analytics';

registerRoutes(assetRoutes);
registerRoutes(inventoryReconciliationRoutes);
registerRoutes(assetAnalyticsRoutes);

const A1 = '665faaaa00000000000000a1'; // Aviation City
const SEEDED_ALLOCATED_PLOT = '665fcp000000000000000a1'; // Block A plot 1 — seeded with a pending ground confirmation
const SEEDED_AVAILABLE_PLOT = '665fcp000000000000000a2'; // Block A plot 2 — never allocated

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
    await run('GC-seeded-plot-has-pending-unverified-submission', async () => {
      const history: any = await call('GET', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation`);
      assert(history.length === 1, `expected 1 seeded submission, got ${history.length}`);
      assert(history[0].verified_at === null, 'the seeded submission should start unverified');
    })
  );

  results.push(
    await run('GC-plot-list-reflects-not-yet-confirmed', async () => {
      // The real `/plots` endpoint (see plot-inventory.schema.ts's header)
      // has no `ground_confirmed` field at all — that was this app's own
      // invention. Ground-confirmed status is derived client-side from this
      // plot's own history, exactly like `GroundConfirmationBadge` does.
      const list: any = await call('GET', `/admin/assets/${A1}/plots`, { status: 'allocated' });
      const plot = list.data.plots.find((p: any) => p.id === SEEDED_ALLOCATED_PLOT);
      assert(plot, 'expected the seeded allocated plot in the list');

      const history: any = await call('GET', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation`);
      const groundConfirmed = history.some((entry: any) => entry.verified_at !== null);
      assert(groundConfirmed === false, 'a plot with only a PENDING submission must not read as ground confirmed');
    })
  );

  results.push(
    await run('GC-verify-makes-it-authoritative', async () => {
      const history: any = await call('GET', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation`);
      const pendingId = history[0]._id;

      const verified: any = await call('POST', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation/${pendingId}/verify`);
      assert(verified.verified_at !== null && verified.verified_by, 'verify should set verified_by/verified_at');

      const list: any = await call('GET', `/admin/assets/${A1}/plots`, { status: 'allocated' });
      const plot = list.data.plots.find((p: any) => p.id === SEEDED_ALLOCATED_PLOT);
      assert(plot, 'expected the seeded allocated plot still in the list after verifying');

      const after: any = await call('GET', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation`);
      assert(
        after.some((entry: any) => entry.verified_at !== null),
        'after verification this plot should have at least one verified submission'
      );
    })
  );

  results.push(
    await run('GC-cannot-verify-twice', async () => {
      const history: any = await call('GET', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation`);
      const verifiedId = history[0]._id;
      try {
        await call('POST', `/admin/plots/${SEEDED_ALLOCATED_PLOT}/ground-confirmation/${verifiedId}/verify`);
        throw new Error('expected a second verify to be rejected, but it succeeded');
      } catch (e) {
        assert(e instanceof MockHttpError && e.statusCode === 409, `expected a 409, got ${e}`);
        assert((e as MockHttpError).code === 'ALREADY_VERIFIED', `expected ALREADY_VERIFIED, got ${(e as MockHttpError).code}`);
      }
    })
  );

  results.push(
    await run('GC-refuses-available-plot', async () => {
      const before: any = await call('GET', `/admin/plots/${SEEDED_AVAILABLE_PLOT}/ground-confirmation`);
      assert(before.length === 0, 'an untouched plot should start with no ground-confirmation history');
      try {
        await call('POST', `/admin/plots/${SEEDED_AVAILABLE_PLOT}/ground-confirmation`, {}, { notes: 'QA field visit' });
        throw new Error('expected an unallocated plot to be rejected');
      } catch (e) {
        assert(e instanceof MockHttpError && e.code === 'PLOT_NOT_ALLOCATED', 'expected PLOT_NOT_ALLOCATED');
      }
    })
  );

  results.push(
    await run('GC-reconciliation-shows-ground-confirmed-subset-of-allocated', async () => {
      const r: any = await call('GET', `/admin/assets/${A1}/inventory-reconciliation`);
      const size500 = r.rows.find((row: any) => row.size === 500);
      assert(size500?.physical, 'expected physical data at size 500');
      assert(
        size500.physical.ground_confirmed_count <= size500.physical.allocated_count,
        'ground_confirmed_count must never exceed allocated_count'
      );
      assert(size500.physical.ground_confirmed_count >= 1, 'expected at least the one verified plot from this run to show up here');
      assert(typeof r.estate_totals.ground_confirmed_count === 'number', 'estate_totals should carry ground_confirmed_count');
    })
  );

  const pass = results.filter((r) => r.ok).length;
  console.log(`\nGround confirmation mock QA: ${pass}/${results.length} passed`);
  if (pass !== results.length) process.exit(1);
}

main();
