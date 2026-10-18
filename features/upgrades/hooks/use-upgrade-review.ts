'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiClientError, apiPatch } from '@/lib/api-client';

import { UpgradeSchema } from '../schemas/upgrade.schema';
import { upgradeKeys } from './query-keys';

/** The upgrade was already decided (by someone else, or it expired); the list we're showing is stale. */
export const isUpgradeNoLongerPending = (error: unknown) =>
  error instanceof ApiClientError && error.statusCode === 409;

/**
 * PATCH /admin/referrals/upgrades/:id/approve.
 *
 * Not just a status flip — inside one transaction the BE sets the user's tier,
 * completes the linked payment transaction, and fires upgrade commission to
 * the referrer. Commission is skipped when the upgrade used a coupon.
 *
 * Only `pending` upgrades can be approved; anything else returns
 * `UPGRADE_NOT_PENDING` (409), including when another admin approved or
 * declined it a moment earlier.
 */
export const useApproveUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (upgradeId: string) =>
      apiPatch(`/admin/referrals/upgrades/${upgradeId}/approve`, {}, UpgradeSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: upgradeKeys.lists() });
    },
    onError: (error) => {
      if (isUpgradeNoLongerPending(error)) queryClient.invalidateQueries({ queryKey: upgradeKeys.lists() });
    },
  });
};

/**
 * PATCH /admin/referrals/upgrades/:id/decline.
 *
 * The reason is required and must be at least 20 characters — the BE rejects
 * anything shorter with `DECLINE_REASON_TOO_SHORT`. It is stored on the
 * upgrade and shown to the applicant, so it is written for them, not for us.
 */
export const useDeclineUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ upgradeId, reason }: { upgradeId: string; reason: string }) =>
      apiPatch(
        `/admin/referrals/upgrades/${upgradeId}/decline`,
        { reason },
        UpgradeSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: upgradeKeys.lists() });
    },
    onError: (error) => {
      if (isUpgradeNoLongerPending(error)) queryClient.invalidateQueries({ queryKey: upgradeKeys.lists() });
    },
  });
};
