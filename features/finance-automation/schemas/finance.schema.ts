import { z } from 'zod';

export const RunStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export const SummarySchema = z.looseObject({
  dry_run: z.boolean(), organization_id: z.string(),
  eligible: z.number(), posted: z.number(), failed: z.number(), flagged: z.number(),
  rows_on_sheet: z.number(), already_posted: z.number(),
  skipped: z.record(z.string(), z.number()),
  flagged_by_reason: z.record(z.string(), z.number()),
  unresolved_accounts: z.record(z.string(), z.number()),
  mixed_pairs: z.record(z.string(), z.number()),
  changed_after_posting: z.array(z.number()), stuck_rows: z.array(z.number()),
  failures: z.array(z.object({ row_number: z.number(), reason: z.string() })),
  journals: z.array(z.object({ row_number: z.number(), journal_id: z.string(), amount: z.number(), debit_account_name: z.string() })),
  limit_reached: z.boolean(), rows_not_reached: z.number(),
  sheet_cells_written: z.number().nullable(), sheet_sync_error: z.string().nullable(),
});
export const FinanceRunSchema = z.object({
  run_id: z.string(), kind: z.string(), status: RunStatusSchema,
  requested_by_email: z.string().nullable(),
  params: z.looseObject({
    spreadsheetId: z.string(), sheetGid: z.number(), startDate: z.string(),
    dryRun: z.boolean(), limit: z.number().optional(), organization_id: z.string(),
  }),
  summary: SummarySchema.nullable(), error: z.string().nullable(),
  started_at: z.string().nullable(), finished_at: z.string().nullable(), createdAt: z.string(),
});
export const PostingSchema = z.object({
  row_number: z.number(), status: z.string(), posting_status: z.string(),
  journal_id: z.string().nullable(), journal_date: z.string().nullable(), amount: z.number().nullable(),
  debit_account_name: z.string().nullable(), reference_number: z.string().nullable(),
  error: z.string().nullable(), posted_at: z.string().nullable(),
});
export const StartRunSchema = z.object({
  spreadsheet_id: z.string().regex(/^[A-Za-z0-9_-]{20,}$/, 'Enter the spreadsheet ID from its URL.'),
  sheet_gid: z.number().int().min(0),
  start_date: z.iso.date(),
  limit: z.number().int().min(1).max(1000).optional(),
  dry_run: z.boolean(),
});
export const QueuedRunSchema = z.object({ run_id: z.string(), status: z.literal('queued'), dry_run: z.boolean() });
export type StartRun = z.infer<typeof StartRunSchema>;
export type FinanceRun = z.infer<typeof FinanceRunSchema>;

export const RunFiltersSchema = z.object({ page: z.number(), limit: z.number(), status: RunStatusSchema.optional() });
export const PostingFiltersSchema = z.object({
  page: z.number(), limit: z.number(), posting_status: z.enum(['posting', 'posted', 'failed', 'flagged']).optional(),
  spreadsheet_id: z.string().optional(), sheet_gid: z.number().optional(),
});
export type RunFilters = z.infer<typeof RunFiltersSchema>;
export type PostingFilters = z.infer<typeof PostingFiltersSchema>;
