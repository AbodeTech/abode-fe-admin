import { z } from 'zod';

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'] as const;
export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const REWARD_TYPES = ['ticket', 'hamper'] as const;
export const RewardTypeSchema = z.enum(REWARD_TYPES);
export type RewardType = z.infer<typeof RewardTypeSchema>;

export const TRIGGER_EVENTS = ['asset_purchase'] as const;
export const TRIGGER_UNITS = ['sqm'] as const;
export const TRIGGER_MODES = ['divisor'] as const;

export const ELIGIBLE_ASSET_TYPES = ['flex', 'full-ownership', 'commercial'] as const;

export const CampaignPeriodSchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
});

export const CampaignCheckpointSchema = z.object({
  key: z.string().min(1),
  label: z.string(),
  prize: z.string(),
  sqm_required: z.number(),
  prize_media_url: z.string().nullable().optional(),
});

export type CampaignCheckpoint = z.infer<typeof CampaignCheckpointSchema>;

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: CampaignStatusSchema,
  start_date: z.string(),
  end_date: z.string(),
  reward_type: RewardTypeSchema,
  trigger_event: z.string(),
  trigger_unit: z.string(),
  trigger_mode: z.string(),
  trigger_threshold: z.number(),
  rewards_per_threshold: z.number(),
  recipient_buyer: z.boolean(),
  recipient_referrer: z.boolean(),
  ticket_id_prefix: z.string().nullable(),
  buyer_eligible_statuses: z.array(z.string()),
  referrer_eligible_statuses: z.array(z.string()),
  eligible_asset_types: z.array(z.string()).optional().default([]),
  total_sqm_target: z.number().nullable(),
  checkpoints: z.array(CampaignCheckpointSchema),
  leaderboard_masking_enabled: z.boolean(),
  is_legacy: z.boolean().optional(),
  completed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  /** Present on detail, not on list. */
  reward_count: z.number().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
