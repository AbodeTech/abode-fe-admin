import { z } from 'zod';

/* ============================================================
 * Media — presigned S3 upload pipeline for course content blocks.
 * ✅ real — `CourseAdminController` (staging `7fefe13`): confirmed against
 * `MediaService`/`media-asset.schema.ts` source.
 *
 * Flow: POST /admin/media/upload-url (ticket) → browser PUTs the file
 * straight to `upload_url` (no auth header, no envelope — raw S3 PUT) →
 * POST /admin/media/:id/finalize → GET /admin/media/:id to poll status
 * until `ready`/`failed`. A block can't reference a media_asset_id until
 * it's `ready` (BE 400s `MEDIA_NOT_READY` otherwise).
 * ============================================================ */

export const MEDIA_KINDS = ['video', 'image', 'file'] as const;
export const MediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MEDIA_STATUSES = ['uploading', 'processing', 'ready', 'failed'] as const;
export const MediaStatusSchema = z.enum(MEDIA_STATUSES);
export type MediaStatus = z.infer<typeof MediaStatusSchema>;

export const UploadTicketSchema = z.object({
  media_asset_id: z.string(),
  upload_url: z.string(),
  storage_key: z.string(),
  expires_in: z.number(),
  max_bytes: z.number(),
});
export type UploadTicket = z.infer<typeof UploadTicketSchema>;

export const MediaAssetSchema = z.object({
  id: z.string(),
  kind: MediaKindSchema,
  status: MediaStatusSchema,
  progress_pct: z.number(),
  duration_s: z.number().nullable(),
  size_bytes: z.number().nullable(),
  renditions: z.record(z.string(), z.string()),
  external_url: z.string().nullable(),
  error: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
