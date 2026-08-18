'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPatch, apiPost } from '@/lib/api-client';

import { ClientRequestSchema, type ApprovalMode } from '../schemas/request.schema';
import { requestKeys } from './query-keys';

/* ============================================================
 * The five admin actions. Every one returns the updated ClientRequestView,
 * so the row can be refreshed from the response.
 *
 * `requestId` is the human-readable `request_id` ("DCR-2026-0001"), NOT the
 * document's `id`. The backend's only lookup is `findOne({ request_id })`;
 * passing the ObjectId 404s as "That request does not exist".
 *
 * v1 had one approve mutation per request type. v2 has one endpoint with a
 * `mode`: `system` runs the completion effect (the document is renamed, the
 * plan is resized) and lands on `completed`; `manual` records the decision
 * and stops at `approved`, waiting for a human to do the work and then call
 * `complete`. Custom requests have no system effect and can only be manual.
 * ============================================================ */

function useRequestMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.details() });
      // Every action moves a status counter.
      queryClient.invalidateQueries({ queryKey: [...requestKeys.all, 'stats'] });
    },
  });
}

export const useReviewRequest = () =>
  useRequestMutation((args: { requestId: string; admin_notes?: string }) =>
    apiPatch(
      `/admin/requests/${args.requestId}/review`,
      args.admin_notes ? { admin_notes: args.admin_notes } : {},
      ClientRequestSchema
    )
  );

export const useApproveRequest = () =>
  useRequestMutation(
    (args: {
      requestId: string;
      mode: ApprovalMode;
      admin_notes?: string;
      estimated_completion_hours?: number;
    }) =>
      apiPost(
        `/admin/requests/${args.requestId}/approve`,
        {
          mode: args.mode,
          ...(args.admin_notes ? { admin_notes: args.admin_notes } : {}),
          ...(args.mode === 'manual' && args.estimated_completion_hours
            ? { estimated_completion_hours: args.estimated_completion_hours }
            : {}),
        },
        ClientRequestSchema
      )
  );

export const useCompleteRequest = () =>
  useRequestMutation((args: { requestId: string; admin_notes?: string }) =>
    apiPatch(
      `/admin/requests/${args.requestId}/complete`,
      args.admin_notes ? { admin_notes: args.admin_notes } : {},
      ClientRequestSchema
    )
  );

export const useDeclineRequest = () =>
  useRequestMutation((args: { requestId: string; decline_reason: string; admin_notes?: string }) =>
    apiPatch(
      `/admin/requests/${args.requestId}/decline`,
      {
        decline_reason: args.decline_reason,
        ...(args.admin_notes ? { admin_notes: args.admin_notes } : {}),
      },
      ClientRequestSchema
    )
  );

/** The only path that refunds a verified fee — the dialog says so. */
export const useCancelRequest = () =>
  useRequestMutation((args: { requestId: string; reason: string }) =>
    apiPatch(`/admin/requests/${args.requestId}/cancel`, { reason: args.reason }, ClientRequestSchema)
  );
