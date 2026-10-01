import { z } from 'zod';

const nullableName = z.string().nullable();

const TopEarnerSchema = z.object({
  user_id: z.string(),
  first_name: nullableName,
  last_name: nullableName,
  email: z.string().nullable().optional(),
  rewards: z.number(),
  total_sqm: z.number(),
});

export const CampaignDashboardSchema = z.object({
  period: z.object({
    start_date: z.string(),
    end_date: z.string(),
    total_days: z.number(),
    days_elapsed: z.number(),
    days_remaining: z.number(),
    /** 0..1 of the window already behind us. */
    percent_elapsed: z.number(),
    has_started: z.boolean(),
    has_ended: z.boolean(),
  }),
  /** Land sold = every eligible purchase in the window, rewarded or not. */
  progress: z.object({
    total_sqm_sold: z.number(),
    total_sqm_target: z.number().nullable(),
    percent: z.number().nullable(),
    sqm_remaining: z.number().nullable(),
    daily_sqm_required: z.number().nullable(),
  }),
  sales: z.object({
    purchases: z.number(),
    buyers: z.number(),
    sqm_sold: z.number(),
  }),
  assets: z.array(
    z.object({
      asset_id: z.string(),
      asset_name: z.string().nullable(),
      purchases: z.number(),
      sqm_sold: z.number(),
      /** 0..1 of the campaign's land sold. */
      share: z.number(),
      rewards: z.number(),
    })
  ),
  participants: z.object({
    total_recipients: z.number(),
    buyer_recipients: z.number(),
    referrer_recipients: z.number(),
  }),
  /** Reward-log figures — only purchases that earned a reward. */
  issuance: z.object({
    total_rewards: z.number(),
    active_rewards: z.number(),
    invalidated_rewards: z.number(),
    total_sqm: z.number(),
    purchases: z.number(),
  }),
  /** One row per Lagos day from the start to today (or the end), zero days included. */
  timeline: z.array(
    z.object({
      date: z.string(),
      purchases: z.number(),
      sqm_sold: z.number(),
      rewards: z.number(),
    })
  ),
  top_earners: z.object({
    buyers: z.array(TopEarnerSchema),
    referrers: z.array(TopEarnerSchema),
  }),
});

export type CampaignDashboard = z.infer<typeof CampaignDashboardSchema>;
