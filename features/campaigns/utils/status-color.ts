import { cn } from '@/lib/utils';

import type { CampaignStatus, RewardType } from '../schemas/campaign.schema';

const STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: 'border-[#E5EAEF] bg-[#F5F5F5] text-[#5A5A5A]',
  active: 'border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]',
  paused: 'border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]',
  completed: 'border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3]',
};

export function campaignStatusClassName(status: CampaignStatus) {
  return cn(
    'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
    STATUS_STYLES[status]
  );
}

const REWARD_TYPE_STYLES: Record<RewardType, string> = {
  ticket: 'border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3]',
  hamper: 'border-[#E9D7FE] bg-[#F9F5FF] text-[#6941C6]',
};

export function rewardTypeClassName(type: RewardType) {
  return cn(
    'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
    REWARD_TYPE_STYLES[type]
  );
}
