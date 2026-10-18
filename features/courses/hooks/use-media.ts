'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

import { apiDelete, apiGet, apiPost } from '@/lib/api-client';

import { MediaAssetSchema, UploadTicketSchema, type MediaAsset, type MediaKind } from '../schemas/media.schema';
import { courseKeys } from './query-keys';

const useCreateUploadTicket = () =>
  useMutation({
    mutationFn: (dto: { kind: MediaKind; content_type: string; filename: string; size_bytes?: number }) =>
      apiPost('/admin/media/upload-url', dto, UploadTicketSchema),
  });

const useFinalizeMedia = () =>
  useMutation({
    mutationFn: ({ id, duration_s }: { id: string; duration_s?: number }) =>
      apiPost(`/admin/media/${id}/finalize`, duration_s ? { duration_s } : {}, MediaAssetSchema),
  });

export const useCreateExternalMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (externalUrl: string) => apiPost('/admin/media/external', { external_url: externalUrl }, MediaAssetSchema),
    onSuccess: (asset) => queryClient.setQueryData(courseKeys.media(asset.id), asset),
  });
};

/** Polls while `processing` (server-side transcode) — stops once `ready`/`failed`. */
export const useMediaStatus = (mediaId: string | null, options: { poll?: boolean } = {}) =>
  useQuery({
    queryKey: courseKeys.media(mediaId ?? ''),
    queryFn: () => apiGet(`/admin/media/${mediaId}`, MediaAssetSchema),
    enabled: Boolean(mediaId),
    refetchInterval: (query) => {
      if (!options.poll) return false;
      const status = query.state.data?.status;
      return status === 'processing' || status === 'uploading' ? 2000 : false;
    },
  });

export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/media/${id}`, z.looseObject({})),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: courseKeys.media(id) });
    },
  });
};

export type UploadProgress = { loaded: number; total: number | null; pct: number | null };

/**
 * The whole direct-to-S3 flow in one call: `POST /admin/media/upload-url` for
 * a ticket, a raw `PUT` straight to that presigned URL (no auth header, no
 * envelope — a plain `axios` instance, not the app's `apiClient`), then
 * `POST /admin/media/:id/finalize`. Returns the finalized asset, which is
 * `ready` for image/file or `processing` (transcoding) for video — poll with
 * `useMediaStatus(id, { poll: true })` in the latter case.
 */
export const useUploadMedia = () => {
  const createTicket = useCreateUploadTicket();
  const finalize = useFinalizeMedia();

  const mutation = useMutation({
    mutationFn: async ({
      kind,
      file,
      durationSeconds,
      onProgress,
    }: {
      kind: MediaKind;
      file: File;
      /** Video duration the browser measured — pass for `video` uploads. */
      durationSeconds?: number;
      onProgress?: (progress: UploadProgress) => void;
    }): Promise<MediaAsset> => {
      const ticket = await createTicket.mutateAsync({
        kind,
        content_type: file.type,
        filename: file.name,
        size_bytes: file.size,
      });

      await axios.put(ticket.upload_url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (event) => {
          onProgress?.({
            loaded: event.loaded,
            total: event.total ?? null,
            pct: event.total ? Math.round((event.loaded / event.total) * 100) : null,
          });
        },
      });

      return finalize.mutateAsync({ id: ticket.media_asset_id, duration_s: durationSeconds });
    },
  });

  return {
    ...mutation,
    /** True while either the ticket/PUT/finalize step is running. */
    isPending: mutation.isPending || createTicket.isPending || finalize.isPending,
  };
};
