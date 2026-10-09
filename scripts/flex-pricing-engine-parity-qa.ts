/**
 * Flex 2.0 pricing engine — UI vs backend parity.
 * Run: npx tsx scripts/flex-pricing-engine-parity-qa.ts
 *
 * The editor previews prices in the browser (features/assets/lib/flex-pricing.ts);
 * the backend (abode-be-v2, flex-pricing.engine.ts) is the authority. They must agree
 * to the kobo, or an admin sees one number in the preview and publishes another.
 * This loads both and compares every row over a wide spread of configurations, and
 * checks they accept and reject the same inputs.
 *
 * The backend path defaults to the usual local clone; override with
 *   BE_ENGINE_PATH=/path/to/abode-be-v2/src/modules/asset/flex-pricing/flex-pricing.engine.ts
 * The script skips (exit 0, says so) when the backend source isn't there.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { basePlanPayments, previewRows, validatePricing } from '../features/assets/lib/flex-pricing';

const BE_ENGINE_PATH = resolve(
  process.env.BE_ENGINE_PATH ??
    'C:/Users/user/Desktop/Abode-Combine/Abode-Backend/abode-be-v2/src/modules/asset/flex-pricing/flex-pricing.engine.ts'
);

type BackendRow = {
  months: number;
  is_base: boolean;
  is_checkpoint: boolean;
  discount_pct: number;
  total: number;
  regular_payment: number;
  final_payment: number;
  largest_payment: number;
};
type BackendInput = { base_price_per_unit: number; checkpoints: { months: number; discount_pct: number }[] };
/** Just the parts of the backend engine this check calls (the backend isn't a dependency of this repo). */
type BackendEngine = {
  previewRows: (input: BackendInput) => BackendRow[];
  basePayments: (input: BackendInput) => { first_payment: number; monthly_payment: number; final_payment: number };
  validateBasePlan: (input: Partial<BackendInput>) => unknown[];
};

type Cfg = { price: number; d24: number; d12: number };

// A seeded generator so a failure reproduces.
let seed = 20261008;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const twoDp = (n: number) => Math.round(n * 100) / 100;

function configs(): Cfg[] {
  const out: Cfg[] = [
    { price: 3_600_000, d24: 5, d12: 15 },
    { price: 1_000_000, d24: 0, d12: 0 },
    { price: 1, d24: 0, d12: 99.99 },
    { price: 0.01, d24: 99.99, d12: 99.99 },
    { price: 999_999_999_999.99, d24: 33.33, d12: 66.67 },
    { price: 1_234_567.89, d24: 3.33, d12: 11.11 },
  ];
  for (let i = 0; i < 4000; i++) {
    const d24 = twoDp(rand() * 60);
    const d12 = twoDp(d24 + rand() * (99.99 - d24));
    out.push({ price: twoDp(1 + rand() * 500_000_000), d24, d12 });
  }
  return out;
}

async function main() {
  if (!existsSync(BE_ENGINE_PATH)) {
    console.log(`SKIP: backend engine not found at ${BE_ENGINE_PATH} (set BE_ENGINE_PATH to run this check)`);
    return;
  }
  const be = (await import(pathToFileURL(BE_ENGINE_PATH).href)) as BackendEngine;

  let rows = 0;
  let rejected = 0;
  const problems: string[] = [];
  const fail = (msg: string) => {
    if (problems.length < 15) problems.push(msg);
  };

  for (const c of configs()) {
    const input = { base_price_per_unit: c.price, discount_24_pct: c.d24, discount_12_pct: c.d12 };
    const beInput = {
      base_price_per_unit: c.price,
      checkpoints: [
        { months: 24, discount_pct: c.d24 },
        { months: 12, discount_pct: c.d12 },
      ],
    };

    // The backend's previewRows assumes validated input (its callers validate first), so decide
    // acceptance with each side's validator, then compare rows only for inputs both accept.
    const uiAccepts = validatePricing(input).length === 0;
    const beAccepts = be.validateBasePlan(beInput).length === 0;
    if (uiAccepts !== beAccepts) {
      fail(`${JSON.stringify(c)}: ui ${uiAccepts ? 'accepts' : 'rejects'} but backend ${beAccepts ? 'accepts' : 'rejects'}`);
      continue;
    }
    if (!uiAccepts) {
      rejected++;
      continue;
    }

    const mine = previewRows(input);
    const theirs = be.previewRows(beInput);
    if (mine.length !== theirs.length) {
      fail(`${JSON.stringify(c)}: row count ${mine.length} vs ${theirs.length}`);
      continue;
    }
    for (let i = 0; i < mine.length; i++) {
      rows++;
      for (const key of ['months', 'is_base', 'is_checkpoint', 'discount_pct', 'total', 'regular_payment', 'final_payment', 'largest_payment'] as const) {
        if (mine[i][key] !== theirs[i][key]) fail(`${JSON.stringify(c)} @${mine[i].months}mo ${key}: ui ${mine[i][key]} vs backend ${theirs[i][key]}`);
      }
    }

    const a = basePlanPayments(input);
    const b = be.basePayments(beInput);
    if (!a || a.first_payment !== b.first_payment || a.monthly_payment !== b.monthly_payment || a.final_payment !== b.final_payment) {
      fail(`${JSON.stringify(c)}: base payments differ`);
    }
  }

  // The two must also agree on what is acceptable at all.
  const accepts: [number | undefined, number | undefined, number | undefined][] = [
    [3_600_000, 5, 15], [3_600_000, 15, 5], [0, 5, 15], [-1, 5, 15], [100.123, 5, 15], [100, 100, 100], [100, -1, 5],
    [100, 5.555, 6], [100, 5, 100], [100, 10, 10], [100, 0, 0], [undefined, 5, 15], [100, undefined, 15], [100, 5, undefined],
  ];
  for (const [price, d24, d12] of accepts) {
    const uiOk = price !== undefined && d24 !== undefined && d12 !== undefined && validatePricing({ base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 }).length === 0;
    const beOk =
      price !== undefined &&
      d24 !== undefined &&
      d12 !== undefined &&
      be.validateBasePlan({ base_price_per_unit: price, checkpoints: [{ months: 24, discount_pct: d24 }, { months: 12, discount_pct: d12 }] }).length === 0;
    if (uiOk !== beOk) fail(`validity differs for price=${price} d24=${d24} d12=${d12}: ui ${uiOk} vs backend ${beOk}`);
  }

  if (problems.length > 0) {
    console.log(`FAIL: UI and backend engines disagree\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `PASS: ${rows.toLocaleString()} rows match to the kobo; both engines accepted and rejected the same ${configs().length.toLocaleString()} generated configurations ` +
      `(${rejected.toLocaleString()} rejected by both) and ${accepts.length} edge inputs`
  );
}

main();
