'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiClientError, apiPatch, apiPost } from '@/lib/api-client';

import type { EstateUpdatePayload } from '../schemas/estate-update.schema';
import { assetKeys } from './query-keys';

/* ============================================================
 * Estate update writes. All four need `manage_estate_updates`.
 *
 *   POST  /admin/assets/:id/updates                     create — always a draft (201)
 *   PATCH /admin/assets/:id/updates/:updateId           edit fields; never status or published_at
 *   POST  /admin/assets/:id/updates/:updateId/publish   draft | archived → published (200)
 *   POST  /admin/assets/:id/updates/:updateId/archive   draft | published → archived (200)
 *
 * Refusals the call sites can hit, whose `error.message` is shown as-is:
 * - 404 `ESTATE_UPDATE_NOT_FOUND`: the update is gone, or belongs to another asset.
 * - 409 `INVALID_STATUS_TRANSITION`: an illegal move, including one another
 *   admin already made (e.g. publishing an update that was published meanwhile).
 * - 400 `HEADLINE_CONTAINS_ESTATE_NAME`: the headline repeats the estate name.
 * - 400 validation error (no `code`): a DTO rule failed, or a body key the DTO
 *   doesn't declare, since `forbidNonWhitelisted` is on.
 *
 * Every write invalidates the estate's update keys and re-reads, rather than
 * patching the cache. So does a 404 or 409, since either means the list on
 * screen is already out of date.
 * ============================================================ */

/**
 * Writes are only a signal that the change landed — every one invalidates and
 * re-reads, so their responses go unparsed (see the note in
 * `use-offer-mutations.ts`).
 */
const WriteResultSchema = z.unknown();

function useEstateUpdateMutation<TVariables, TData>(
  assetId: string,
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    // A block body on purpose: returning the invalidate promise would make
    // React Query await the refetch before the call site's callbacks run. A row
    // that drops out of a filtered list (publishing while the list shows only
    // drafts) would unmount first, and its toast would be lost with it.
    //
    // That only covers the refetch this write causes. React Query skips the
    // callbacks passed to `mutate()` once their component has unmounted, so a
    // row unmounted for another reason before the request settles (a page or
    // filter change) still loses its toast.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.estateUpdates(assetId) });
    },
    // A 404 (the update is gone) or 409 (another admin already moved it) means
    // the row is stale. Re-read so it stops offering the move just refused;
    // other errors leave the server state as it was. Block body for the same
    // reason as above.
    onError: (error) => {
      const stale =
        error instanceof ApiClientError && (error.statusCode === 404 || error.statusCode === 409);
      if (stale) {
        queryClient.invalidateQueries({ queryKey: assetKeys.estateUpdates(assetId) });
      }
    },
  });
}

/**
 * Every field is optional on the PATCH. Send only what changed: the BE writes
 * every field that differs from what it stores, so an unchanged field sent from
 * a stale row would undo an edit made since that row was read.
 */
export type EditEstateUpdateVariables = { updateId: string } & Partial<EstateUpdatePayload>;

export type EstateUpdateActionVariables = { updateId: string };

/**
 * `notifySubscribers` emails everyone holding a live plot on the estate, through
 * the BE's own queue and templates. The BE ignores it when the update has been
 * mailed before (`notified_at`), so a re-publish can never mail twice.
 */
export type PublishEstateUpdateVariables = EstateUpdateActionVariables & {
  notifySubscribers?: boolean;
};

/**
 * Always saves a draft — the create DTO has no `status`, and `published_at`
 * stays `null` until the first publish. Refused with 400
 * `HEADLINE_CONTAINS_ESTATE_NAME` or a validation error.
 */
export const useCreateEstateUpdate = (assetId: string) =>
  useEstateUpdateMutation(assetId, (payload: EstateUpdatePayload) =>
    apiPost(`/admin/assets/${assetId}/updates`, payload, WriteResultSchema)
  );

/**
 * Edits in place at any status; a published update changes for buyers straight
 * away and keeps its publish date. `updateId` addresses the URL only and is
 * stripped from the body, which `forbidNonWhitelisted` would otherwise reject.
 *
 * Refused with 404 `ESTATE_UPDATE_NOT_FOUND`, 400 `HEADLINE_CONTAINS_ESTATE_NAME`
 * (only when the headline changed), or a validation error.
 */
export const useEditEstateUpdate = (assetId: string) =>
  useEstateUpdateMutation(assetId, ({ updateId, ...body }: EditEstateUpdateVariables) =>
    apiPatch(`/admin/assets/${assetId}/updates/${updateId}`, body, WriteResultSchema)
  );

/**
 * Publishes a draft, or re-publishes an archived update. The first publish sets
 * `published_at`; a re-publish keeps the original date. Refused with 404
 * `ESTATE_UPDATE_NOT_FOUND` or 409 `INVALID_STATUS_TRANSITION`.
 */
export const usePublishEstateUpdate = (assetId: string) =>
  useEstateUpdateMutation(assetId, ({ updateId, notifySubscribers }: PublishEstateUpdateVariables) =>
    apiPost(
      `/admin/assets/${assetId}/updates/${updateId}/publish`,
      { notify_subscribers: notifySubscribers === true },
      WriteResultSchema
    )
  );

/**
 * Archive is the unpublish — there is no delete. Buyers stop seeing a published
 * update at once; `published_at` is left untouched. Refused with 404
 * `ESTATE_UPDATE_NOT_FOUND` or 409 `INVALID_STATUS_TRANSITION`.
 */
export const useArchiveEstateUpdate = (assetId: string) =>
  useEstateUpdateMutation(assetId, ({ updateId }: EstateUpdateActionVariables) =>
    apiPost(`/admin/assets/${assetId}/updates/${updateId}/archive`, {}, WriteResultSchema)
  );
