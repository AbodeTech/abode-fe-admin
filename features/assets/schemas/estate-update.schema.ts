import { z } from 'zod';

/* ============================================================
 * Estate updates — progress posts on one estate, from its detail Updates tab.
 *
 *   GET   /admin/assets/:id/updates                     list (?status=&page=&limit=)
 *   GET   /admin/assets/:id/updates/:updateId           one update
 *   POST  /admin/assets/:id/updates                     create — always a draft
 *   PATCH /admin/assets/:id/updates/:updateId           edit fields, any status
 *   POST  /admin/assets/:id/updates/:updateId/publish   draft | archived → published
 *   POST  /admin/assets/:id/updates/:updateId/archive   draft | published → archived
 *
 * Transcribed from abode-be-v2 `estate-update/estate-update.shape.ts`
 * (`toAdminEstateUpdate`) and `dto/estate-update-admin.dto.ts`. Unlike the
 * asset itself, the BE shapes this response, so it is `id` and `created_at`,
 * not Mongoose's `_id` and `createdAt`.
 *
 * Three BE rules the UI leans on rather than re-derives:
 * - Archive is the unpublish. There is no delete.
 * - `published_at` is set once, on the first publish, and never changes or
 *   clears after that. An update archived straight from draft keeps it `null`,
 *   which is how the row actions tell "Publish" from "Re-publish".
 * - The PATCH DTO has no `status` or `published_at`. With
 *   `forbidNonWhitelisted` on, sending either is a hard 400, so status only
 *   moves through the publish and archive endpoints.
 * ============================================================ */

export const ESTATE_UPDATE_CATEGORIES = [
  'construction',
  'title_documents',
  'allocation',
  'amenities',
  'general',
] as const;
export const EstateUpdateCategorySchema = z.enum(ESTATE_UPDATE_CATEGORIES);
export type EstateUpdateCategory = z.infer<typeof EstateUpdateCategorySchema>;

export const ESTATE_UPDATE_CATEGORY_LABELS: Record<EstateUpdateCategory, string> = {
  construction: 'Construction',
  title_documents: 'Title documents',
  allocation: 'Allocation',
  amenities: 'Amenities',
  general: 'General',
};

/** Who sees a published update: buyers with a live plan on the estate, or every signed-in buyer. */
export const ESTATE_UPDATE_AUDIENCES = ['owners', 'everyone'] as const;
export const EstateUpdateAudienceSchema = z.enum(ESTATE_UPDATE_AUDIENCES);
export type EstateUpdateAudience = z.infer<typeof EstateUpdateAudienceSchema>;

export const ESTATE_UPDATE_AUDIENCE_LABELS: Record<EstateUpdateAudience, string> = {
  owners: 'Plot owners only',
  everyone: 'Everyone on Abode',
};

export const ESTATE_UPDATE_STATUSES = ['draft', 'published', 'archived'] as const;
export const EstateUpdateStatusSchema = z.enum(ESTATE_UPDATE_STATUSES);
export type EstateUpdateStatus = z.infer<typeof EstateUpdateStatusSchema>;

export const ESTATE_UPDATE_STATUS_LABELS: Record<EstateUpdateStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const ESTATE_UPDATE_HEADLINE_MAX = 80;
export const ESTATE_UPDATE_BODY_MAX = 5000;
export const ESTATE_UPDATE_MAX_IMAGES = 4;

/**
 * Legal status moves, mirroring the BE's `ESTATE_UPDATE_TRANSITIONS`. Anything
 * else, including a move to the same status, is a 409
 * `INVALID_STATUS_TRANSITION`. The server stays the authority; this only
 * decides which actions a row offers.
 */
export const ESTATE_UPDATE_TRANSITIONS: Record<EstateUpdateStatus, readonly EstateUpdateStatus[]> = {
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: ['published'],
};

/** Mirrors BE `toAdminEstateUpdate` field-for-field (GET /admin/assets/:id/updates[/:updateId]). */
export const EstateUpdateSchema = z.object({
  id: z.string(),
  asset_id: z.string(),
  headline: z.string(),
  category: EstateUpdateCategorySchema,
  body: z.string().nullable(),
  progress_percent: z.number().nullable(),
  images: z.array(z.string()),
  audience: EstateUpdateAudienceSchema,
  status: EstateUpdateStatusSchema,
  published_at: z.string().nullable(),
  /** Set the first time this update's plot holders were emailed; never mailed twice. */
  notified_at: z.string().nullable(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type EstateUpdate = z.infer<typeof EstateUpdateSchema>;

/**
 * Body of POST /admin/assets/:id/updates; the PATCH sends the subset that
 * changed (`estateUpdateChanges`). Exactly the DTO keys: `forbidNonWhitelisted`
 * makes any extra key a 400.
 */
export type EstateUpdatePayload = {
  headline: string;
  category: EstateUpdateCategory;
  body: string | null;
  progress_percent: number | null;
  images: string[];
  audience: EstateUpdateAudience;
};

/* -------------------- form -------------------- */

/**
 * react-hook-form schema. No `.default()`, for the resolver-typing reason in
 * `edit-asset.schema.ts`; `useForm` supplies `EMPTY_ESTATE_UPDATE_FORM`
 * instead. No trim transform either, so the input keeps what the admin typed
 * while the length rules still measure the trimmed value. Trimming happens once,
 * in `estateUpdateFormToPayload`.
 */
export const estateUpdateFormSchema = z.object({
  headline: z
    .string()
    .refine((value) => value.trim().length > 0, 'Add a headline')
    .refine(
      (value) => value.trim().length <= ESTATE_UPDATE_HEADLINE_MAX,
      `Keep it to ${ESTATE_UPDATE_HEADLINE_MAX} characters`
    ),
  category: EstateUpdateCategorySchema,
  // A blank textarea is '' here and `null` on the wire.
  body: z.string().max(ESTATE_UPDATE_BODY_MAX, `Keep it to ${ESTATE_UPDATE_BODY_MAX} characters`),
  progress_percent: z
    .number()
    .int('Whole numbers only')
    .min(0, '0 to 100')
    .max(100, '0 to 100')
    .nullable(),
  images: z.array(z.url()).max(ESTATE_UPDATE_MAX_IMAGES, `Up to ${ESTATE_UPDATE_MAX_IMAGES} images`),
  audience: EstateUpdateAudienceSchema,
});

export type EstateUpdateFormValues = z.infer<typeof estateUpdateFormSchema>;

/** The BE's own defaults for a new update: `general`, owners only, no progress. */
export const EMPTY_ESTATE_UPDATE_FORM: EstateUpdateFormValues = {
  headline: '',
  category: 'general',
  body: '',
  progress_percent: null,
  images: [],
  audience: 'owners',
};

export function estateUpdateToForm(update: EstateUpdate): EstateUpdateFormValues {
  return {
    headline: update.headline,
    category: update.category,
    body: update.body ?? '',
    progress_percent: update.progress_percent,
    // A copy, so the gallery field never mutates the cached row.
    images: [...update.images],
    audience: update.audience,
  };
}

/**
 * Built key by key rather than spread from the form values, so nothing the
 * form ever grows can leak into the body and turn a save into a 400.
 */
export function estateUpdateFormToPayload(values: EstateUpdateFormValues): EstateUpdatePayload {
  return {
    headline: values.headline.trim(),
    category: values.category,
    // A cleared body is sent as `null`, matching what the BE stores.
    body: values.body.trim() || null,
    progress_percent: values.progress_percent,
    images: [...values.images],
    audience: values.audience,
  };
}

/**
 * The PATCH body for an edit: only the payload fields that differ from the row
 * the form was filled from. The BE writes every field it is sent that differs
 * from what it stores, so resending an untouched field from a stale row would
 * undo an edit made since (another admin's, or this admin's own save whose
 * refetch hasn't landed). Both sides go through `estateUpdateFormToPayload`, so
 * trimming and the `''` → `null` body compare like for like. Values compare
 * with `JSON.stringify`, as the BE does for images. An empty result means
 * nothing changed.
 */
export function estateUpdateChanges(
  update: EstateUpdate,
  payload: EstateUpdatePayload
): Partial<EstateUpdatePayload> {
  const before = estateUpdateFormToPayload(estateUpdateToForm(update));
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(before[key as keyof EstateUpdatePayload])
    )
  ) as Partial<EstateUpdatePayload>;
}

/**
 * Same rule as the BE's `headlineMentionsEstate`: a case-insensitive substring
 * check against the trimmed asset name. The name sits next to the headline
 * everywhere buyers see it, so repeating it only wastes the 80 characters.
 *
 * Returns false when the name is missing or shorter than 3 characters, where a
 * substring match would flag ordinary words. The BE refuses a match with 400
 * `HEADLINE_CONTAINS_ESTATE_NAME`; checking here just catches it before the
 * round trip.
 */
export function headlineMentionsEstate(
  headline: string,
  assetName: string | null | undefined
): boolean {
  const name = assetName?.trim().toLowerCase() ?? '';
  if (name.length < 3) return false;
  return headline.toLowerCase().includes(name);
}
