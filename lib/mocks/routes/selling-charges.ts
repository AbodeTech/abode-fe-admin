import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, type MockAsset, type MockOfferType } from './assets';
import { body } from './util';

/* ============================================================
 * Selling charges — GET/PUT /admin/assets/:assetId/selling-charges(/history),
 * confirmed field-for-field against `SellingChargeController`/
 * `SellingChargeService` on abode-be-v2 staging (PR #82). The real
 * replacement for the abandoned, never-wired "plan price versioning" design
 * — an asset-wide, versioned charge list rather than a per-plan land price.
 *
 * Reproduces a real backend quirk on purpose: `SellingChargeService.current()`
 * returns `{data: null, message}` when nothing has ever been approved, and
 * `TransformInterceptor`'s `data?.data ?? data` treats that explicit `null`
 * as falsy and falls back to the WHOLE `{data, message}` object — so a
 * never-configured estate's GET response is that nested object, not a plain
 * `null` (see selling-charges.schema.ts's `SellingChargesSchema` doc comment,
 * which parses both shapes). This mock returns exactly that shape so the
 * empty state is exercised faithfully in mock mode too, not smoothed over.
 * ============================================================ */

type ChargeLine = {
  charge_type: 'land_price' | 'development_levy' | 'documentation_levy' | 'survey_fee' | 'other';
  label: string;
  offer_type?: MockOfferType | null;
  size_id?: string | null;
  amount: number;
  basis: 'per_sqm' | 'per_unit' | 'flat';
  note?: string | null;
};

type StoredVersion = {
  version: number;
  charges: ChargeLine[];
  effective_date: string;
  is_current: boolean;
  reason: string;
  approved_by: string;
  approved_at: string;
};

const MOCK_ADMIN_EMAIL = 'nicholas@abode.ng';

/** Every version ever approved, keyed by asset id, oldest first. */
const versions: Record<string, StoredVersion[]> = {};

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'COST_ASSET_NOT_FOUND');
  return row;
}

function currentFor(assetId: string): StoredVersion | undefined {
  return (versions[assetId] ?? []).find((v) => v.is_current);
}

export const sellingChargesRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/selling-charges': ({ params }) => {
    requireAsset(params.assetId);
    const current = currentFor(params.assetId);

    if (!current) {
      // Faithfully reproduces the real backend's own bug — see this file's header.
      return { data: null, message: 'No selling charges have been approved for this estate yet' };
    }

    return {
      version: current.version,
      charges: current.charges,
      effective_date: current.effective_date,
      reason: current.reason,
      approved_by: current.approved_by,
    };
  },

  'GET /admin/assets/:assetId/selling-charges/history': ({ params }) => {
    requireAsset(params.assetId);
    return [...(versions[params.assetId] ?? [])].sort((a, b) => a.version - b.version).map((v) => ({
      version: v.version,
      charges: v.charges,
      effective_date: v.effective_date,
      is_current: v.is_current,
      reason: v.reason,
      approved_by: v.approved_by,
      approved_at: v.approved_at,
    }));
  },

  /**
   * No `expected_version` guard on the real PUT — last write always wins.
   * Confirmed from `setCharges()`'s source directly: it reads the highest
   * version and blindly supersedes it, with no conflict check at all. Not an
   * oversight in this mock — a real gap, flagged to the backend team rather
   * than invented here.
   */
  'PUT /admin/assets/:assetId/selling-charges': ({ params, body: raw }) => {
    requireAsset(params.assetId);
    const dto = body<{ charges?: ChargeLine[]; effective_date?: string; reason?: string }>(raw);

    if (!dto.reason?.trim()) {
      throw new MockHttpError(400, 'A reason is required', 'VALIDATION_FAILED');
    }
    if (!dto.effective_date?.trim()) {
      throw new MockHttpError(400, 'effective_date must be a date', 'VALIDATION_FAILED');
    }
    if (!dto.charges?.length) {
      throw new MockHttpError(400, 'charges should not be empty', 'VALIDATION_FAILED');
    }
    for (const charge of dto.charges) {
      if (!charge.label?.trim()) {
        throw new MockHttpError(400, 'Each charge needs a label', 'VALIDATION_FAILED');
      }
      if (typeof charge.amount !== 'number' || charge.amount < 0) {
        throw new MockHttpError(400, 'amount must be a non-negative number', 'VALIDATION_FAILED');
      }
    }

    const existing = versions[params.assetId] ?? [];
    for (const v of existing) v.is_current = false;

    const nextVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;
    const created: StoredVersion = {
      version: nextVersion,
      charges: dto.charges.map((c) => ({ ...c, basis: c.basis ?? 'per_unit' })),
      effective_date: dto.effective_date,
      is_current: true,
      reason: dto.reason.trim(),
      approved_by: MOCK_ADMIN_EMAIL,
      approved_at: new Date().toISOString(),
    };
    versions[params.assetId] = [...existing, created];

    return {
      version: created.version,
      charges: created.charges,
      effective_date: created.effective_date,
    };
  },
};
