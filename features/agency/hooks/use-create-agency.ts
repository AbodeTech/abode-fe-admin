'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { AgencySchema, type CreateAgencyPayload } from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/**
 * POST /admin/agencies — takes `manage_agencies`.
 *
 * Two owner modes. `existing` promotes a user who must not already own an
 * agency (400 `USER_ALREADY_AGENCY_OWNER`). `new` creates the user, generates
 * a temporary password and emails it to them — the password is never returned
 * in the response, so there are no credentials for the UI to display, unlike
 * v1's `credentials` block.
 *
 * Either way the owner is moved into the new agency and the BE allocates the
 * `AG-XXXXXXXX` code.
 */
export const useCreateAgency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAgencyPayload) =>
      apiPost('/admin/agencies', payload, AgencySchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    },
  });
};
