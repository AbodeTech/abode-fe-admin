import { z } from 'zod';

import { TopographySchema, VisibilitySchema } from './asset.schema';
import type { AssetDetail } from './asset-detail.schema';

/* ============================================================
 * Per-section edit on the asset overview.
 *
 * `UpdateAssetDto` is `PartialType(OmitType(CreateAssetDto, ['offers']))`, so
 * every asset field is individually optional and offers are excluded — they
 * have their own endpoint family.
 *
 * Sections are split so each Save sends only the fields that section owns.
 * With `forbidNonWhitelisted` on, sending a derived field (`sold`,
 * `sold_units`, `reserved_units`) is a hard 400 — none of them appear here.
 * ============================================================ */

const optionalUrl = z.union([z.url('Must be a valid URL'), z.literal('')]).optional();

/* -------------------- details -------------------- */

export const assetDetailsFormSchema = z.object({
  name: z.string().trim().min(1, 'Give the asset a name'),
  asset_location: z.string().trim().optional(),
  asset_purpose: z.string().trim().optional(),
  topography: TopographySchema.optional(),
  // `string[]` in the form as well as on the wire — see create-asset.schema.ts.
  amenities: z.array(z.string().trim().min(1)),
  landmark: z.array(z.string().trim().min(1)),
  google_map: optionalUrl,
  description: z.string().trim().optional(),
});

export type AssetDetailsFormValues = z.infer<typeof assetDetailsFormSchema>;

export function assetToDetailsForm(asset: AssetDetail): AssetDetailsFormValues {
  return {
    name: asset.name,
    asset_location: asset.asset_location ?? '',
    asset_purpose: asset.asset_purpose ?? '',
    topography: asset.topography ?? undefined,
    amenities: asset.amenities ?? [],
    landmark: asset.landmark ?? [],
    google_map: asset.google_map ?? '',
    description: asset.description ?? '',
  };
}

export function detailsFormToPayload(values: AssetDetailsFormValues) {
  return {
    name: values.name,
    // Empty string clears a field; `undefined` would leave it untouched, and
    // an admin blanking a location means they want it gone.
    asset_location: values.asset_location ?? '',
    asset_purpose: values.asset_purpose ?? '',
    ...(values.topography ? { topography: values.topography } : {}),
    // Sent even when empty — this is a PATCH, and clearing every amenity has
    // to be expressible. `undefined` would leave the old list in place.
    amenities: values.amenities,
    landmark: values.landmark,
    ...(values.google_map ? { google_map: values.google_map } : {}),
    description: values.description ?? '',
  };
}

/* -------------------- availability -------------------- */

export const assetAvailabilityFormSchema = z.object({
  sales_cap: z
    .number({ message: 'Enter a sales cap' })
    .int('Whole units only')
    .positive('Must be greater than zero'),
  visibility: VisibilitySchema,
});

export type AssetAvailabilityFormValues = z.infer<typeof assetAvailabilityFormSchema>;

export function assetToAvailabilityForm(asset: AssetDetail): AssetAvailabilityFormValues {
  return { sales_cap: asset.sales_cap, visibility: asset.visibility };
}

/**
 * The backend does not validate `sales_cap` against units already sold, so a
 * cap below `sold_units + reserved_units` would leave `available_units`
 * negative. Checked here instead — see `validateSalesCap`.
 */
export function validateSalesCap(
  salesCap: number,
  asset: Pick<AssetDetail, 'sold_units' | 'reserved_units'>
): string | null {
  const committed = asset.sold_units + asset.reserved_units;
  if (salesCap < committed) {
    return `${committed.toLocaleString()} units are already sold or reserved — the cap can't be lower`;
  }
  return null;
}

/* -------------------- media -------------------- */

/**
 * No `.default()` here on purpose. A Zod default makes the schema's *input*
 * type optional while its *output* type is required, and RHF's resolver is
 * invariant in the form values — so the two no longer line up. `useForm`
 * supplies the initial values instead.
 */
export const assetMediaFormSchema = z.object({
  hero_image: optionalUrl,
  pictures: z.array(z.url()),
  documents: z.object({
    deed_of_assignment: optionalUrl,
    survey: optionalUrl,
    contract_of_sales: optionalUrl,
    estate_layout: optionalUrl,
  }),
});

export type AssetMediaFormValues = z.infer<typeof assetMediaFormSchema>;

export function assetToMediaForm(asset: AssetDetail): AssetMediaFormValues {
  return {
    hero_image: asset.hero_image ?? '',
    pictures: asset.pictures ?? [],
    documents: {
      deed_of_assignment: asset.documents?.deed_of_assignment ?? '',
      survey: asset.documents?.survey ?? '',
      contract_of_sales: asset.documents?.contract_of_sales ?? '',
      estate_layout: asset.documents?.estate_layout ?? '',
    },
  };
}

export function mediaFormToPayload(values: AssetMediaFormValues) {
  const documents = Object.fromEntries(
    Object.entries(values.documents ?? {}).filter(([, url]) => Boolean(url))
  );

  return {
    ...(values.hero_image ? { hero_image: values.hero_image } : {}),
    pictures: values.pictures ?? [],
    documents,
  };
}
