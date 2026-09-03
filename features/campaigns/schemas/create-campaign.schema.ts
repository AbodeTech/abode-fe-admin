import { z } from 'zod';

import { ELIGIBLE_ASSET_TYPES, REWARD_TYPES } from './campaign.schema';

export const ELIGIBLE_STATUSES = [
  'guest',
  'user',
  'associate',
  'associate-pro',
  'founder',
  'management',
  'premium',
  'agency',
] as const;

export { ELIGIBLE_ASSET_TYPES };

const CheckpointInputSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use kebab-case (e.g. bronze-tier)'),
  label: z.string().min(1, 'Label is required').max(120),
  prize: z.string().min(1, 'Prize is required').max(300),
  sqm_required: z.number().int().positive('Sqm required must be greater than 0'),
  prize_media_url: z.string().max(500).optional().or(z.literal('')),
});

export const CreateCampaignSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(2000),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    trigger_event: z.literal('asset_purchase'),
    trigger_unit: z.literal('sqm'),
    trigger_mode: z.literal('divisor'),
    trigger_threshold: z.number().int().positive('Threshold must be greater than 0'),
    rewards_per_threshold: z.number().int().positive(),
    reward_type: z.enum(REWARD_TYPES),
    recipient_buyer: z.boolean(),
    recipient_referrer: z.boolean(),
    ticket_id_prefix: z.string().max(4).optional().or(z.literal('')),
    buyer_eligible_statuses: z.array(z.string()),
    referrer_eligible_statuses: z.array(z.string()),
    eligible_asset_types: z.array(z.enum(ELIGIBLE_ASSET_TYPES)),
    total_sqm_target: z.union([z.number().int().nonnegative(), z.null()]),
    checkpoints: z.array(CheckpointInputSchema).max(20),
    leaderboard_masking_enabled: z.boolean(),
  })
  .refine((data) => data.recipient_buyer || data.recipient_referrer, {
    message: 'Select at least one recipient',
    path: ['recipient_buyer'],
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })
  .refine(
    (data) => data.reward_type !== 'ticket' || Boolean(data.ticket_id_prefix && data.ticket_id_prefix.trim()),
    {
      message: 'Ticket ID prefix is required for ticket rewards',
      path: ['ticket_id_prefix'],
    }
  )
  .superRefine((data, ctx) => {
    const checkpoints = data.checkpoints ?? [];
    const seen = new Map<string, number>();
    checkpoints.forEach((checkpoint, index) => {
      const previous = seen.get(checkpoint.key);
      if (previous !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['checkpoints', index, 'key'],
          message: 'Keys must be unique within this campaign',
        });
      } else {
        seen.set(checkpoint.key, index);
      }
      if (index > 0 && !(checkpoint.sqm_required > checkpoints[index - 1].sqm_required)) {
        ctx.addIssue({
          code: 'custom',
          path: ['checkpoints', index, 'sqm_required'],
          message: 'Must be greater than the previous checkpoint',
        });
      }
    });
  });

export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;

export const LimitedCampaignEditSchema = z.object({
  description: z.string().max(2000),
  total_sqm_target: z.union([z.number().int().nonnegative(), z.null()]),
  leaderboard_masking_enabled: z.boolean(),
  checkpoints: z.array(CheckpointInputSchema).optional(),
});

export type LimitedCampaignEditDto = z.infer<typeof LimitedCampaignEditSchema>;

export const STEP_FIELDS: Record<
  'basics' | 'trigger' | 'reward' | 'eligibility' | 'target' | 'review',
  (keyof CreateCampaignDto)[]
> = {
  basics: ['name', 'description', 'start_date', 'end_date'],
  trigger: ['trigger_threshold', 'rewards_per_threshold'],
  reward: [
    'reward_type',
    'recipient_buyer',
    'recipient_referrer',
    'ticket_id_prefix',
    'checkpoints',
    'leaderboard_masking_enabled',
  ],
  eligibility: ['buyer_eligible_statuses', 'referrer_eligible_statuses', 'eligible_asset_types'],
  target: ['total_sqm_target'],
  review: [],
};

export const CREATE_CAMPAIGN_DEFAULTS: CreateCampaignDto = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  trigger_event: 'asset_purchase',
  trigger_unit: 'sqm',
  trigger_mode: 'divisor',
  trigger_threshold: 500,
  rewards_per_threshold: 1,
  reward_type: 'ticket',
  recipient_buyer: true,
  recipient_referrer: true,
  ticket_id_prefix: '',
  buyer_eligible_statuses: [],
  referrer_eligible_statuses: [],
  eligible_asset_types: [],
  total_sqm_target: null,
  checkpoints: [],
  leaderboard_masking_enabled: true,
};
