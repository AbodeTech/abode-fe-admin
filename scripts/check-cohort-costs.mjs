// node scripts/check-cohort-costs.mjs [path-to-abode-be-v2]
// In-memory checks only: no live HTTP requests, database writes, or credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(relative, overrides = {}) {
  const file = path.isAbsolute(relative) ? relative : path.join(root, relative);
  const compiled = { exports: {} };
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true, jsx: ts.JsxEmit.ReactJSX } });
  assert.equal(result.diagnostics?.length ?? 0, 0, `Syntax error in ${file}`);
  vm.runInNewContext(result.outputText, { module: compiled, exports: compiled.exports, Date, Intl, setTimeout, clearTimeout, require: name => {
    if (name in overrides) return overrides[name];
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
    const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
    return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx', overrides);
  } }, { filename: file });
  return compiled.exports;
}
const s = load('features/recruitment/schemas/cohort-cost.schema.ts');
const clean = value => JSON.parse(JSON.stringify(value));
const { createCohortCostRoutes } = load('lib/mocks/routes/cohort-costs.ts');
const routes = createCohortCostRoutes(id => ['one', 'two'].includes(id));
const dispatch = (method, id, body, costId) => routes[`${method} /admin/academy/cohorts/:id/costs${costId ? '/:costId' : ''}`]({ params: { id, costId }, body, query: {} });
assert.equal(s.CohortCostsSchema.parse(dispatch('GET', 'one')).recorded, false);
for (const amount of [-1, 0.001, NaN, Infinity]) assert(!s.CreateCohortCostSchema.safeParse({ category: 'ads', amount }).success);
assert(!s.CohortCostFormSchema.safeParse({ category: 'ads', amount: '', description: '', incurred_on: '', reason: '' }).success, 'Blank must not become zero');
assert(!s.CreateCohortCostSchema.safeParse({ category: 'ads', amount: 1, incurred_on: '2026-02-30' }).success);
assert(!s.UpdateCohortCostSchema.safeParse({ amount: 20, reason: 'short' }).success);
assert(!s.DeleteCohortCostSchema.safeParse({}).success);
const calls = [], invalidations = [], cache = new Map();
const client = {
  apiGet: async (url, schema) => schema.parse(dispatch('GET', url.split('/')[4])),
  apiPost: async (url, input, schema) => { calls.push({ method: 'POST', url, input }); return schema.parse(dispatch('POST', url.split('/')[4], input)); },
  apiPatch: async (url, input, schema) => { calls.push({ method: 'PATCH', url, input }); return schema.parse(dispatch('PATCH', url.split('/')[4], input, url.split('/')[6])); },
  apiDelete: async (url, schema, config) => { calls.push({ method: 'DELETE', url, input: config.body }); return schema.parse(dispatch('DELETE', url.split('/')[4], config.body, url.split('/')[6])); },
};
const queryClient = { setQueryData: (key, data) => cache.set(JSON.stringify(key), data), invalidateQueries: ({ queryKey }) => { invalidations.push(clean(queryKey)); return Promise.resolve(); } };
const h = load('features/recruitment/hooks/use-cohort-costs.ts', {
  '@/lib/api-client': client,
  '@tanstack/react-query': { useQueryClient: () => queryClient, useQuery: options => options, useMutation: options => ({ ...options, isPending: false, mutateAsync: async input => { const data = await options.mutationFn(input); options.onSuccess(data); return data; } }) },
});
assert.equal(h.useCohortCosts('one', false).enabled, false, 'No unauthorized read');
const writes = h.useCohortCostWrites('one');
let data = await writes.create.mutateAsync({ category: 'ads', amount: 2500.50, incurred_on: '2026-11-26', current_tier: 'not-allowed' });
assert.equal(calls[0].input.amount, 2500.50, 'Send naira, not kobo');
assert.equal('current_tier' in calls[0].input, false, 'Only DTO fields are sent');
assert.equal(data.total.amount_minor, 250050);
assert.equal(s.cohortCostDate(data.entries[0].incurred_on), '2026-11-26', 'Lagos date must not shift back a day');
assert.equal(data.entries[0].incurred_on, '2026-11-25T23:00:00.000Z');
const firstId = data.entries[0].id;
data = await writes.create.mutateAsync({ category: 'facilitators', amount: 100 });
assert.equal(data.total.amount_minor, 260050);
assert.throws(() => dispatch('PATCH', 'two', { amount: 500, reason: 'Correct category total' }, firstId), /not found/);
data = await writes.update.mutateAsync({ id: firstId, input: { category: 'other', amount: 0, description: '', reason: 'This charge was waived' } });
assert.equal(data.entries.find(entry => entry.id === firstId).amount.amount_minor, 0);
assert.equal(data.total.amount_minor, 10000);
await assert.rejects(() => writes.remove.mutateAsync({ id: firstId, input: { reason: 'short' } }));
data = await writes.remove.mutateAsync({ id: data.entries.find(entry => entry.id !== firstId).id, input: { reason: 'Duplicate expense entry' } });
assert.equal(data.recorded, true, 'A recorded zero cost is different from no costs');
assert.equal(data.total.amount_minor, 0);
data = await writes.remove.mutateAsync({ id: firstId, input: { reason: 'Entry belongs to another cohort' } });
assert.equal(data.recorded, false);
assert.equal(calls.at(-1).input.reason, 'Entry belongs to another cohort', 'DELETE requires a body');
assert.equal(cache.get(JSON.stringify(['recruitment', 'cohort', 'one', 'costs'])).recorded, false);
assert.equal(invalidations.filter(key => JSON.stringify(key) === '["recruitment","analysis"]').length, 5);
assert.equal(writes.create.retry, false, 'Failed writes must not be retried automatically');

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let grants = new Set(['view_cohort_costs']);
const ui = load('features/recruitment/components/CohortCostsManager.tsx', {
  '@/hooks/use-admin-permission': { useAdminPermissions: () => ({ has: permission => grants.has(permission) }) },
  '@/lib/utils': { cn: (...args) => args.filter(Boolean).join(' ') },
  '../hooks/use-cohort-costs': { useCohortCosts: () => ({ data, isLoading: false, refetch: async () => {} }), useCohortCostWrites: () => writes },
});
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
assert(render(ui.CohortCostsButton, { cohortId: 'one' }).includes('View costs'));
assert(!render(ui.CohortCostsManager, { cohortId: 'one' }).includes('Add cost'));
grants = new Set(['manage_cohort_costs', 'view_cohort_costs']);
assert(render(ui.CohortCostsManager, { cohortId: 'one', initiallyAdding: true }).includes('inputMode="decimal"'));
assert(render(ui.CohortCostSetup, { cohort: { id: 'one', name: 'New cohort' }, onDone: () => {} }).includes('Continue to cohort'));
if (process.env.COST_PREVIEW_PATH) {
  const postcss = require('postcss');
  const tailwind = require('@tailwindcss/postcss');
  const css = await postcss([tailwind()]).process(fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8'), { from: path.join(root, 'app/globals.css') });
  const markup = render(ui.CohortCostSetup, { cohort: { id: 'one', name: 'November' }, onDone: () => {} });
  fs.writeFileSync(process.env.COST_PREVIEW_PATH, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css.css + fs.readFileSync(path.join(root, 'app/(dashboard)/dashboard.css'), 'utf8') + '</style></head><body>' + markup + '</body></html>');
}
grants = new Set();
assert.equal(render(ui.CohortCostsButton, { cohortId: 'one' }), '');

if (process.argv[2]) {
  const backend = path.resolve(process.argv[2]);
  const beRequire = createRequire(path.join(backend, 'package.json'));
  const { Types } = beRequire('mongoose');
  const costRows = [];
  const cohortId = String(new Types.ObjectId());
  const cohort = { _id: new Types.ObjectId(cohortId), programme_id: new Types.ObjectId() };
  const chain = value => ({ sort: () => chain(value), lean: () => chain(value), exec: async () => value });
  const costModel = {
    find: () => chain(costRows.filter(row => !row.deleted_at)),
    findOne: filter => chain(costRows.find(row => String(row._id) === String(filter._id) && !row.deleted_at)),
    create: async input => { const row = { ...input, _id: new Types.ObjectId(), createdAt: new Date(), updatedAt: new Date(), save: async () => {} }; costRows.push(row); return row; },
  };
  const { AcademyCohortCostService } = load(path.join(backend, 'src/modules/academy/academy-cohort-cost.service.ts'), {
    '@nestjs/common': { Injectable: () => target => target, NotFoundException: Error, Logger: class { error() {} } },
    '@nestjs/mongoose': { InjectModel: () => () => {} }, mongoose: beRequire('mongoose'),
    './schemas/cohort.schema': { Cohort: class {} },
    './schemas/cohort-cost.schema': { CohortCost: class {}, COHORT_COST_CATEGORIES: Object.keys(s.COHORT_COST_LABELS), COHORT_COST_CATEGORY_LABELS: s.COHORT_COST_LABELS },
    './academy.repository': { AcademyRepository: class {} },
  });
  const service = new AcademyCohortCostService(costModel, { findById: () => chain(cohort) }, { logAdminAction: async () => {} });
  let result = s.CohortCostsSchema.parse(clean(await service.create(cohortId, { category: 'ads', amount: 2500.50, incurred_on: '2026-11-26' }, null)));
  assert.equal(result.total.amount_minor, 250050);
  assert.equal(s.cohortCostDate(result.entries[0].incurred_on), '2026-11-26');
  const id = result.entries[0].id;
  result = s.CohortCostsSchema.parse(clean(await service.update(cohortId, id, { amount: 0, reason: 'The charge was waived' }, null)));
  assert.equal(result.recorded, true);
  result = s.CohortCostsSchema.parse(clean(await service.remove(cohortId, id, { reason: 'Remove this duplicate entry' }, null)));
  assert.equal(result.recorded, false);
  console.log('Local backend cost-service responses match the frontend schema.');
}
console.log('Cohort cost checks passed: CRUD, currency/date handling, validation, permissions, cache refresh and creation-step rendering.');
