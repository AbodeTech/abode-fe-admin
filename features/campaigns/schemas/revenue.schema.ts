import { z } from 'zod';

const MoneySchema = z.object({
  purchases: z.number(),
  sqm_sold: z.number(),
  value_sold: z.number(),
  amount_collected: z.number(),
  /** Balance on plans still running — suspended, completed and cancelled plans owe nothing. */
  balance_outstanding: z.number(),
});

/** `GET /admin/campaigns/:id/revenue` — needs view_sales as well as view_campaigns. */
export const CampaignRevenueSchema = MoneySchema.extend({
  avg_price_per_sqm: z.number().nullable(),
  /** 0..1 of value sold already collected. */
  collected_percent: z.number().nullable(),
  assets: z.array(
    MoneySchema.extend({
      asset_id: z.string(),
      asset_name: z.string().nullable(),
    })
  ),
});

export type CampaignRevenue = z.infer<typeof CampaignRevenueSchema>;
