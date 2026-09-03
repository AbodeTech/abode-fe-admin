'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch } from '@/lib/api-client';

import { AgencyMessageSchema } from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * PATCH /admin/users/:user_id/org — move a user into an agency, or pass
 * `agency_id: null` to remove them from the one they are in.
 *
 * Takes `manage_agencies`. The BE refuses to move anyone into a suspended
 * agency (400 `INVALID_ORG_MUTATION`). Both the old and the new agency's
 * caches are bumped server-side, so this invalidates the whole feature.
 */
export const useSetUserOrg = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, agencyId }: { userId: string; agencyId: string | null }) =>
      apiPatch(`/admin/users/${userId}/org`, { agency_id: agencyId }, AgencyMessageSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
};
