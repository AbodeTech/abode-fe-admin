import { z } from 'zod';

/* ============================================================
 * Asset subscribers — GET /admin/assets/:id/subscribers (+ /export).
 *
 * Who bought into one asset. Transcribed from abode-be-v2
 * `asset-analytics/dto/asset-analytics-responses.dto.ts` (`SubscriberRowDto`)
 * and `asset-analytics-requests.dto.ts` (`SubscribersQueryDto`).
 *
 * ⚠ The BE also computes an `aggregates` block over the filtered set
 * (`SubscribersAggregateDto` — subscriber/plan counts, earnings, plots, sqm),
 * but the global `TransformInterceptor` rebuilds the envelope from `data`,
 * `message` and `meta` only, so `aggregates` is dropped before it reaches the
 * client. The same thing happens to the commission ledger — see the note on
 * `features/transactions/schemas/commission-transaction.schema.ts`. It is
 * therefore NOT modelled here: the summary strip above the table is computed
 * from `meta.total` plus the rows on the current page, and is labelled as
 * page-scoped. Model it for real once the BE forwards the block.
 *
 * Amounts are decimal naira. `payment_percentage` is a **string** on purpose
 * (v1 compatibility), so it is parsed as one and coerced at the display edge.
 * ============================================================ */

/** v1's four subscriber buckets, unchanged. */
export const SUBSCRIBER_TYPES = ['suspended', 'completed', 'defaulted', 'thirty_percent'] as const;
export const SubscriberTypeSchema = z.enum(SUBSCRIBER_TYPES);
export type SubscriberType = z.infer<typeof SubscriberTypeSchema>;

export const SUBSCRIBER_TYPE_LABELS: Record<SubscriberType, string> = {
  suspended: 'Suspended',
  completed: 'Completed',
  defaulted: 'Defaulted',
  thirty_percent: 'Paid 30%+',
};

/** Unlisted sort keys are a 400 from the BE. */
export const SUBSCRIBER_SORT_FIELDS = [
  'created_at',
  'amount_paid',
  'balance',
  'asset_price',
  'next_payment_date',
] as const;
export const SubscriberSortFieldSchema = z.enum(SUBSCRIBER_SORT_FIELDS);
export type SubscriberSortField = z.infer<typeof SubscriberSortFieldSchema>;

export const DEFAULT_SUBSCRIBER_SORT: SubscriberSortField = 'created_at';

/**
 * `createdAt`, `start_date` and `next_payment_date` are `Date` on the DTO and
 * arrive as ISO strings over the wire; accept either rather than assuming the
 * serializer's output format.
 */
const DateLike = z.union([z.string(), z.date()]).nullable();

export const SubscriberRowSchema = z.object({
  plan_id: z.string(),
  createdAt: DateLike,

  buyer_id: z.string().nullable(),
  buyer_name: z.string().nullable(),
  buyer_email: z.string().nullable(),
  buyer_phone: z.string().nullable(),

  referrer_id: z.string().nullable(),
  referrer_name: z.string().nullable(),
  referrer_email: z.string().nullable(),

  asset_id: z.string().nullable(),
  asset_name: z.string().nullable(),
  asset_type: z.string().nullable(),
  size: z.number().nullable(),
  no_of_units: z.number(),
  unique_asset_id: z.string().nullable(),

  asset_price: z.number(),
  land_price: z.number().nullable(),
  document_price: z.number().nullable(),

  amount_paid: z.number(),
  amount_payable: z.number(),
  initial_payment: z.number(),
  balance: z.number(),
  default_amount: z.number(),

  month_subscription: z.number(),
  months_covered: z.number(),
  months_overdue: z.number(),

  start_date: DateLike,
  next_payment_date: DateLike,
  /** v1 compatibility — a string, not a number. */
  payment_percentage: z.string(),

  status: z.string(),
  is_defaulted: z.boolean(),
  is_suspended: z.boolean(),
});

export type SubscriberRow = z.infer<typeof SubscriberRowSchema>;

/** `payment_percentage` arrives as a string; parse defensively for the bar. */
export function paymentPercentage(row: Pick<SubscriberRow, 'payment_percentage'>): number {
  const parsed = Number.parseFloat(row.payment_percentage);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 100);
}
