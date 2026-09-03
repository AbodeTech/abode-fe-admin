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
    days_remaining: z.number(),
    has_ended: z.boolean().optional(),
  }),
  progress: z.object({
    total_sqm_sold: z.number(),
    total_sqm_target: z.number().nullable(),
    percent: z.number().nullable(),
  }),
  participants: z.object({
    total_recipients: z.number(),
    buyer_recipients: z.number(),
    referrer_recipients: z.number(),
  }),
  issuance: z.object({
    total_rewards: z.number(),
    active_rewards: z.number(),
    invalidated_rewards: z.number(),
    total_sqm: z.number(),
    purchases: z.number(),
  }),
  timeline: z.array(
    z.object({
      date: z.string(),
      rewards: z.number(),
      sqm: z.number().optional(),
    })
  ),
  top_earners: z.object({
    buyers: z.array(TopEarnerSchema),
    referrers: z.array(TopEarnerSchema),
  }),
});

export type CampaignDashboard = z.infer<typeof CampaignDashboardSchema>;
