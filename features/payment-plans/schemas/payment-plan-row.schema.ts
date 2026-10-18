import { z } from 'zod';

export const PAYMENT_PLAN_STATUSES = [
  'active',
  'overdue',
  'suspended',
  'cancelled',
  'completed',
  'closed',
] as const;

export const PaymentPlanStatusSchema = z.enum(PAYMENT_PLAN_STATUSES);
export type PaymentPlanStatus = z.infer<typeof PaymentPlanStatusSchema>;

/** Mirrors `PLAN_ASSET_TYPES` on abode-be-v2 payment-plans-query.dto.ts. */
export const PAYMENT_PLAN_ASSET_TYPES = [
  'co-ownership',
  'flex',
  'full-ownership',
  'land-banking',
  'commercial',
  'developer_plot',
] as const;

export const PaymentPlanAssetTypeSchema = z.enum(PAYMENT_PLAN_ASSET_TYPES);
export type PaymentPlanAssetType = z.infer<typeof PaymentPlanAssetTypeSchema>;

/** Mirrors `PLAN_SORT_FIELDS` — unlisted keys are a 400 from the BE. */
export const PLAN_SORT_FIELDS = [
  'createdAt',
  'next_date_of_payment',
  'balance',
  'default_amount',
  'months_overdue',
  'amount_paid',
  'amount_payable',
] as const;

export type PlanSortField = (typeof PLAN_SORT_FIELDS)[number];

const PaymentPlanUserSchema = z.object({
  user_id: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone_number: z.string().nullable(),
  referral_status: z.string().nullable(),
  org_id: z.string().nullable(),
});

const PaymentPlanReferrerSchema = z.object({
  referrer_id: z.string().nullable(),
  referrer_first_name: z.string().nullable(),
  referrer_last_name: z.string().nullable(),
  referrer_email: z.string().nullable(),
});

const PaymentPlanAssetSchema = z.object({
  asset_id: z.string().nullable(),
  asset_name: z.string().nullable(),
  asset_location: z.string().nullable(),
  asset_type: z.string().nullable(),
});

/** `GET /admin/payment-plans` row — `PaymentPlanRowDto`. Extra keys are kept. */
export const PaymentPlanRowSchema = z.looseObject({
  id: z.string(),
  user: PaymentPlanUserSchema,
  referrer: PaymentPlanReferrerSchema,
  asset: PaymentPlanAssetSchema,

  no_of_units: z.number(),
  size: z.number().nullable(),
  unique_asset_id: z.string().nullable(),
  block: z.string().nullable(),
  plot: z.string().nullable(),

  amount_payable: z.number(),
  amount_paid: z.number(),
  balance: z.number(),
  initial_payment: z.number(),
  month_subscription: z.number(),
  asset_price: z.number(),
  land_price: z.number().nullable(),
  document_price: z.number().nullable(),

  months_covered: z.number(),
  month_remaining: z.number(),
  months_overdue: z.number(),

  default_amount: z.number(),
  default_count: z.number(),

  next_date_of_payment: z.string().nullable(),
  start_date: z.string().nullable(),
  plan_completed_at: z.string().nullable(),
  suspended_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  closed_at: z.string().nullable().optional(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),

  status: PaymentPlanStatusSchema,
  suspension_reason: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  closure_reason: z.string().nullable().optional(),
  contract_signed: z.boolean(),

  first_statement_sent: z.boolean(),
  final_statement_sent: z.boolean(),
  contract_of_sales_sent: z.boolean(),
  certificate_of_subscription_sent: z.boolean(),
  completion_certificate_sent: z.boolean(),
  allocation_document_sent: z.boolean(),
  congratulations_sent: z.boolean(),
  terms_sent: z.boolean(),
  purchase_confirmation_email_sent: z.boolean(),
});

export type PaymentPlanRow = z.infer<typeof PaymentPlanRowSchema>;
export type PaymentPlanUser = z.infer<typeof PaymentPlanUserSchema>;
export type PaymentPlanReferrer = z.infer<typeof PaymentPlanReferrerSchema>;
