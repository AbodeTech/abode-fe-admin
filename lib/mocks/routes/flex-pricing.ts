import { MockHttpError, type MockRoutes } from '../router';
import { recordOfferConfigChange, requireSizeIndexed } from './assets';
import {
  MOCK_PRICING_ADMIN,
  basePayments,
  ensurePricingState,
  failValidation,
  liveVersion,
  previewRowsFor,
  validatePricingBody,
  type MockPricingState,
  type MockPricingVersion,
} from './flex-pricing-store';
import { body, paged } from './util';

/* ============================================================
 * Flex 2.0 base-plan pricing — the nine routes under
 *   /admin/assets/:assetId/offers/flex/sizes/:sizeId/pricing
 *
 * Mirrors the proposed contract in docs/FLEX-2.0-ENDPOINTS.pdf §3.2. Nothing
 * here exists on staging yet; the UI is built against this until it does.
 * State lives in flex-pricing-store.ts, which assets.ts also reads to
 * decorate the detail tree.
 * ============================================================ */

const naira = (value: number) => `₦${value.toLocaleString('en-NG')}`;

const checkpointText = (checkpoints: { months: number; discount_pct: number }[]) =>
  [...checkpoints]
    .sort((a, b) => b.months - a.months)
    .map((c) => `${c.discount_pct}% @ ${c.months}`)
    .join(', ');

function load(assetId: string, sizeId: string) {
  const { size, index } = requireSizeIndexed(assetId, 'flex', sizeId);
  const state = ensurePricingState(size, { isFlex: true, index });
  if (!state) throw new MockHttpError(404, 'Size not found', 'SIZE_NOT_FOUND');
  return { size, state };
}

function versionPayload(version: MockPricingVersion, state: MockPricingState) {
  const live = liveVersion(state);
  return {
    version: version.version,
    based_on_version: version.based_on_version,
    base_tenor_months: 36,
    base_price_per_unit: version.base_price_per_unit,
    ...basePayments(version),
    checkpoints: version.checkpoints,
    method_version: 'piecewise-linear-v1',
    published_by: version.published_by,
    published_at: version.published_at,
    purchase_count: version.purchase_count,
    pending_transfer_count: version.pending_transfer_count,
    status: live?.version === version.version ? 'live' : 'superseded',
  };
}

function draftPayload(state: MockPricingState) {
  if (!state.draft) return null;
  const live = liveVersion(state);
  return { ...state.draft, next_version: (live?.version ?? 0) + 1 };
}

function createVersion(state: MockPricingState, basePrice: number, checkpoints: { months: number; discount_pct: number }[]): MockPricingVersion {
  const live = liveVersion(state);
  const version: MockPricingVersion = {
    version: (live?.version ?? 0) + 1,
    based_on_version: live?.version ?? null,
    base_price_per_unit: basePrice,
    checkpoints,
    published_by: MOCK_PRICING_ADMIN,
    published_at: new Date().toISOString(),
    purchase_count: 0,
    pending_transfer_count: 0,
  };
  state.versions.push(version);
  state.draft = null;
  return version;
}

const PREFIX = '/admin/assets/:assetId/offers/flex/sizes/:sizeId/pricing';

export const flexPricingRoutes: MockRoutes = {
  [`GET ${PREFIX}`]: ({ params }) => {
    const { size, state } = load(params.assetId, params.sizeId);
    const live = liveVersion(state);
    const plan36 = size.plans.find((plan) => plan.tenor_months === 36 && plan.is_active);

    return {
      size_id: size._id,
      size_sqm: size.size_sqm,
      pricing_mode: state.mode,
      limits: { base_tenor_months: 36, min_tenor_months: 12, checkpoint_months: [24, 12] },
      live: live ? versionPayload(live, state) : null,
      draft: draftPayload(state),
      legacy:
        state.mode === 'tenor_list'
          ? {
              tenor_36_land_price: plan36?.land_price ?? null,
              active_tenors: size.plans.filter((plan) => plan.is_active).map((plan) => plan.tenor_months).sort((a, b) => a - b),
            }
          : null,
    };
  },

  [`POST ${PREFIX}/preview`]: ({ params, body: raw }) => {
    load(params.assetId, params.sizeId);
    const { errors, basePrice, checkpoints } = validatePricingBody(raw);
    if (errors.length > 0 || basePrice === undefined || !checkpoints) {
      return { valid: false, errors, first_payment: null, monthly_payment: null, final_payment: null, rows: [] };
    }
    const rows = previewRowsFor(basePrice, checkpoints);
    const baseRow = rows.find((row) => row.is_base)!;
    return {
      valid: true,
      errors: [],
      first_payment: baseRow.regular_payment,
      monthly_payment: baseRow.regular_payment,
      final_payment: baseRow.final_payment,
      rows,
    };
  },

  [`PUT ${PREFIX}/draft`]: ({ params, body: raw }) => {
    const { state } = load(params.assetId, params.sizeId);
    // A tenor-list size may hold a draft too: preparing its conversion ahead of launch (Q8) is exactly what a draft is for.
    const dto = body<{ base_price_per_unit?: unknown; checkpoints?: unknown }>(raw);
    const list = Array.isArray(dto.checkpoints) ? (dto.checkpoints as { months: number; discount_pct: number }[]) : [];
    const shapeOk =
      typeof dto.base_price_per_unit === 'number' &&
      dto.base_price_per_unit >= 0 &&
      list.length === 2 &&
      list.every((c) => typeof c.months === 'number' && typeof c.discount_pct === 'number' && c.discount_pct >= 0);
    if (!shapeOk) {
      failValidation([{ field: 'checkpoints', code: 'CHECKPOINTS_INVALID', message: 'A draft needs a base price and both discounts.' }]);
    }

    const live = liveVersion(state);
    state.draft = {
      based_on_version: live?.version ?? null,
      base_price_per_unit: dto.base_price_per_unit as number,
      checkpoints: list.map((c) => ({ months: c.months, discount_pct: c.discount_pct })).sort((a, b) => b.months - a.months),
      saved_by: MOCK_PRICING_ADMIN,
      saved_at: new Date().toISOString(),
    };
    return draftPayload(state);
  },

  [`DELETE ${PREFIX}/draft`]: ({ params }) => {
    const { state } = load(params.assetId, params.sizeId);
    state.draft = null;
    return { message: 'Draft discarded' };
  },

  [`POST ${PREFIX}/publish`]: ({ params, body: raw }) => {
    const { size, state } = load(params.assetId, params.sizeId);
    if (state.mode === 'tenor_list') {
      throw new MockHttpError(409, 'This size is on a hand-entered tenor list. Convert it to a base plan instead.', 'PRICING_MODE_CONFLICT');
    }

    const live = liveVersion(state);
    const expected = (body<{ expected_live_version?: number | null }>(raw).expected_live_version ?? null) as number | null;
    if (expected !== (live?.version ?? null)) {
      throw new MockHttpError(
        409,
        `Pricing changed while you were editing — v${live?.version ?? 'none'} is now live. Reload and review before publishing.`,
        'PRICING_VERSION_CONFLICT'
      );
    }

    const { errors, basePrice, checkpoints } = validatePricingBody(raw);
    if (errors.length > 0 || basePrice === undefined || !checkpoints) failValidation(errors);

    const version = createVersion(state, basePrice, checkpoints);
    state.mode = 'base_plan';
    recordOfferConfigChange(
      params.assetId,
      'publish-pricing',
      `${size.size_sqm} sqm · Pricing v${version.version} — ${checkpointText(checkpoints)} · base ${naira(basePrice)}`,
      { size_id: size._id, pricing_version: version.version }
    );
    return versionPayload(version, state);
  },

  [`GET ${PREFIX}/versions`]: ({ params, query }) => {
    const { state } = load(params.assetId, params.sizeId);
    return paged(
      [...state.versions].reverse().map((version) => versionPayload(version, state)),
      query,
      20
    );
  },

  [`GET ${PREFIX}/versions/:version`]: ({ params }) => {
    const { state } = load(params.assetId, params.sizeId);
    const version = state.versions.find((candidate) => candidate.version === Number(params.version));
    if (!version) throw new MockHttpError(404, 'Pricing version not found', 'PRICING_VERSION_NOT_FOUND');
    return versionPayload(version, state);
  },

  [`POST ${PREFIX}/convert-legacy`]: ({ params, body: raw }) => {
    const { size, state } = load(params.assetId, params.sizeId);
    if (state.mode !== 'tenor_list') {
      throw new MockHttpError(409, 'This size is already priced by a base plan.', 'PRICING_MODE_CONFLICT');
    }

    const { errors, basePrice, checkpoints } = validatePricingBody(raw);
    if (errors.length > 0 || basePrice === undefined || !checkpoints) failValidation(errors);

    const version = createVersion(state, basePrice, checkpoints);
    state.mode = 'base_plan';
    recordOfferConfigChange(
      params.assetId,
      'convert-pricing',
      `${size.size_sqm} sqm · moved from a tenor list to a base plan — Pricing v${version.version} — ${checkpointText(checkpoints)} · base ${naira(basePrice)}`,
      { size_id: size._id, pricing_version: version.version }
    );
    return { version: versionPayload(version, state), size: { _id: size._id, pricing_mode: 'base_plan', plans: [] } };
  },
};
