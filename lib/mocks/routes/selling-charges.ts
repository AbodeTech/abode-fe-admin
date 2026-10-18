import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, type MockAsset, type MockOfferType } from './assets';
import { body } from './util';

/* ============================================================
 * Selling charges — GET/PUT /admin/assets/:assetId/selling-charges(/history).
 * Mirrors `SellingChargeService` on abode-be-v2 staging as of commit 0f042ef
 * (28 Sep 2026): GET returns the version in force plus any scheduled ones,
 * rows carry `is_latest`, and PUT enforces `expected_version` with a 409.
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

function present(v: StoredVersion) {
  return {
    version: v.version,
    charges: v.charges,
    effective_date: new Date(v.effective_date).toISOString(),
    is_latest: v.is_current,
    reason: v.reason,
    approved_by: v.approved_by,
    approved_at: v.approved_at,
  };
}

export const sellingChargesRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/selling-charges': ({ params }) => {
    requireAsset(params.assetId);
    const all = versions[params.assetId] ?? [];
    const now = Date.now();
    const startsAt = (v: StoredVersion) => new Date(v.effective_date).getTime();

    // In force: the newest version whose effective date has arrived.
    const inForce = all
      .filter((v) => startsAt(v) <= now)
      .sort((a, b) => startsAt(b) - startsAt(a) || b.version - a.version)[0];
    const scheduled = all.filter((v) => startsAt(v) > now).sort((a, b) => startsAt(a) - startsAt(b));

    return {
      as_of: new Date(now).toISOString(),
      in_force: inForce ? present(inForce) : null,
      scheduled: scheduled.map(present),
      latest_version: all.length > 0 ? Math.max(...all.map((v) => v.version)) : 0,
    };
  },

  'GET /admin/assets/:assetId/selling-charges/history': ({ params }) => {
    requireAsset(params.assetId);
    return [...(versions[params.assetId] ?? [])].sort((a, b) => a.version - b.version).map(present);
  },

  'PUT /admin/assets/:assetId/selling-charges': ({ params, body: raw }) => {
    requireAsset(params.assetId);
    const dto = body<{ expected_version?: number; charges?: ChargeLine[]; effective_date?: string; reason?: string }>(raw);

    if (!Number.isInteger(dto.expected_version)) {
      throw new MockHttpError(400, 'expected_version must be a whole number', 'VALIDATION_FAILED');
    }
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
    const currentVersion = existing.length > 0 ? Math.max(...existing.map((v) => v.version)) : 0;
    if (dto.expected_version !== currentVersion) {
      throw new MockHttpError(
        409,
        'These selling charges were changed by someone else. Reload and try again.',
        'SELLING_CHARGE_VERSION_CONFLICT'
      );
    }

    for (const v of existing) v.is_current = false;
    const created: StoredVersion = {
      version: currentVersion + 1,
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
      effective_date: new Date(created.effective_date).toISOString(),
      starts_in_future: new Date(created.effective_date).getTime() > Date.now(),
    };
  },
};
