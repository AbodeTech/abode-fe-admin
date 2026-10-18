import { z } from 'zod';
import { RunStatusSchema } from './finance.schema';

const sheet = z.string().regex(/^[A-Za-z0-9_-]{20,}$/, 'Enter the spreadsheet ID from its URL.');
const gid = z.number().int().min(0);
const limit = z.number().int().min(1).max(1000).optional();
const report = { spreadsheet_id: sheet, today: z.iso.date().optional(), dry_run: z.boolean(), report_gid: gid };
export const IncomeRequestSchema = z.object({
  bank_key: z.string().regex(/^[a-z0-9_-]{2,40}$/, 'Use the configured bank key, e.g. gtbank.'),
  start_date: z.iso.date(), end_date: z.iso.date(), only_row: z.number().int().min(2).optional(), limit, dry_run: z.boolean(),
}).refine(value => value.end_date >= value.start_date, { path: ['end_date'], message: 'End date must be on or after start date.' });
export const PayoutRequestSchema = z.object({ kind: z.enum(['commission', 'wht', 'withdrawal']), spreadsheet_id: sheet, sheet_gid: gid, limit, dry_run: z.boolean() });
export const RevenueRequestSchema = z.object({ ...report, source_gids: z.array(gid).min(1).max(10), audit_gid: gid.optional(), audit_mode: z.enum(['replace', 'off']).optional() });
export const ExpenseReportRequestSchema = z.object({ ...report, missing: z.enum(['flag', 'zero']).optional() });
export const workflows = {
  income: { label: 'Income', endpoint: 'income-runs', schema: IncomeRequestSchema },
  payouts: { label: 'Payouts', endpoint: 'payout-runs', schema: PayoutRequestSchema },
  revenue: { label: 'Revenue report', endpoint: 'revenue-reports', schema: RevenueRequestSchema },
  expenseReport: { label: 'Expense report', endpoint: 'expense-reports', schema: ExpenseReportRequestSchema },
} as const;
export type Workflow = keyof typeof workflows;
export type WorkflowRequest = z.infer<typeof IncomeRequestSchema> | z.infer<typeof PayoutRequestSchema> | z.infer<typeof RevenueRequestSchema> | z.infer<typeof ExpenseReportRequestSchema>;
export const WorkflowSchema = z.enum(['income', 'payouts', 'revenue', 'expenseReport']);
export const WorkflowRunSchema = z.object({
  run_id: z.string(), kind: z.string(), status: RunStatusSchema, requested_by_email: z.string().nullable(),
  params: z.looseObject({ dryRun: z.boolean(), organization_id: z.string() }),
  summary: z.looseObject({ dry_run: z.boolean() }).nullable(), error: z.string().nullable(),
  started_at: z.string().nullable(), finished_at: z.string().nullable(), createdAt: z.string(),
});
const posting = {
  row_number: z.number(), status: z.string(), posting_status: z.string(), amount: z.number().nullable(),
  journal_id: z.string().nullish(), error: z.string().nullish(), posted_at: z.string().nullish(),
};
export const IncomePostingSchema = z.object({ ...posting,
  bank_key: z.string().nullish(), handler: z.string().nullish(), product: z.string().nullish(),
  client: z.string().nullish(), location: z.string().nullish(), invoice_date: z.string().nullish(),
  customer_id: z.string().nullish(), invoice_id: z.string().nullish(), dev_levy_invoice_id: z.string().nullish(), payment_id: z.string().nullish(),
  invoice_reused: z.boolean(), reference_number: z.string().nullish(),
});
export const PayoutPostingSchema = z.object({ ...posting, kind: z.string(), name: z.string().nullish(), journal_date: z.string().nullish(), debit_account_id: z.string().nullish(), credit_account_id: z.string().nullish() });
export const WorkflowFiltersSchema = z.object({
  page: z.number().int().min(1), limit: z.number().int().min(1).max(100),
  status: RunStatusSchema.optional(), posting_status: z.enum(['posting', 'posted', 'failed', 'flagged', 'review']).optional(),
  spreadsheet_id: z.string().optional(), sheet_gid: gid.optional(), bank_key: z.string().optional(),
  kind: z.enum(['commission', 'wht', 'withdrawal']).optional(), handler: z.enum(['new_sale', 'continuing', 'ass_pro', 'dev_levy']).optional(),
});
export type WorkflowFilters = z.infer<typeof WorkflowFiltersSchema>;
export function runResource(workflow: Workflow) { return workflow === 'income' ? 'income-runs' : workflow === 'payouts' ? 'payout-runs' : 'report-runs'; }
export function runParams(workflow: Workflow, filters: WorkflowFilters) {
  const { page, limit, status } = filters;
  return workflow === 'income' || workflow === 'payouts' ? { page, limit, status } : { page, limit, kind: workflow === 'revenue' ? 'revenue_report' : 'expense_report' };
}
export function postingParams(workflow: Workflow, filters: WorkflowFilters) {
  const { page, limit, spreadsheet_id, sheet_gid, posting_status, kind, bank_key, handler } = filters;
  const shared = { page, limit, spreadsheet_id, sheet_gid };
  return workflow === 'payouts' ? { ...shared, status: posting_status, kind } : { ...shared, posting_status, bank_key, handler };
}
