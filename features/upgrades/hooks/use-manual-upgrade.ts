'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { UpgradeSchema, type ManualUpgradePayload } from '../schemas/upgrade.schema';
import { upgradeKeys } from './query-keys';

/**
 * POST /admin/users/:id/manual-upgrade — record an upgrade paid off-platform.
 *
 * One transaction on the BE: it sets the tier, writes a `Transaction` when
 * `fee_amount > 0`, fires referral commission when `pay_commission` is set
 * alongside a fee and a referrer, and writes an audit log carrying `reason`.
 * The created upgrade comes back with `payment_method: 'admin-manual'` and
 * `status: 'approved'`, so it lands in the queue already reviewed.
 *
 * Refs on the response are **not** populated — it returns the document as
 * created — which is why the queue is invalidated rather than the row being
 * merged into the cache.
 */
export const useManualUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ManualUpgradePayload }) =>
      apiPost(`/admin/users/${userId}/manual-upgrade`, payload, UpgradeSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: upgradeKeys.lists() });
    },
  });
};
