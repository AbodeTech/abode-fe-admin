import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const loadDependency = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const ts = loadDependency(root + '/node_modules/typescript');
function load(file) {
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: compiledModule, exports: compiledModule.exports, require: name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : loadDependency(root + '/node_modules/' + name) });
  return compiledModule.exports;
}
const s = load(root + '/features/finance-automation/schemas/workflows.schema.ts');
const clean = value => JSON.parse(JSON.stringify(value));
const filters = { page: 2, limit: 20, status: 'completed', posting_status: 'failed', kind: 'wht', bank_key: 'gtbank', handler: 'new_sale', spreadsheet_id: 'sheet', sheet_gid: 0 };
assert.deepEqual(clean(s.runParams('revenue', filters)), { page: 2, limit: 20, kind: 'revenue_report' });
assert.deepEqual(clean(s.runParams('expenseReport', filters)), { page: 2, limit: 20, kind: 'expense_report' });
assert.deepEqual(clean(s.postingParams('payouts', filters)), { page: 2, limit: 20, spreadsheet_id: 'sheet', sheet_gid: 0, status: 'failed', kind: 'wht' });
assert.deepEqual(clean(s.postingParams('income', filters)), { page: 2, limit: 20, spreadsheet_id: 'sheet', sheet_gid: 0, posting_status: 'failed', bank_key: 'gtbank', handler: 'new_sale' });
const income = { bank_key: 'gtbank', start_date: '2026-10-01', end_date: '2026-10-07', dry_run: true };
assert(s.IncomeRequestSchema.safeParse(income).success);
assert(!s.IncomeRequestSchema.safeParse({ ...income, end_date: '2026-09-30' }).success);
assert(!s.IncomeRequestSchema.safeParse({ ...income, only_row: 1 }).success);
const payout = { kind: 'wht', spreadsheet_id: 'a'.repeat(30), sheet_gid: 0, dry_run: true };
assert(s.PayoutRequestSchema.safeParse(payout).success);
assert(!s.PayoutRequestSchema.safeParse({ ...payout, limit: 1001 }).success);
assert.equal(s.PayoutRequestSchema.parse({ ...payout, start_date: '2026-10-01' }).start_date, undefined);
const revenue = { spreadsheet_id: 'a'.repeat(30), source_gids: [0, 123], report_gid: 456, dry_run: true };
assert(s.RevenueRequestSchema.safeParse(revenue).success);
assert(!s.RevenueRequestSchema.safeParse({ ...revenue, source_gids: [] }).success);
assert(!s.RevenueRequestSchema.safeParse({ ...revenue, source_gids: [NaN] }).success);
assert(s.ExpenseReportRequestSchema.safeParse({ spreadsheet_id: 'a'.repeat(30), report_gid: 0, missing: 'flag', dry_run: true }).success);
for (const kind of ['income_posting', 'payout_posting', 'expense_report', 'revenue_report']) {
 assert(s.WorkflowRunSchema.safeParse({ run_id: 'run', kind, status: 'completed', requested_by_email: null, params: { dryRun: true, organization_id: 'org' }, summary: { dry_run: true, cells_planned: 12 }, error: null, started_at: null, finished_at: null, createdAt: '2026-10-07' }).success);
}
console.log('Finance contract checks passed: request validation, DTO field isolation, payout status mapping, report filters, and all run response types.');
