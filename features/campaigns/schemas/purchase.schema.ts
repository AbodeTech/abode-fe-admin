import { z } from 'zod';

const PartySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
});

const RoleRewardsSchema = z.object({
  count: z.number(),
  /** Empty on a hamper campaign — hampers carry no id. */
  ticket_ids: z.array(z.string()),
});

/** `GET /admin/campaigns/:id/purchases` — one row per purchase in the campaign window. */
export const CampaignPurchaseSchema = z.object({
  plan_id: z.string(),
  purchased_at: z.string(),
  buyer: PartySchema,
  referrer: PartySchema.nullable(),
  asset_id: z.string(),
  asset_name: z.string().nullable(),
  asset_type: z.string(),
  size_sqm: z.number().nullable(),
  units: z.number(),
  total_sqm: z.number(),
  asset_price: z.number(),
  amount_paid: z.number(),
  balance: z.number(),
  status: z.string(),
  is_defaulted: z.boolean(),
  months: z.number().nullable(),
  next_payment_date: z.string().nullable(),
  rewards: z.object({
    buyer: RoleRewardsSchema,
    referrer: RoleRewardsSchema,
  }),
});

export type CampaignPurchase = z.infer<typeof CampaignPurchaseSchema>;
