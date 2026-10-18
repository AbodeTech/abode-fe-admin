import { ApiClientError } from '@/lib/api-client';

import type { UseFormReturn } from 'react-hook-form';

import type { CreateCampaignDto } from '../schemas/create-campaign.schema';

export function applyCampaignWriteError(
  error: unknown,
  form?: UseFormReturn<CreateCampaignDto>
): 'checkpoint' | 'locked' | 'other' {
  if (!(error instanceof ApiClientError)) {
    return 'other';
  }

  const blob = `${error.code ?? ''} ${error.messages.join(' ')}`.toUpperCase();

  if (blob.includes('CHECKPOINT_ORDER_INVALID') || error.code === 'CHECKPOINT_ORDER_INVALID') {
    form?.setError('checkpoints', {
      type: 'server',
      message:
        error.messages.join(' ') ||
        'Checkpoints must have unique keys and strictly ascending sqm_required.',
    });
    return 'checkpoint';
  }

  if (blob.includes('CAMPAIGN_LOCKED_FIELD') || error.code === 'CAMPAIGN_LOCKED_FIELD') {
    return 'locked';
  }

  return 'other';
}
