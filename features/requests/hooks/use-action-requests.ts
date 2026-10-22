'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiClientError, apiPatch, apiPost } from '@/lib/api-client';

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

/**
 * `expected_price_change` is the asset-update price change the admin saw in
 * the dialog. If today's price no longer matches it, the backend refuses with
 * 409 `QUOTE_CHANGED` rather than writing a figure nobody looked at — the
 * quote is refetched so the dialog shows the new one.
 */
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      requestId: string;
      mode: ApprovalMode;
      admin_notes?: string;
      estimated_completion_hours?: number;
      expected_price_change?: number;
    }) =>
      apiPost(
        `/admin/requests/${args.requestId}/approve`,
        {
          mode: args.mode,
          ...(args.admin_notes ? { admin_notes: args.admin_notes } : {}),
          ...(args.mode === 'manual' && args.estimated_completion_hours
            ? { estimated_completion_hours: args.estimated_completion_hours }
            : {}),
          ...(args.expected_price_change !== undefined
            ? { expected_price_change: args.expected_price_change }
            : {}),
        },
        ClientRequestSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.details() });
      queryClient.invalidateQueries({ queryKey: [...requestKeys.all, 'stats'] });
    },
    onError: (error, args) => {
      // The price, the plan or the land moved under the dialog — reload the
      // quote so it shows what approval would now apply.
      if (
        error instanceof ApiClientError &&
        (error.code === QUOTE_CHANGED || error.code === INVENTORY_UNAVAILABLE)
      ) {
        queryClient.invalidateQueries({ queryKey: requestKeys.quote(args.requestId) });
      }
    },
  });
};

export const QUOTE_CHANGED = 'QUOTE_CHANGED';
/** Approval couldn't move the land: the target is taken, or the current holding doesn't reconcile. */
export const INVENTORY_UNAVAILABLE = 'INVENTORY_UNAVAILABLE';

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
