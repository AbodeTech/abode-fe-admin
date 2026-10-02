'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiPut } from '@/lib/api-client';
import { uploadToCloudinary } from '@/lib/utils/upload';

import { PitchPackSchema } from '../schemas/asset-detail.schema';
import { assetKeys } from './query-keys';

/** `MAX_PITCH_PACK_BYTES` on the backend's `SetPitchPackDto`. */
export const MAX_PITCH_PACK_BYTES = 100 * 1024 * 1024;

/**
 * PUT /admin/assets/:id/pitch-pack — the estate's pitch pack, the PDF realtors
 * download from their own app. The backend stores a link and a size, not a
 * file, so the PDF is uploaded first and the PUT records where it landed.
 * Sending again replaces the pack.
 */
export const useSetPitchPack = (assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.type !== 'application/pdf') throw new Error('The pitch pack must be a PDF');
      if (file.size > MAX_PITCH_PACK_BYTES) throw new Error('The pitch pack must be 100 MB or smaller');

      const uploaded = await uploadToCloudinary(file, 'assets/pitch-packs');
      const url: string | undefined = uploaded?.secure_url;
      const uploadedBytes: number = uploaded?.bytes ?? file.size;
      if (!url) throw new Error('Upload succeeded but returned no URL');
      if (uploadedBytes > MAX_PITCH_PACK_BYTES) {
        throw new Error('The uploaded pitch pack must be 100 MB or smaller');
      }

      return apiPut(
        `/admin/assets/${assetId}/pitch-pack`,
        { url, size_bytes: uploadedBytes },
        PitchPackSchema
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId), exact: true });
    },
  });
};

/** DELETE /admin/assets/:id/pitch-pack — `{removed: false}` when there was none. */
export const useRemovePitchPack = (assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete(`/admin/assets/${assetId}/pitch-pack`, z.object({ removed: z.boolean() })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(assetId), exact: true });
    },
  });
};
