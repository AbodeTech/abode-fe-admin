import { z } from 'zod';

/* ============================================================
 * Commission ledger — GET /admin/commission/transactions
 *
 * Rows are denormalized payout legs (not the old GraphQL AdminTransactions
 * shape). Money is decimal naira. `rate_applied` is a fraction (0.05 = 5%).
 *
 * The BE also computes `aggregates` over the filtered set, but the global
 * TransformInterceptor only forwards `data` + `meta`, so aggregates never
 * reach the client — do not model them here until that changes.
 * ============================================================ */

export const COMMISSION_SOURCE_TYPES = [
  'direct',
  'upline',
  'topline',
  'agency',
  'founder',
  'wht',
] as const;

export const CommissionSourceTypeSchema = z.enum(COMMISSION_SOURCE_TYPES);
export type CommissionSourceType = z.infer<typeof CommissionSourceTypeSchema>;

export const COMMISSION_SOURCE_TYPE_LABELS: Record<CommissionSourceType, string> = {
  direct: 'Direct',
  upline: 'Upline',
  topline: 'Topline',
  agency: 'Agency',
  founder: 'Founder',
  wht: 'WHT',
};

export const CommissionTransactionRowSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  source_type: z.string().nullable(),
  referrer_id: z.string().nullable(),
  referrer_name: z.string().nullable(),
  referrer_email: z.string().nullable(),
  referrer_tin: z.string().nullable(),
  source_user_id: z.string().nullable(),
  source_user_name: z.string().nullable(),
  source_user_email: z.string().nullable(),
  asset_id: z.string().nullable(),
  asset_name: z.string().nullable(),
  rate_applied: z.number().nullable(),
  gross_commission: z.number().nullable(),
  wht_deducted: z.number().nullable(),
  net_commission: z.number().nullable(),
  tier_at_creation: z.string().nullable(),
  override_source: z.string().nullable(),
  commission_config_version: z.number().nullable(),
  status: z.string(),
});

export type CommissionTransactionRow = z.infer<typeof CommissionTransactionRowSchema>;
