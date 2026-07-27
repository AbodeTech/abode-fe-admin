'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CommissionConfigSchema } from '../schemas/commission.schema';
import type { PublishConfigPayload } from '../schemas/config-form.schema';
import { commissionKeys } from './query-keys';

/**
 * POST /admin/commission/config — publishes a **new version**.
 *
 * Not an edit: the BE copies the active config, overlays the payload, and
 * saves it as version N+1. Earlier versions stay queryable, which is what
 * makes a payment plan's `commission_config_version` snapshot meaningful.
 *
 * Existing payment plans are unaffected — their rate was frozen at creation.
 */
export const usePublishConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PublishConfigPayload) =>
      apiPost('/admin/commission/config', payload, CommissionConfigSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.config() });
    },
  });
};
