import { z } from 'zod';

/* ============================================================
 * Site Setup — boundary measurement and fencing progress.
 *
 * Confirmed real against `abode-be-v2` staging's field-staff module
 * (`AssetSiteSetupController`, `SiteSetupService`) — this is NOT a mock.
 * Fencing/clearing/parcelation figures are computed server-side from
 * verified field-crew submissions; nothing here is admin-entered except the
 * approved boundary itself.
 *
 * "Roads and services" (non-saleable land: road-circulation, service-plot,
 * recreation-utility, public-use, other) is a DIFFERENT, already-built
 * real feature — the Land Account (see land-configuration.schema.ts) — not
 * part of Site Setup at all. Confirmed by reading the real backend: no
 * fieldwork-tracking data model exists for those categories.
 *
 * This file covers the boundary and the progress read. The rest of what the
 * Site Setup tab does (reviewing field-crew submissions, field costs, the
 * field team and allocation-event owners) is in field-operations.schema.ts.
 * ============================================================ */

export const FENCING_SIDES = ['front', 'right', 'back', 'left'] as const;
export type FencingSide = (typeof FENCING_SIDES)[number];

export const FENCING_SIDE_LABELS: Record<FencingSide, string> = {
  front: 'Front',
  right: 'Right',
  back: 'Back',
  left: 'Left',
};

export const BOUNDARY_SOURCES = ['admin', 'surveyor_submission'] as const;
export type BoundarySource = (typeof BOUNDARY_SOURCES)[number];

const BoundarySidesSchema = z.object({
  front: z.number(),
  right: z.number(),
  back: z.number(),
  left: z.number(),
});

export type BoundarySides = z.infer<typeof BoundarySidesSchema>;

/** The boundary block embedded in `GET .../site-setup` — `null` until one's ever been set. */
export const CurrentBoundarySchema = z.object({
  version: z.number(),
  sides: BoundarySidesSchema,
  perimeter_metres: z.number(),
  source: z.enum(BOUNDARY_SOURCES),
  approved_at: z.string().nullable(),
  note: z.string().nullable(),
});

export type CurrentBoundary = z.infer<typeof CurrentBoundarySchema>;

/** One row of `GET .../boundary` — every version ever approved, newest first. */
export const BoundaryVersionSchema = z.object({
  version: z.number(),
  sides: BoundarySidesSchema,
  perimeter_metres: z.number(),
  is_current: z.boolean(),
  source: z.enum(BOUNDARY_SOURCES),
  submission_id: z.string().nullable(),
  approved_at: z.string().nullable(),
  note: z.string().nullable(),
});

export type BoundaryVersion = z.infer<typeof BoundaryVersionSchema>;

const FencingSideRowSchema = z.object({
  side: z.enum(FENCING_SIDES),
  approved_metres: z.number().nullable(),
  fenced_metres: z.number(),
  repaired_metres: z.number(),
  remaining_metres: z.number().nullable(),
  over_by_metres: z.number().nullable(),
  percent_complete: z.number().nullable(),
});

export type FencingSideRow = z.infer<typeof FencingSideRowSchema>;

/** `GET /admin/assets/:assetId/site-setup` — the full picture in one call. */
export const SiteSetupSchema = z.object({
  asset: z.object({
    id: z.string(),
    name: z.string(),
    total_land_sqm: z.number().nullable(),
  }),
  boundary: CurrentBoundarySchema.nullable(),
  boundary_established_metres: z.number(),
  fencing: z.object({
    sides: z.array(FencingSideRowSchema),
    total_fenced_metres: z.number(),
    approved_perimeter_metres: z.number().nullable(),
    percent_complete: z.number().nullable(),
  }),
  clearing: z.object({
    cleared_sqm: z.number(),
    percent_of_estate: z.number().nullable(),
  }),
  parcelation: z.object({
    plots_parcelled: z.number(),
    plots_re_pegged: z.number(),
    distinct_plots_worked: z.number(),
  }),
  readiness: z.object({
    has_boundary: z.boolean(),
    fencing_started: z.boolean(),
    clearing_started: z.boolean(),
    parcelation_started: z.boolean(),
  }),
});

export type SiteSetup = z.infer<typeof SiteSetupSchema>;

/** `PUT .../boundary`'s response — narrower than a full history row, no `is_current`/`source`/etc. */
export const SetBoundaryResultSchema = z.object({
  version: z.number(),
  sides: BoundarySidesSchema,
  perimeter_metres: z.number(),
});

export type SetBoundaryResult = z.infer<typeof SetBoundaryResultSchema>;

/**
 * Mirrors the real `SetBoundaryDto` exactly: all 4 sides required, up to 2
 * decimal places, `(0, 100000]` metres. `note` optional, ≤300 chars.
 */
export const setBoundaryFormSchema = z.object({
  front: z.number({ message: 'Enter the front length' }).min(0.01, 'Must be above zero').max(100_000),
  right: z.number({ message: 'Enter the right length' }).min(0.01, 'Must be above zero').max(100_000),
  back: z.number({ message: 'Enter the back length' }).min(0.01, 'Must be above zero').max(100_000),
  left: z.number({ message: 'Enter the left length' }).min(0.01, 'Must be above zero').max(100_000),
  note: z.string().trim().max(300).optional(),
});

export type SetBoundaryFormValues = z.infer<typeof setBoundaryFormSchema>;

/** Front + right + back + left, rounded to 2dp — mirrors the real backend's `perimeterOf()`. */
export function perimeterOf(sides: BoundarySides): number {
  return Math.round((sides.front + sides.right + sides.back + sides.left) * 100) / 100;
}
