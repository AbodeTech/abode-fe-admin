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

/**
 * What a raffle prize is, so the realtor page can draw a fitting icon. Mirrors
 * `RAFFLE_PRIZE_KINDS` in abode-be-v2 `campaign.schema.ts` — ops picks the
 * category, the app owns how it looks.
 */
export const RAFFLE_PRIZE_KINDS = [
  'trip',
  'land',
  'vehicle',
  'cash',
  'appliance',
  'gadget',
  'hamper',
  'other',
] as const;
export const RafflePrizeKindSchema = z.enum(RAFFLE_PRIZE_KINDS);
export type RafflePrizeKind = z.infer<typeof RafflePrizeKindSchema>;

export const RAFFLE_PRIZE_KIND_LABELS: Record<RafflePrizeKind, string> = {
  trip: 'Trip',
  land: 'Land',
  vehicle: 'Vehicle',
  cash: 'Cash',
  appliance: 'Appliance',
  gadget: 'Gadget',
  hamper: 'Hamper',
  other: 'Other',
};

/**
 * One prize in the end-of-campaign draw. Not the same thing as a checkpoint
 * prize: a checkpoint prize is ASSURED on reaching its sqm, a raffle prize is
 * drawn from all tickets. Order is display order, top prize first.
 */
export const RafflePrizeSchema = z.object({
  label: z.string(),
  // `.catch` rather than a hard enum failure: a kind the admin does not know yet
  // should render as "Other", not break the whole campaign page.
  kind: RafflePrizeKindSchema.catch('other'),
});

export type RafflePrize = z.infer<typeof RafflePrizeSchema>;

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
  /** Defaulted so a backend deployed before the field existed still parses. */
  raffle_prizes: z.array(RafflePrizeSchema).optional().default([]),
  leaderboard_masking_enabled: z.boolean(),
  is_legacy: z.boolean().optional(),
  completed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  /** Present on detail, not on list. */
  reward_count: z.number().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;
