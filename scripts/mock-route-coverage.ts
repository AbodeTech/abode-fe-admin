/**
 * Mock coverage audit — which REST calls the app makes that mock mode cannot answer.
 * Run: npx tsx scripts/mock-route-coverage.ts [--all]
 *
 * Reads every `apiGet / apiGetPaged / apiPost / apiPut / apiPatch / apiDelete`
 * call whose first argument is a string or template literal, turns `${…}` into a
 * path parameter, and asks the router whether "METHOD /path" is registered. A hit
 * list here is a page that shows "Mock API: no route registered…" when someone signs
 * in with a role that opens it (that is how the Manager Performance gap was found).
 *
 * Static, so it cannot see a path held in a variable: those are counted, not checked.
 * Not every gap is a bug. Streaming CSV exports are deliberately unmocked (their hooks
 * refuse in mock mode), and a few features run against the real BE only (field staff);
 * both are tagged below rather than hidden. `--all` also lists the covered calls.
 */
import fs from 'node:fs';
import path from 'node:path';

import { hasMockRoute } from '../lib/mocks/router';
import { ensureRoutesRegistered } from '../lib/mocks/routes';

ensureRoutesRegistered();

const ROOT = path.resolve(__dirname, '..');
const SCAN = ['features', 'hooks', 'lib', 'app', 'components', 'actions', 'store'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'mocks']);

const METHODS: Record<string, string> = {
  apiGet: 'GET',
  apiGetPaged: 'GET',
  apiGetWithMeta: 'GET',
  apiGetPagedWithAggregates: 'GET',
  apiPost: 'POST',
  apiPut: 'PUT',
  apiPatch: 'PATCH',
  apiDelete: 'DELETE',
};

const CALL = /\b(apiGetPagedWithAggregates|apiGetPaged|apiGetWithMeta|apiGet|apiPost|apiPut|apiPatch|apiDelete)\(\s*(`[^`]*`|'[^']*'|"[^"]*"|[A-Za-z_$][\w$.]*)/g;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      yield path.join(dir, entry.name);
    }
  }
}

type Call = { method: string; url: string; file: string; line: number };

const calls: Call[] = [];
let dynamic = 0;

for (const top of SCAN) {
  const dir = path.join(ROOT, top);
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(CALL)) {
      const [, fn, arg] = match;
      if (!/^[`'"]/.test(arg)) {
        dynamic += 1;
        continue;
      }
      // `${id}` between slashes is a path parameter; one glued to a word (`/costs${suffix}`)
      // is an optional tail, so it is dropped rather than turned into a bogus segment.
      const url = arg
        .slice(1, -1)
        .replace(/(?<=[\w-])\$\{[^}]*\}/g, '')
        .replace(/\$\{[^}]*\}/g, 'x')
        .split('?')[0];
      if (!url.startsWith('/')) {
        dynamic += 1;
        continue;
      }
      const line = text.slice(0, match.index).split('\n').length;
      calls.push({ method: METHODS[fn], url, file: path.relative(ROOT, file).replace(/\\/g, '/'), line });
    }
  }
}

/** Gaps that are intentional, so the list shows only what needs a decision. */
const KNOWN: Array<[RegExp, string]> = [
  [/\/export|\/exports\b/, 'CSV export (streams on the BE; the hook refuses in mock mode)'],
  [/^\/admin\/(field-|assets\/x\/(site-setup|boundary|field))/, 'field staff: real BE only'],
];

const seen = new Set<string>();
const missing: Array<Call & { note?: string }> = [];
let covered = 0;

for (const call of calls) {
  const key = `${call.method} ${call.url}`;
  if (hasMockRoute(call.method, call.url)) {
    covered += 1;
    if (process.argv.includes('--all') && !seen.has(key)) console.log(`ok       ${key}`);
    seen.add(key);
    continue;
  }
  if (seen.has(`gap ${key}`)) continue;
  seen.add(`gap ${key}`);
  missing.push({ ...call, note: KNOWN.find(([re]) => re.test(call.url))?.[1] });
}

const byArea = new Map<string, typeof missing>();
for (const gap of missing) {
  const area = gap.file.split('/').slice(0, gap.file.startsWith('features/') ? 2 : 1).join('/');
  byArea.set(area, [...(byArea.get(area) ?? []), gap]);
}

for (const [area, gaps] of [...byArea].sort()) {
  console.log(`\n${area}`);
  for (const gap of gaps) {
    console.log(`  ${gap.note ? '(known)' : 'GAP    '} ${gap.method.padEnd(6)} ${gap.url}${gap.note ? `   — ${gap.note}` : ''}   [${gap.file}:${gap.line}]`);
  }
}

const real = missing.filter((g) => !g.note);
console.log(
  `\n${calls.length} literal call sites, ${covered} covered, ${missing.length} unmocked (${real.length} unexplained, ${missing.length - real.length} known); ${dynamic} calls build their path in a variable and were not checked.`,
);
