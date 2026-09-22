'use client';

import { useCallback } from 'react';

import { uploadToCloudinary } from '@/lib/utils/upload';

import { useAssetFormStore } from '../store/asset-form-store';

/* ============================================================
 * Upload-on-select.
 *
 * The backend takes URLs (`@IsUrl()`), not files — so something has to upload
 * before submit. Doing it on file-select rather than on submit means:
 *
 *   - submit is one fast request instead of a long upload then a request
 *   - a failed image is visible immediately, beside the field, rather than
 *     killing a four-level form that took ten minutes to fill in
 *   - the admin can retry that one file without touching anything else
 *
 * Status lives in the form store, keyed by field path, so the field and the
 * submit button read the same source.
 * ============================================================ */

const ASSET_FOLDER = 'assets';

export function useAssetUpload() {
  const startUpload = useAssetFormStore((state) => state.startUpload);
  const completeUpload = useAssetFormStore((state) => state.completeUpload);
  const failUpload = useAssetFormStore((state) => state.failUpload);

  /**
   * Resolves to the secure URL and byte size, or null when the upload failed.
   *
   * The size comes from Cloudinary's own response rather than `file.size` —
   * that's what the pitch-pack endpoint's `size_bytes` should describe, and
   * falling back to `file.size` only if Cloudinary omits it keeps a network
   * hiccup in that one field from failing the whole upload.
   */
  const uploadFile = useCallback(
    async (key: string, file: File): Promise<{ url: string; bytes: number } | null> => {
      startUpload(key, file.name);

      try {
        const result = await uploadToCloudinary(file, ASSET_FOLDER);
        const url: string | undefined = result?.secure_url;
        const bytes: number | undefined = result?.bytes;

        if (!url) throw new Error('Upload succeeded but returned no URL');

        completeUpload(key, url);
        return { url, bytes: bytes ?? file.size };
      } catch (error) {
        failUpload(key, error instanceof Error ? error.message : 'Upload failed');
        return null;
      }
    },
    [startUpload, completeUpload, failUpload]
  );

  /** Resolves to the secure URL, or null when the upload failed. */
  const upload = useCallback(
    async (key: string, file: File): Promise<string | null> => {
      const result = await uploadFile(key, file);
      return result?.url ?? null;
    },
    [uploadFile]
  );

  /**
   * Gallery uploads run in parallel and are reported per file, so one bad
   * image doesn't discard the rest of the selection.
   */
  const uploadMany = useCallback(
    async (keyPrefix: string, files: File[]): Promise<string[]> => {
      const results = await Promise.all(
        files.map((file, index) => upload(`${keyPrefix}.${index}.${file.name}`, file))
      );
      return results.filter((url): url is string => url !== null);
    },
    [upload]
  );

  return { upload, uploadMany, uploadFile };
}
