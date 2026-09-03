'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';

import {
  AgencyDetailSchema,
  AgencyMessageSchema,
  AgencySchema,
  type ChangeOwnerPayload,
  type SuspendAgencyPayload,
  type UpdateAgencyPayload,
} from '../schemas/agency.schema';
import { agencyKeys } from './query-keys';

/* ============================================================
 * Agency writes. All take `manage_agencies`; change-owner additionally
 * requires a super admin.
 *
 * Every one of these bumps the BE's list cache generation, so each
 * invalidates `agencyKeys.all` rather than just the row it touched — a
 * commission or status change moves the list rows too. Toasts belong at the
 * call site, not in here.
 * ============================================================ */

/** Invalidate the whole feature, plus the one detail row if we know it. */
function useAgencyInvalidator() {
  const queryClient = useQueryClient();

  return (agencyId?: string) => {
    queryClient.invalidateQueries({ queryKey: agencyKeys.all });
    if (agencyId) {
      queryClient.invalidateQueries({ queryKey: agencyKeys.detail(agencyId) });
    }
  };
}

/**
 * PATCH /admin/agencies/:id — name, rate and contact details.
 *
 * `null` on a contact field clears it and `undefined` leaves it alone, so the
 * payload is passed through as-is: stripping nulls here would silently turn
 * "clear this email" into "change nothing".
 */
export const useUpdateAgency = () => {
  const invalidate = useAgencyInvalidator();

  return useMutation({
    mutationFn: ({ agencyId, payload }: { agencyId: string; payload: UpdateAgencyPayload }) =>
      apiPatch(`/admin/agencies/${agencyId}`, payload, AgencySchema),
    onSuccess: (_data, variables) => invalidate(variables.agencyId),
  });
};

/**
 * POST /admin/agencies/:id/suspend.
 *
 * New commission stops routing to the agency and falls back to the normal
 * tier chain; commission already earned is untouched. The reason must be at
 * least 20 characters after trimming — the BE checks the trimmed length a
 * second time inside the service, so a reason of 20 spaces is a 400.
 */
export const useSuspendAgency = () => {
  const invalidate = useAgencyInvalidator();

  return useMutation({
    mutationFn: ({ agencyId, payload }: { agencyId: string; payload: SuspendAgencyPayload }) =>
      apiPost(`/admin/agencies/${agencyId}/suspend`, payload, AgencySchema),
    onSuccess: (_data, variables) => invalidate(variables.agencyId),
  });
};

/**
 * POST /admin/agencies/:id/reactivate — no body.
 *
 * 400s with `AGENCY_NOT_SUSPENDED` if the agency is already active, so only
 * offer it on a suspended row.
 */
export const useReactivateAgency = () => {
  const invalidate = useAgencyInvalidator();

  return useMutation({
    mutationFn: (agencyId: string) =>
      apiPost(`/admin/agencies/${agencyId}/reactivate`, undefined, AgencySchema),
    onSuccess: (_data, agencyId) => invalidate(agencyId),
  });
};

/**
 * DELETE /admin/agencies/:id — permanent, and only once the roster is empty.
 *
 * The BE 400s with `AGENCY_MEMBER_COUNT_NOT_ZERO` while any member remains,
 * the owner included. Clearing the owner's own membership takes
 * `useSetUserOrg(ownerId, null)`.
 */
export const useDeleteAgency = () => {
  const invalidate = useAgencyInvalidator();

  return useMutation({
    mutationFn: (agencyId: string) =>
      apiDelete(`/admin/agencies/${agencyId}`, AgencyMessageSchema),
    onSuccess: () => invalidate(),
  });
};

/**
 * POST /admin/agencies/:id/change-owner — super admin only.
 *
 * Returns the fresh detail payload rather than the bare agency. The incoming
 * user must not already own another agency, and is moved into this one as a
 * side effect. `retain_old_owner_as_member` defaults to true on the BE; when
 * false, the outgoing owner is removed from the agency entirely.
 */
export const useChangeAgencyOwner = () => {
  const invalidate = useAgencyInvalidator();

  return useMutation({
    mutationFn: ({ agencyId, payload }: { agencyId: string; payload: ChangeOwnerPayload }) =>
      apiPost(`/admin/agencies/${agencyId}/change-owner`, payload, AgencyDetailSchema),
    onSuccess: (_data, variables) => invalidate(variables.agencyId),
  });
};
