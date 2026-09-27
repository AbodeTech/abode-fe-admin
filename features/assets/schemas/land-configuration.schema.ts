import { z } from 'zod';

import { InventoryModelVersionSchema, LandInventoryStateSchema, OfferTypeSchema } from './asset.schema';

/* ============================================================
 * Land configuration — the physical-land account layered on top of the
 * existing unit-based Asset → AssetOffer → Size → Plan model
 * (asset.schema.ts). Real module confirmed on abode-be-v2 staging
 * (PR #82, "phase-1") — mirrors `LandConfigurationService` field-for-field.
 *
 * Two layers live here:
 *  - `productPoolFormSchema` / `unclassifiedSqm()` — the minimal pieces the
 *    Create Asset flow needs (create-asset.schema.ts imports these).
 *  - `LandConfigurationSchema` / `AssetLandUseSchema` /
 *    `LandConfigurationRevisionSchema` — the full read/write model for
 *    GET/PUT /admin/assets/:assetId/land-configuration and its history,
 *    added for the Land Account editor.
 *
 * ⚠️ After this feature ships there are FOUR independent sqm-bearing
 * concepts in this codebase that do not reconcile with one another:
 * block/plot sqm (block-plot.schema.ts), analytics-only sqm rollups
 * (asset-analytics.schema.ts / portfolio-analytics.schema.ts), offer-size
 * sqm (`size_sqm × configured_units`, asset-detail.schema.ts), and this
 * file's `total_land_sqm` / product-pool sqm. Do not sum across them as if
 * they were one number — each answers a different question.
 * ============================================================ */

export const ProductPoolSchema = z.object({
  offer_type: OfferTypeSchema,
  /** The product's commercial pool. Not the amount sold, not decremented by purchases in Phase 1. */
  assigned_sqm: z.number(),
});

export type ProductPool = z.infer<typeof ProductPoolSchema>;

export function totalAssignedSqm(pools: Pick<ProductPool, 'assigned_sqm'>[]): number {
  return pools.reduce((sum, pool) => sum + pool.assigned_sqm, 0);
}

/** Land assigned to no product yet, ignoring non-saleable land — the Create Asset preview's simpler question. */
export function unclassifiedSqm(totalLandSqm: number, pools: Pick<ProductPool, 'assigned_sqm'>[]): number {
  return totalLandSqm - totalAssignedSqm(pools);
}

/** One product's initial land assignment. Moved here from create-asset.schema.ts — both the create form and the Land Account editor need it. */
export const productPoolFormSchema = z.object({
  offer_type: OfferTypeSchema,
  assigned_sqm: z
    .number({ message: 'Enter an area' })
    .int('Whole square metres only')
    .min(0, 'Cannot be negative'),
});

export type ProductPoolFormValues = z.infer<typeof productPoolFormSchema>;

/* -------------------- non-saleable land -------------------- */

export const LAND_USE_CATEGORIES = [
  'road-circulation',
  'service-plot',
  'recreation-utility',
  'public-use',
  'other',
] as const;
export const LandUseCategorySchema = z.enum(LAND_USE_CATEGORIES);
export type LandUseCategory = z.infer<typeof LandUseCategorySchema>;

export const LAND_USE_CATEGORY_LABELS: Record<LandUseCategory, string> = {
  'road-circulation': 'Road / circulation',
  'service-plot': 'Service plot',
  'recreation-utility': 'Recreation / utility',
  'public-use': 'Public use',
  other: 'Other',
};

/**
 * A named non-saleable row — "Northern access road" under road-circulation,
 * "Transformer and security area" under service-plot, and so on. A category
 * may hold several named rows; `label` is required for `other` and optional
 * (but still a clearer estate-specific name) for the standard categories.
 *
 * This is the READ shape only (`present()` on the real backend) — it filters
 * out inactive rows before returning them, so there is no `is_active` field
 * here to check. The write side (`landUseFormSchema` below) is a different,
 * richer shape that round-trips `is_active` so a row can be retired.
 *
 * `id` is nullable — a confirmed real backend bug, not a hypothetical: a PUT
 * that adds a brand-new row (submitted with no `land_use_id`, which the real
 * `LandUseConfigDto` explicitly allows) gets its `id` computed from the
 * request's own pre-persistence snapshot rather than the freshly-inserted
 * document, so `replaceConfiguration()`'s response echoes `id: null` for
 * every row created in that same save — even though the DB row now has a
 * real ObjectId. A subsequent GET does return the real id; only that one PUT
 * response is affected. Treat a `null` id here as "just created, not yet
 * known" rather than a row to address by id.
 */
export const AssetLandUseSchema = z.object({
  id: z.string().nullable(),
  category: LandUseCategorySchema,
  label: z.string(),
  allocated_sqm: z.number(),
});

export type AssetLandUse = z.infer<typeof AssetLandUseSchema>;

export function totalNonSaleableSqm(rows: { allocated_sqm: number; is_active?: boolean }[]): number {
  return rows.filter((row) => row.is_active !== false).reduce((sum, row) => sum + row.allocated_sqm, 0);
}

/* -------------------- the full land account -------------------- */

export const LandConfigurationSizeSchema = z.object({
  id: z.string(),
  size_sqm: z.number(),
  configured_units: z.number(),
  configured_sqm: z.number(),
});

export type LandConfigurationSize = z.infer<typeof LandConfigurationSizeSchema>;

export const LandConfigurationProductSchema = z.object({
  offer_type: OfferTypeSchema,
  assigned_sqm: z.number(),
  /** 0 until size/plan capacity exists on this pool (set on the Offers tab). */
  configured_sqm: z.number().default(0),
  unconfigured_sqm: z.number(),
  /** False only for Developer Plot — a single sqm cap per estate, no catalogue sizes. */
  takes_sizes: z.boolean(),
  sizes: z.array(LandConfigurationSizeSchema).default([]),
});

export type LandConfigurationProduct = z.infer<typeof LandConfigurationProductSchema>;

/** Every legacy unit-counter field the estate still carries, shown for context only — never square metres. */
export const LegacyUnitInventorySchema = z.object({
  sales_cap: z.number(),
  sold_units: z.number(),
  reserved_units: z.number(),
  available_units: z.number(),
  note: z.string(),
});

/**
 * GET/PUT /admin/assets/:assetId/land-configuration.
 *
 * `total_land_sqm` is nullable — a `'not_configured'` legacy asset has no
 * total to compute a remainder from. `unclassified_sqm` is NOT nullable: the
 * backend's own calculator always resolves it to a number, defaulting to 0
 * when there's no total to classify against yet.
 */
export const LandConfigurationSchema = z.object({
  asset_id: z.string(),
  inventory_model_version: InventoryModelVersionSchema,
  state: LandInventoryStateSchema,
  version: z.number(),
  total_land_sqm: z.number().nullable(),
  saleable_assigned_sqm: z.number(),
  non_saleable_sqm: z.number(),
  unclassified_sqm: z.number(),
  products: z.array(LandConfigurationProductSchema).default([]),
  non_saleable: z.array(AssetLandUseSchema).default([]),
  legacy_unit_inventory: LegacyUnitInventorySchema,
  warnings: z.array(z.string()).default([]),
});

export type LandConfiguration = z.infer<typeof LandConfigurationSchema>;

/**
 * Estate-level reconciliation, handling the not-yet-configured (`null`
 * total) case honestly rather than treating it as zero. Used for the
 * editor's live preview while a save is being composed — `nonSaleable` here
 * is shaped like `landUseFormSchema`'s rows (which still carry `is_active`,
 * unlike the read-only `AssetLandUseSchema` above, since a row can be
 * retired mid-edit).
 */
export function reconcileLand(
  totalLandSqm: number | null,
  products: Pick<LandConfigurationProduct, 'assigned_sqm'>[],
  nonSaleable: { allocated_sqm: number; is_active?: boolean }[]
): {
  saleableAssignedSqm: number;
  nonSaleableSqm: number;
  unclassifiedSqm: number | null;
  isOverAllocated: boolean;
} {
  const saleableAssignedSqm = totalAssignedSqm(products);
  const nonSaleableSqm = totalNonSaleableSqm(nonSaleable);
  const unclassified = totalLandSqm === null ? null : totalLandSqm - saleableAssignedSqm - nonSaleableSqm;

  return {
    saleableAssignedSqm,
    nonSaleableSqm,
    unclassifiedSqm: unclassified,
    isOverAllocated: unclassified !== null && unclassified < 0,
  };
}

/** Per-product capacity check — always within capacity until sizes exist (see `configured_sqm` above). */
export function productCapacity(pool: Pick<LandConfigurationProduct, 'assigned_sqm' | 'configured_sqm'>): {
  unconfiguredSqm: number;
  isOverCapacity: boolean;
} {
  const unconfiguredSqm = pool.assigned_sqm - pool.configured_sqm;
  return { unconfiguredSqm, isOverCapacity: unconfiguredSqm < 0 };
}

/* -------------------- history -------------------- */

/**
 * GET .../land-configuration/history — a lightweight list row. `changed_by`
 * is a raw admin id (the backend does not resolve it to a display name);
 * prefer `changed_by_email` for rendering, falling back to the id.
 */
export const LandConfigurationHistoryEntrySchema = z.object({
  version: z.number(),
  reason: z.string(),
  changed_by: z.string(),
  changed_by_email: z.string().nullable(),
  changed_at: z.string(),
  summary: z.object({
    total_land_sqm: z.number().nullable(),
    saleable_assigned_sqm: z.number(),
    non_saleable_sqm: z.number(),
    unclassified_sqm: z.number(),
    state: LandInventoryStateSchema.nullable(),
  }),
});

export type LandConfigurationHistoryEntry = z.infer<typeof LandConfigurationHistoryEntrySchema>;

/**
 * The `before`/`after` shape on GET .../history/:version — a narrower
 * snapshot than `LandConfigurationSchema` (the live GET/PUT response): it
 * keeps `is_active` on every row (inactive ones aren't filtered out of a
 * historical snapshot) and never carries `legacy_unit_inventory`, `warnings`,
 * `inventory_model_version`, or `asset_id`.
 */
export const LandConfigurationSnapshotSchema = z.object({
  total_land_sqm: z.number().nullable(),
  saleable_assigned_sqm: z.number(),
  non_saleable_sqm: z.number(),
  configured_sqm: z.number(),
  unclassified_sqm: z.number(),
  state: LandInventoryStateSchema,
  products: z.array(
    z.object({
      offer_type: OfferTypeSchema,
      assigned_sqm: z.number(),
      configured_sqm: z.number(),
      unconfigured_sqm: z.number(),
      is_active: z.boolean(),
      sizes: z.array(
        z.object({
          size_id: z.string().nullable(),
          size_sqm: z.number(),
          configured_units: z.number(),
          configured_sqm: z.number(),
          is_active: z.boolean(),
        })
      ),
    })
  ),
  non_saleable: z.array(
    z.object({
      land_use_id: z.string().nullable(),
      category: LandUseCategorySchema,
      label: z.string(),
      allocated_sqm: z.number(),
      is_active: z.boolean(),
    })
  ),
});

export type LandConfigurationSnapshot = z.infer<typeof LandConfigurationSnapshotSchema>;

/** GET .../land-configuration/history/:version. `before` is null only for version 1. */
export const LandConfigurationRevisionSchema = z.object({
  version: z.number(),
  reason: z.string(),
  changed_by: z.string(),
  changed_by_email: z.string().nullable(),
  changed_at: z.string(),
  before: LandConfigurationSnapshotSchema.nullable(),
  after: LandConfigurationSnapshotSchema,
});

export type LandConfigurationRevision = z.infer<typeof LandConfigurationRevisionSchema>;

/* -------------------- errors -------------------- */

export const LAND_CONFIGURATION_ERROR_CODES = [
  'TOTAL_LAND_REQUIRED',
  'INVALID_LAND_QUANTITY',
  'LAND_ALLOCATION_EXCEEDS_TOTAL',
  'PRODUCT_SIZE_CAPACITY_EXCEEDED',
  'LAND_CONFIGURATION_VERSION_CONFLICT',
  'DEVELOPER_PLOT_MAPPING_REQUIRED',
  'LAND_CONFIGURATION_INCOMPLETE',
  'SQM_INVENTORY_NOT_ACTIVE',
  'LAND_REVISION_NOT_FOUND',
] as const;

export type LandConfigurationErrorCode = (typeof LAND_CONFIGURATION_ERROR_CODES)[number];

/* -------------------- editor form -------------------- */

export const landUseFormSchema = z
  .object({
    land_use_id: z.string().optional(),
    category: LandUseCategorySchema,
    label: z.string().trim(),
    allocated_sqm: z
      .number({ message: 'Enter an area' })
      .int('Whole square metres only')
      .min(0, 'Cannot be negative'),
    is_active: z.boolean().default(true),
  })
  .refine((row) => row.category !== 'other' || row.label.length > 0, {
    message: 'Give this "Other" row a name',
    path: ['label'],
  });

export type LandUseFormValues = z.infer<typeof landUseFormSchema>;

/**
 * The Land Account editor's complete-replacement save. `expected_version`
 * carries the version the drawer loaded, so a stale save 409s instead of
 * silently overwriting a newer one. The field is named `products` (not
 * `product_pools`) to match `ReplaceLandConfigurationDto` on the real
 * backend exactly.
 */
export const landConfigurationFormSchema = z
  .object({
    expected_version: z.number(),
    reason: z.string().trim().min(1, 'Say why this is changing'),
    total_land_sqm: z
      .number({ message: 'Enter the total estate size' })
      .int('Whole square metres only')
      .positive('Must be greater than zero'),
    products: z.array(productPoolFormSchema).default([]),
    non_saleable: z.array(landUseFormSchema).default([]),
  })
  .refine(
    (values) =>
      new Set(values.products.map((pool) => pool.offer_type)).size === values.products.length,
    { message: 'Each product can only be assigned once', path: ['products'] }
  )
  .refine(
    (values) => {
      const assigned = totalAssignedSqm(values.products);
      const nonSaleable = totalNonSaleableSqm(values.non_saleable);
      return assigned + nonSaleable <= values.total_land_sqm;
    },
    { message: 'Assigned and non-saleable sqm exceed the total estate size', path: ['total_land_sqm'] }
  );

/**
 * `products`/`non_saleable` carry `.default([])`, so the input type RHF
 * needs (arrays optional) differs from the parsed output type (arrays
 * required) — same split as `CreateAssetFormValues`/`CreateAssetFormOutput`
 * in create-asset.schema.ts. `useForm` takes the input type; the mutation
 * takes the output type produced by `landConfigurationFormSchema.parse()`.
 */
export type LandConfigurationFormValues = z.input<typeof landConfigurationFormSchema>;
export type LandConfigurationFormOutput = z.output<typeof landConfigurationFormSchema>;
