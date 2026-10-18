import { z } from 'zod';

import { RewardTypeSchema } from './campaign.schema';

export const REWARD_ROLES = ['buyer', 'referrer'] as const;
export const RewardRoleSchema = z.enum(REWARD_ROLES);
export type RewardRole = z.infer<typeof RewardRoleSchema>;

const PersonSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable().optional(),
});

export const CampaignRewardSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  recipient: PersonSchema.nullable(),
  role: RewardRoleSchema,
  reward_type: RewardTypeSchema,
  ticket_id: z.string().nullable(),
  source_buyer: PersonSchema.nullable().optional(),
  source_payment_plan_id: z.string().nullable().optional(),
  asset_id: z.string(),
  asset_name: z.string(),
  sqm_purchased: z.number(),
  reward_index_in_batch: z.number().optional(),
  batch_size: z.number().optional(),
  is_legacy: z.boolean().optional(),
  is_active: z.boolean(),
  invalidated_at: z.string().nullable().optional(),
  invalidation_reason: z.string().nullable().optional(),
  created_at: z.string(),
});

export type CampaignReward = z.infer<typeof CampaignRewardSchema>;
