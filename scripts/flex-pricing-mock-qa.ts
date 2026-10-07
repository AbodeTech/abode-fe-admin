/**
 * Flex 2.0 base-plan pricing — engine + mock API verification.
 * Run: npx tsx scripts/flex-pricing-mock-qa.ts
 *
 * Checks (1) the editor's pricing engine against the reference vectors in
 * docs/FLEX-2.0-ENDPOINTS.pdf §3.4, (2) that the engine and the mock server's
 * independently written arithmetic agree to the kobo, and (3) the whole
 * publish / conflict / convert / history flow, so the UI can be built on the
 * mock with the contract's behaviour already proven.
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { flexPricingRoutes } from '../lib/mocks/routes/flex-pricing';
import { basePlanPayments, previewRows, validatePricing } from '../features/assets/lib/flex-pricing';

registerRoutes(assetRoutes);
registerRoutes(flexPricingRoutes);

const A1 = '665faaaa00000000000000a1'; // Aviation City — Flex with 3 sizes (2 seeded on a base plan, 1 on a tenor list)

async function call(method: string, path: string, body?: unknown, query: Record<string, unknown> = {}) {
  return dispatchMockRoute({ method, path, query, body });
}

type Result = { id: string; ok: boolean; error?: string };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false, error: msg };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number, code: string) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status && e.code === code) return;
    throw new Error(`expected ${status} ${code}, got ${e instanceof MockHttpError ? `${e.statusCode} ${e.code}` : (e as Error).message}`);
  }
  throw new Error(`expected ${status} ${code}, but the call succeeded`);
}

const input = (base: number, d24: number, d12: number) => ({ base_price_per_unit: base, discount_24_pct: d24, discount_12_pct: d12 });
const body = (base: number, d24: number, d12: number) => ({
  base_price_per_unit: base,
  checkpoints: [
    { months: 24, discount_pct: d24 },
    { months: 12, discount_pct: d12 },
  ],
});

async function main() {
  const results: Result[] = [];

  /* ---------------- engine: contract reference vectors ---------------- */
  results.push(
    await run('ENG-vectors-3.6M-5-15', async () => {
      const rows = previewRows(input(3_600_000, 5, 15));
      assert(rows.length === 25, `expected 25 rows (36..12), got ${rows.length}`);
      const at = (n: number) => rows.find((r) => r.months === n)!;
      const expected: [number, number, number, number, number][] = [
        [36, 0, 3_600_000, 100_000, 100_000],
        [30, 2.5, 3_510_000, 117_000, 117_000],
        [24, 5, 3_420_000, 142_500, 142_500],
        [22, 6.6667, 3_360_000, 152_727.27, 152_727.33],
        [18, 10, 3_240_000, 180_000, 180_000],
        [12, 15, 3_060_000, 255_000, 255_000],
      ];
      for (const [n, d, total, regular, final] of expected) {
        const r = at(n);
        assert(r.discount_pct === d, `${n}mo discount ${r.discount_pct} !== ${d}`);
        assert(r.total === total, `${n}mo total ${r.total} !== ${total}`);
        assert(r.regular_payment === regular, `${n}mo regular ${r.regular_payment} !== ${regular}`);
        assert(r.final_payment === final, `${n}mo final ${r.final_payment} !== ${final}`);
      }
      const r35 = at(35);
      assert(r35.total === 3_585_000 && r35.regular_payment === 102_428.57 && r35.final_payment === 102_428.62, '35mo vector');
      assert(r35.discount_pct === 0.4167, `35mo discount ${r35.discount_pct}`);
    })
  );

  results.push(
    await run('ENG-decisions-rounding-example', async () => {
      const base = basePlanPayments(input(1_000_000, 0, 0));
      assert(base?.monthly_payment === 27_777.77, `monthly ${base?.monthly_payment}`);
      assert(base?.final_payment === 27_778.05, `final ${base?.final_payment}`);
      assert(base?.first_payment === base?.monthly_payment, 'first payment equals monthly (D02)');
    })
  );

  results.push(
    await run('ENG-payments-always-sum-to-total', async () => {
      for (const cfg of [input(1_234_567.89, 3.33, 11.11), input(999_999.99, 0, 0), input(5_000_000, 12.5, 12.5), input(1, 0, 99.99)]) {
        for (const row of previewRows(cfg)) {
          const kobo = (x: number) => Math.round(x * 100);
          const sum = kobo(row.regular_payment) * (row.months - 1) + kobo(row.final_payment);
          assert(sum === kobo(row.total), `${cfg.base_price_per_unit} @${row.months}: ${sum} !== ${kobo(row.total)}`);
          assert(row.largest_payment >= row.regular_payment && row.largest_payment >= row.final_payment, 'largest payment');
        }
      }
    })
  );

  /* ---------------- engine: validation ---------------- */
  results.push(
    await run('ENG-validation-rules', async () => {
      assert(validatePricing(input(3_600_000, 5, 15)).length === 0, 'valid input flagged');
      const order = validatePricing(input(3_600_000, 15, 5));
      assert(order.length === 1 && order[0].code === 'DISCOUNT_ORDER_INVALID', 'discount order not caught');
      assert(order[0].message.includes('24-month discount (15%)') && order[0].message.includes('12-month discount (5%)'), `message: ${order[0].message}`);
      assert(validatePricing(input(0, 5, 15))[0].code === 'BASE_PRICE_INVALID', 'zero price');
      assert(validatePricing(input(100.123, 5, 15))[0].code === 'BASE_PRICE_INVALID', '3dp price');
      assert(validatePricing(input(1000, 5, 100)).some((e) => e.code === 'DISCOUNT_OUT_OF_RANGE'), '100% discount');
      assert(validatePricing(input(1000, -1, 5)).some((e) => e.code === 'DISCOUNT_OUT_OF_RANGE'), 'negative discount');
      assert(validatePricing({ discount_24_pct: 5, discount_12_pct: 15 }).some((e) => e.field === 'base_price_per_unit'), 'missing price');
      assert(previewRows(input(3_600_000, 15, 5)).length === 0, 'invalid input must not produce rows');
      // equal discounts are allowed (a flat discount is not a price rise)
      assert(validatePricing(input(3_600_000, 10, 10)).length === 0, 'equal discounts rejected');
    })
  );

  /* ---------------- engine vs mock server ---------------- */
  results.push(
    await run('AGREE-engine-matches-server-preview', async () => {
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      const size = asset.offers.find((o: any) => o.offer_type === 'flex').sizes[0];
      for (const cfg of [input(3_600_000, 5, 15), input(1_234_567.89, 3.33, 11.11), input(1_000_000, 0, 0), input(87_654_321.01, 7.25, 19.99)]) {
        const server: any = await call('POST', `/admin/assets/${A1}/offers/flex/sizes/${size._id}/pricing/preview`, body(cfg.base_price_per_unit, cfg.discount_24_pct, cfg.discount_12_pct));
        assert(server.valid === true, 'server marked a valid config invalid');
        const mine = previewRows(cfg);
        assert(server.rows.length === mine.length, 'row count differs');
        server.rows.forEach((row: any, i: number) => {
          for (const key of ['months', 'discount_pct', 'total', 'regular_payment', 'final_payment', 'largest_payment', 'is_base', 'is_checkpoint'] as const) {
            assert(row[key] === (mine[i] as any)[key], `${cfg.base_price_per_unit} ${row.months}mo ${key}: server ${row[key]} vs engine ${(mine[i] as any)[key]}`);
          }
        });
        const base = basePlanPayments(cfg)!;
        assert(server.monthly_payment === base.monthly_payment && server.final_payment === base.final_payment, 'base payments differ');
      }
    })
  );

  results.push(
    await run('AGREE-server-preview-rejects-invalid', async () => {
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      const size = asset.offers.find((o: any) => o.offer_type === 'flex').sizes[0];
      const out: any = await call('POST', `/admin/assets/${A1}/offers/flex/sizes/${size._id}/pricing/preview`, body(3_600_000, 15, 5));
      assert(out.valid === false && out.rows.length === 0, 'invalid preview should be valid:false with no rows');
      assert(out.errors[0].code === 'DISCOUNT_ORDER_INVALID', `code ${out.errors[0]?.code}`);
    })
  );

  /* ---------------- detail tree ---------------- */
  let flexSizes: any[] = [];
  results.push(
    await run('TREE-sizes-carry-pricing-mode', async () => {
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      flexSizes = asset.offers.find((o: any) => o.offer_type === 'flex').sizes;
      assert(flexSizes[0].pricing_mode === 'base_plan' && flexSizes[1].pricing_mode === 'base_plan', 'first two sizes should be base_plan');
      assert(flexSizes[2].pricing_mode === 'tenor_list', 'third size should stay on its tenor list');
      const p = flexSizes[0].pricing;
      assert(p.live_version === 2 && p.base_tenor_months === 36, 'live version / base tenor');
      assert(p.checkpoints.length === 2 && p.checkpoints[0].months === 24 && p.checkpoints[1].months === 12, 'checkpoints');
      assert(p.first_payment === p.monthly_payment, 'first payment equals monthly');
      assert(flexSizes[0].plans.length === 0, 'base-plan size returns plans: []');
      assert(flexSizes[2].plans.length > 0 && flexSizes[2].pricing === null, 'tenor-list size keeps plans[] and pricing null');
      const fo = asset.offers.find((o: any) => o.offer_type === 'full-ownership');
      assert(fo.sizes.every((s: any) => s.pricing_mode === 'tenor_list' && s.pricing === null && s.plans.length > 0), 'FO sizes untouched');
    })
  );

  /* ---------------- GET pricing ---------------- */
  const P = (sizeId: string, suffix = '') => `/admin/assets/${A1}/offers/flex/sizes/${sizeId}/pricing${suffix}`;

  results.push(
    await run('GET-pricing-base-plan', async () => {
      const out: any = await call('GET', P(flexSizes[0]._id));
      assert(out.limits.base_tenor_months === 36 && out.limits.min_tenor_months === 12, 'limits');
      assert(JSON.stringify(out.limits.checkpoint_months) === '[24,12]', 'checkpoint months fixed at 24 and 12');
      assert(out.live.version === 2 && out.live.based_on_version === 1 && out.live.status === 'live', 'live version');
      assert(out.draft === null && out.legacy === null, 'no draft, no legacy');
      assert(!('max_tenor_months' in out.limits), 'no max tenor (D01)');
    })
  );

  results.push(
    await run('GET-pricing-tenor-list-has-legacy-prefill', async () => {
      const out: any = await call('GET', P(flexSizes[2]._id));
      assert(out.pricing_mode === 'tenor_list' && out.live === null, 'mode / live');
      assert(typeof out.legacy.tenor_36_land_price === 'number', 'legacy 36-month price missing');
      assert(out.legacy.active_tenors.includes(36), 'legacy tenors');
    })
  );

  /* ---------------- draft ---------------- */
  results.push(
    await run('DRAFT-save-and-discard', async () => {
      const saved: any = await call('PUT', P(flexSizes[0]._id, '/draft'), body(3_700_000, 6, 16));
      assert(saved.next_version === 3 && saved.based_on_version === 2, `draft ${saved.next_version} based on ${saved.based_on_version}`);
      const out: any = await call('GET', P(flexSizes[0]._id));
      assert(out.draft?.base_price_per_unit === 3_700_000, 'draft not returned');
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      assert(asset.offers.find((o: any) => o.offer_type === 'flex').sizes[0].pricing.has_draft === true, 'has_draft flag');
      await call('DELETE', P(flexSizes[0]._id, '/draft'));
      const after: any = await call('GET', P(flexSizes[0]._id));
      assert(after.draft === null, 'draft not discarded');
    })
  );

  /* ---------------- publish ---------------- */
  results.push(
    await run('PUB-validation-blocks-bad-input', async () => {
      await expectError(
        () => call('POST', P(flexSizes[0]._id, '/publish'), { ...body(3_600_000, 15, 5), expected_live_version: 2 }),
        400,
        'PRICING_VALIDATION_FAILED'
      );
      const out: any = await call('GET', P(flexSizes[0]._id));
      assert(out.live.version === 2, 'a rejected publish must not create a version');
    })
  );

  results.push(
    await run('PUB-stale-version-conflicts', async () => {
      await expectError(
        () => call('POST', P(flexSizes[0]._id, '/publish'), { ...body(3_600_000, 5, 15), expected_live_version: 1 }),
        409,
        'PRICING_VERSION_CONFLICT'
      );
    })
  );

  results.push(
    await run('PUB-creates-v3-supersedes-v2-and-logs', async () => {
      const out: any = await call('POST', P(flexSizes[0]._id, '/publish'), { ...body(3_600_000, 6, 16), expected_live_version: 2 });
      assert(out.version === 3 && out.based_on_version === 2 && out.status === 'live', 'published version');
      assert(out.monthly_payment === 100_000 && out.first_payment === 100_000, 'calculated payments');
      const versions: any = await call('GET', P(flexSizes[0]._id, '/versions'));
      assert(versions.data.length === 3 && versions.data[0].version === 3, 'versions newest first');
      assert(versions.data.find((v: any) => v.version === 2).status === 'superseded', 'v2 superseded');
      const v1: any = await call('GET', P(flexSizes[0]._id, '/versions/1'));
      assert(v1.purchase_count === 11 && v1.pending_transfer_count === 2, 'v1 keeps its purchase counts');
      await expectError(() => call('GET', P(flexSizes[0]._id, '/versions/99')), 404, 'PRICING_VERSION_NOT_FOUND');

      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      const entry = history.data[0];
      assert(entry.action === 'publish-pricing' && entry.pricing_version === 3 && entry.size_id === flexSizes[0]._id, 'history entry');
      assert(entry.summary.includes('Pricing v3') && entry.summary.includes('6% @ 24, 16% @ 12'), `summary: ${entry.summary}`);
      assert(entry.superseded === false && entry.purchase_count === 0, 'live version is not superseded');
    })
  );

  results.push(
    await run('PUB-earlier-entry-marked-superseded', async () => {
      await call('POST', P(flexSizes[0]._id, '/publish'), { ...body(3_700_000, 6, 16), expected_live_version: 3 });
      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      const v3 = history.data.find((h: any) => h.pricing_version === 3);
      const v4 = history.data.find((h: any) => h.pricing_version === 4);
      assert(v3.superseded === true && v4.superseded === false, 'superseded markers');
    })
  );

  results.push(
    await run('PUB-refused-on-tenor-list-size', async () => {
      await expectError(
        () => call('POST', P(flexSizes[2]._id, '/publish'), { ...body(3_600_000, 5, 15), expected_live_version: null }),
        409,
        'PRICING_MODE_CONFLICT'
      );
    })
  );

  /* ---------------- plan routes vs pricing mode ---------------- */
  results.push(
    await run('MODE-plan-routes-refused-on-base-plan-size', async () => {
      const plansPath = `/admin/assets/${A1}/offers/flex/sizes/${flexSizes[0]._id}/plans`;
      await expectError(() => call('POST', plansPath, { tenor_months: 18, land_price: 1, initial_payment: 1, monthly_installment: 0 }), 409, 'PRICING_MODE_BASE_PLAN');
      await expectError(() => call('PATCH', `${plansPath}/12`, { land_price: 5 }), 409, 'PRICING_MODE_BASE_PLAN');
      await expectError(() => call('DELETE', `${plansPath}/12`), 409, 'PRICING_MODE_BASE_PLAN');
      await expectError(() => call('PATCH', `/admin/assets/${A1}/offers/flex/sizes/${flexSizes[0]._id}`, { plans: [] }), 409, 'PRICING_MODE_BASE_PLAN');
    })
  );

  results.push(
    await run('MODE-plan-routes-still-work-on-tenor-list-size', async () => {
      const plansPath = `/admin/assets/${A1}/offers/flex/sizes/${flexSizes[2]._id}/plans`;
      const before: any = await call('GET', `/admin/assets/${A1}`);
      const tenors = before.offers.find((o: any) => o.offer_type === 'flex').sizes[2].plans.map((p: any) => p.tenor_months);
      assert(!tenors.includes(18), 'precondition');
      await call('POST', plansPath, { tenor_months: 18, land_price: 2_000_000, initial_payment: 100_000, monthly_installment: 111_765 });
      await call('DELETE', `${plansPath}/18`);
    })
  );

  /* ---------------- convert legacy ---------------- */
  results.push(
    await run('CONV-tenor-list-to-base-plan', async () => {
      const prefill: any = await call('GET', P(flexSizes[2]._id));
      const price = prefill.legacy.tenor_36_land_price as number;
      const out: any = await call('POST', P(flexSizes[2]._id, '/convert-legacy'), body(price, 5, 15));
      assert(out.version.version === 1 && out.version.based_on_version === null, 'converted size starts at v1');
      assert(out.size.pricing_mode === 'base_plan' && out.size.plans.length === 0, 'size summary');

      const asset: any = await call('GET', `/admin/assets/${A1}`);
      const size = asset.offers.find((o: any) => o.offer_type === 'flex').sizes[2];
      assert(size.pricing_mode === 'base_plan' && size.pricing.live_version === 1 && size.plans.length === 0, 'tree reflects conversion');

      const history: any = await call('GET', `/admin/assets/${A1}/offers/history`);
      assert(history.data[0].action === 'convert-pricing', 'history entry for conversion');

      await expectError(() => call('POST', P(flexSizes[2]._id, '/convert-legacy'), body(price, 5, 15)), 409, 'PRICING_MODE_CONFLICT');
      await expectError(
        () => call('POST', `/admin/assets/${A1}/offers/flex/sizes/${flexSizes[2]._id}/plans`, { tenor_months: 18, land_price: 1, initial_payment: 1, monthly_installment: 0 }),
        409,
        'PRICING_MODE_BASE_PLAN'
      );
    })
  );

  /* ---------------- unpriced size ---------------- */
  results.push(
    await run('UNPRICED-flex-size-without-plans', async () => {
      const created: any = await call('POST', `/admin/assets/${A1}/offers/flex/sizes`, { size_sqm: 777, units_available: 4 });
      const asset: any = await call('GET', `/admin/assets/${A1}`);
      const size = asset.offers.find((o: any) => o.offer_type === 'flex').sizes.find((s: any) => s._id === created._id);
      assert(size.pricing_mode === 'unpriced' && size.pricing === null && size.plans.length === 0, 'new Flex size should be unpriced');

      const pricing: any = await call('GET', P(created._id));
      assert(pricing.pricing_mode === 'unpriced' && pricing.live === null && pricing.legacy === null, 'unpriced pricing payload');

      const out: any = await call('POST', P(created._id, '/publish'), { ...body(2_400_000, 5, 15), expected_live_version: null });
      assert(out.version === 1, 'first publish is v1');
      await expectError(() => call('POST', P(created._id, '/publish'), { ...body(2_400_000, 5, 15), expected_live_version: null }), 409, 'PRICING_VERSION_CONFLICT');
    })
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main();
