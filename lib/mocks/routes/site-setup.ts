import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, type MockAsset } from './assets';
import { body } from './util';

/* ============================================================
 * Site Setup — GET/PUT /admin/assets/:assetId/boundary, GET .../site-setup.
 *
 * Confirmed REAL against `abode-be-v2` staging's field-staff module
 * (`AssetSiteSetupController`/`SiteSetupService`) — this mock exists only
 * for offline/E2E parity, not because the real endpoint is missing. Fencing/
 * clearing/parcelation figures come from verified field-crew submissions on
 * the real backend; this mock fakes plausible progress numbers instead of
 * modelling the whole submission/verification pipeline, since only the
 * boundary + fencing READ view and the boundary WRITE are built here.
 * ============================================================ */

type Sides = { front: number; right: number; back: number; left: number };

type BoundaryVersion = {
  version: number;
  sides: Sides;
  perimeter_metres: number;
  is_current: boolean;
  source: 'admin' | 'surveyor_submission';
  submission_id: string | null;
  approved_at: string;
  note: string | null;
};

const boundaries: Record<string, BoundaryVersion[]> = {};

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'FIELD_SITE_NOT_FOUND');
  return row;
}

function perimeterOf(sides: Sides): number {
  return Math.round((sides.front + sides.right + sides.back + sides.left) * 100) / 100;
}

function currentBoundary(assetId: string): BoundaryVersion | undefined {
  return (boundaries[assetId] ?? []).find((v) => v.is_current);
}

/** Deterministic, plausible fencing progress against whatever boundary is currently approved. */
function fencedMetresFor(side: keyof Sides, approved: number | null): number {
  if (!approved) return 0;
  const fractions: Record<keyof Sides, number> = { front: 1, right: 0.6, back: 0.35, left: 0 };
  return Math.round(approved * fractions[side] * 100) / 100;
}

export const siteSetupRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/site-setup': ({ params }) => {
    const asset = requireAsset(params.assetId);
    const boundary = currentBoundary(params.assetId);

    const sides = (['front', 'right', 'back', 'left'] as const).map((side) => {
      const approved = boundary?.sides[side] ?? null;
      const fenced = fencedMetresFor(side, approved);
      return {
        side,
        approved_metres: approved,
        fenced_metres: fenced,
        repaired_metres: 0,
        remaining_metres: approved === null ? null : Math.max(0, approved - fenced),
        over_by_metres: approved === null ? null : Math.max(0, fenced - approved),
        percent_complete: approved && approved > 0 ? Math.min(100, Math.round((fenced / approved) * 10000) / 100) : null,
      };
    });

    const approvedPerimeter = boundary?.perimeter_metres ?? null;
    const totalFenced = Math.round(sides.reduce((sum, row) => sum + row.fenced_metres, 0) * 100) / 100;

    return {
      asset: { id: params.assetId, name: asset.name, total_land_sqm: asset.total_land_sqm ?? null },
      boundary: boundary
        ? {
            version: boundary.version,
            sides: boundary.sides,
            perimeter_metres: boundary.perimeter_metres,
            source: boundary.source,
            approved_at: boundary.approved_at,
            note: boundary.note,
          }
        : null,
      boundary_established_metres: approvedPerimeter ?? 0,
      fencing: {
        sides,
        total_fenced_metres: totalFenced,
        approved_perimeter_metres: approvedPerimeter,
        percent_complete:
          approvedPerimeter && approvedPerimeter > 0
            ? Math.min(100, Math.round((totalFenced / approvedPerimeter) * 10000) / 100)
            : null,
      },
      clearing: { cleared_sqm: 0, percent_of_estate: 0 },
      parcelation: { plots_parcelled: 0, plots_re_pegged: 0, distinct_plots_worked: 0 },
      readiness: {
        has_boundary: Boolean(boundary),
        fencing_started: totalFenced > 0,
        clearing_started: false,
        parcelation_started: false,
      },
    };
  },

  'GET /admin/assets/:assetId/boundary': ({ params }) => {
    requireAsset(params.assetId);
    return [...(boundaries[params.assetId] ?? [])].sort((a, b) => b.version - a.version);
  },

  'PUT /admin/assets/:assetId/boundary': ({ params, body: raw }) => {
    requireAsset(params.assetId);
    const dto = body<{ front?: number; right?: number; back?: number; left?: number; note?: string }>(raw);

    for (const key of ['front', 'right', 'back', 'left'] as const) {
      const value = dto[key];
      if (typeof value !== 'number' || value < 0.01 || value > 100_000) {
        throw new MockHttpError(400, `${key} must be a number of metres above zero`, 'VALIDATION_FAILED');
      }
    }

    const sides: Sides = { front: dto.front!, right: dto.right!, back: dto.back!, left: dto.left! };
    const existing = boundaries[params.assetId] ?? [];
    for (const v of existing) v.is_current = false;

    const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;
    const created: BoundaryVersion = {
      version: nextVersion,
      sides,
      perimeter_metres: perimeterOf(sides),
      is_current: true,
      source: 'admin',
      submission_id: null,
      approved_at: new Date().toISOString(),
      note: dto.note?.trim() || null,
    };
    boundaries[params.assetId] = [...existing, created];

    return { version: created.version, sides: created.sides, perimeter_metres: created.perimeter_metres };
  },
};
