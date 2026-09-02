import { z } from 'zod';

const AssetTypeBreakdownSchema = z.object({
  asset_type: z.string(),
  count: z.number(),
  total_outstanding: z.number(),
});

/** `GET /admin/payment-plans/summary` — `PaymentPlansSummaryDto`. Extra keys kept. */
export const PaymentPlansSummarySchema = z.looseObject({
  total_plans: z.number(),
  total_units: z.number(),
  total_plan_value: z.number(),
  total_amount_payable: z.number(),
  total_amount_paid: z.number(),
  total_outstanding: z.number(),
  total_default_amount: z.number(),

  active_count: z.number(),
  overdue_count: z.number(),
  suspended_count: z.number(),
  completed_count: z.number(),
  cancelled_count: z.number(),

  by_asset_type: z.array(AssetTypeBreakdownSchema),

  with_referrer_count: z.number(),
  without_referrer_count: z.number(),
  defaulted_count: z.number(),
});

export type PaymentPlansSummary = z.infer<typeof PaymentPlansSummarySchema>;
