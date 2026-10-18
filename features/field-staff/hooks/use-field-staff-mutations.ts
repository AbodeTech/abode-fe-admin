'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch, apiPost } from '@/lib/api-client';

import {
  FieldAssignmentSchema,
  FieldStaffSchema,
  type CreateFieldAssignmentPayload,
  type DisableFieldStaffPayload,
  type EndFieldAssignmentPayload,
  type InviteFieldStaffPayload,
} from '../schemas/field-staff.schema';
import { fieldStaffKeys } from './query-keys';

/** Every staff write can change the roster, the person page and the scores. */
const useStaffMutation = <TVars, TData>(mutationFn: (vars: TVars) => Promise<TData>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.staff() });
      queryClient.invalidateQueries({ queryKey: fieldStaffKeys.performance() });
    },
  });
};

/** POST /admin/field-staff/invite — emails a 72-hour activation link; the account starts `invited`. */
export const useInviteFieldStaff = () =>
  useStaffMutation((payload: InviteFieldStaffPayload) =>
    apiPost('/admin/field-staff/invite', payload, FieldStaffSchema)
  );

/** POST /admin/field-staff/:id/resend-invite — a fresh link; the old one stops working. Invited accounts only. */
export const useResendFieldInvite = () =>
  useStaffMutation((staffId: string) =>
    apiPost(`/admin/field-staff/${staffId}/resend-invite`, {}, FieldStaffSchema)
  );

/** PATCH /admin/field-staff/:id/disable — signs them out everywhere; history is kept. */
export const useDisableFieldStaff = () =>
  useStaffMutation(({ staffId, payload }: { staffId: string; payload: DisableFieldStaffPayload }) =>
    apiPatch(`/admin/field-staff/${staffId}/disable`, payload, FieldStaffSchema)
  );

/** PATCH /admin/field-staff/:id/enable — back to active, or to invited if they never activated. */
export const useEnableFieldStaff = () =>
  useStaffMutation((staffId: string) => apiPatch(`/admin/field-staff/${staffId}/enable`, {}, FieldStaffSchema));

/** POST /admin/field-staff/:id/assignments — 409 FIELD_ASSIGNMENT_EXISTS if one is already open there. */
export const useCreateFieldAssignment = () =>
  useStaffMutation(({ staffId, payload }: { staffId: string; payload: CreateFieldAssignmentPayload }) =>
    apiPost(`/admin/field-staff/${staffId}/assignments`, payload, FieldAssignmentSchema)
  );

/** PATCH /admin/field-staff/:id/assignments/:assignmentId/end — earlier targets, work and scores stay. */
export const useEndFieldAssignment = () =>
  useStaffMutation(
    ({ staffId, assignmentId, payload }: { staffId: string; assignmentId: string; payload: EndFieldAssignmentPayload }) =>
      apiPatch(`/admin/field-staff/${staffId}/assignments/${assignmentId}/end`, payload, FieldAssignmentSchema)
  );
