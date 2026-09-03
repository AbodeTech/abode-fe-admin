import type { CreateCampaignDto, LimitedCampaignEditDto } from '../schemas/create-campaign.schema';

function toIso(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function mapCheckpoints(checkpoints: CreateCampaignDto['checkpoints'] | undefined) {
  if (!checkpoints) return undefined;
  return checkpoints.map((checkpoint) => {
    const row: {
      key: string;
      label: string;
      prize: string;
      sqm_required: number;
      prize_media_url?: string;
    } = {
      key: checkpoint.key,
      label: checkpoint.label,
      prize: checkpoint.prize,
      sqm_required: Math.trunc(checkpoint.sqm_required),
    };
    const media = checkpoint.prize_media_url?.trim();
    if (media) row.prize_media_url = media;
    return row;
  });
}

/**
 * CreateCampaignDto keeps wizard-only fields (locked trigger event/unit/mode).
 * The BE ValidationPipe forbids anything not on CreateCampaignDto / UpdateCampaignDto.
 */
export function toCreateCampaignBody(values: CreateCampaignDto) {
  const body: Record<string, unknown> = {
    name: values.name,
    description: values.description ?? '',
    start_date: toIso(values.start_date),
    end_date: toIso(values.end_date),
    trigger_threshold: Math.trunc(values.trigger_threshold),
    rewards_per_threshold: Math.trunc(values.rewards_per_threshold),
    reward_type: values.reward_type,
    recipient_buyer: values.recipient_buyer,
    recipient_referrer: values.recipient_referrer,
    buyer_eligible_statuses: values.buyer_eligible_statuses,
    referrer_eligible_statuses: values.referrer_eligible_statuses,
    eligible_asset_types: values.eligible_asset_types ?? [],
    checkpoints: mapCheckpoints(values.checkpoints) ?? [],
    leaderboard_masking_enabled: values.leaderboard_masking_enabled,
  };

  if (values.reward_type === 'ticket') {
    const prefix = values.ticket_id_prefix?.trim();
    if (prefix) body.ticket_id_prefix = prefix;
  }

  if (values.total_sqm_target != null) {
    body.total_sqm_target = Math.trunc(values.total_sqm_target);
  }

  return body;
}

export function toUpdateCampaignBody(values: Partial<CreateCampaignDto> | LimitedCampaignEditDto) {
  const body: Record<string, unknown> = {};
  const draft = values as Partial<CreateCampaignDto>;

  if (draft.name !== undefined) body.name = draft.name;
  if (draft.description !== undefined) body.description = draft.description ?? '';
  if (draft.start_date !== undefined) body.start_date = toIso(draft.start_date);
  if (draft.end_date !== undefined) body.end_date = toIso(draft.end_date);
  if (draft.trigger_threshold !== undefined) body.trigger_threshold = Math.trunc(draft.trigger_threshold);
  if (draft.rewards_per_threshold !== undefined) {
    body.rewards_per_threshold = Math.trunc(draft.rewards_per_threshold);
  }
  if (draft.reward_type !== undefined) body.reward_type = draft.reward_type;
  if (draft.recipient_buyer !== undefined) body.recipient_buyer = draft.recipient_buyer;
  if (draft.recipient_referrer !== undefined) body.recipient_referrer = draft.recipient_referrer;
  if (draft.buyer_eligible_statuses !== undefined) {
    body.buyer_eligible_statuses = draft.buyer_eligible_statuses;
  }
  if (draft.referrer_eligible_statuses !== undefined) {
    body.referrer_eligible_statuses = draft.referrer_eligible_statuses;
  }
  if (draft.eligible_asset_types !== undefined) body.eligible_asset_types = draft.eligible_asset_types;
  if (draft.checkpoints !== undefined) body.checkpoints = mapCheckpoints(draft.checkpoints);
  if (draft.leaderboard_masking_enabled !== undefined) {
    body.leaderboard_masking_enabled = draft.leaderboard_masking_enabled;
  }

  if (draft.reward_type === 'ticket' || draft.ticket_id_prefix !== undefined) {
    const prefix = draft.ticket_id_prefix?.trim();
    if (prefix) body.ticket_id_prefix = prefix;
  }

  if ('total_sqm_target' in values) {
    body.total_sqm_target =
      values.total_sqm_target == null ? 0 : Math.trunc(values.total_sqm_target);
  }

  return body;
}
