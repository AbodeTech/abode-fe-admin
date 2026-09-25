import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset } from './assets';

/* ============================================================
 * Per-asset analytics — GET /admin/assets/:assetId/analytics.
 *
 * 🚧 Provisional in THIS mock layer only — unlike asset-costs.ts/
 * profitability-basis.ts, a real abode-be-v2 module for this exists
 * ("ticket 17b, now live" per asset-analytics.schema.ts's own header), but it
 * was never given a mock here, so every call to this route threw
 * MOCK_ROUTE_NOT_FOUND in mock-mode dev — the Performance tab (and the
 * profit columns Costs & Profitability Slice 3 added to its payment-plan
 * matrix) could never render at all until this file existed. Delete this
 * file once mock mode can point at the real module instead.
 *
 * Carved out of the assets domain's /admin/assets/* claim the same way
 * land-configuration.ts / asset-costs.ts are — the segment after :assetId is
 * the literal "analytics".
 * ============================================================ */

type MockLifecycleBucket = {
  customers: number;
  plans: number;
  value: number;
  amount_paid: number;
  amount_owing: number;
};

type MockPlanBreakdown = {
  month_subscription: number;
  plan_count: number;
  units_sold: number;
  sqm_sold: number;
  sold_value: number;
  money_received: number;
  balance_owed: number;
  efficiency: number;
  defaulting: MockLifecycleBucket;
  terminated: MockLifecycleBucket;
};

type MockSizeGroup = {
  size: number;
  start_value: number;
  capacity_sqm: number;
  capacity_units: number;
  units_sold: number;
  sqm_sold: number;
  sqm_remaining: number;
  sold_value: number;
  efficiency: number;
  plans: MockPlanBreakdown[];
};

type MockAssetAnalytics = {
  asset_id: string;
  asset_name: string | null;
  location: string | null;
  total_inventory_value: number;
  total_realised: number;
  remaining_value: number;
  total_value_sold: number;
  balance_owed: number;
  total_capacity_sqm: number;
  total_capacity_units: number;
  sqm_sold: number;
  sqm_remaining: number;
  efficiency_rate: number;
  occupancy_rate: number;
  total_plans: number;
  active_plans: number;
  active_customers: number;
  total_customers: number;
  defaulting: MockLifecycleBucket;
  terminated: MockLifecycleBucket;
  size_plan_breakdown: MockSizeGroup[];
};

const zeroBucket = (): MockLifecycleBucket => ({ customers: 0, plans: 0, value: 0, amount_paid: 0, amount_owing: 0 });

/** Keyed by asset id. */
const analyticsByAsset: Record<string, MockAssetAnalytics> = {};

function seedIfNeeded(assetId: string): void {
  if (analyticsByAsset[assetId]) return;
  const row = findActiveAsset(assetId);
  if (!row) return;

  if (assetId === '665faaaa00000000000000a1') {
    const size300Defaulting: MockLifecycleBucket = {
      customers: 3,
      plans: 3,
      value: 45_000_000,
      amount_paid: 20_000_000,
      amount_owing: 25_000_000,
    };
    const size300Terminated: MockLifecycleBucket = {
      customers: 2,
      plans: 2,
      value: 30_000_000,
      amount_paid: 10_000_000,
      amount_owing: 5_000_000,
    };

    const size300: MockSizeGroup = {
      size: 300,
      start_value: 700_000_000,
      capacity_sqm: 90_000,
      capacity_units: 300,
      units_sold: 210,
      sqm_sold: 63_000,
      sqm_remaining: 27_000,
      sold_value: 490_000_000,
      efficiency: 70,
      plans: [
        {
          month_subscription: 0,
          plan_count: 50,
          units_sold: 50,
          sqm_sold: 15_000,
          sold_value: 120_000_000,
          money_received: 120_000_000,
          balance_owed: 0,
          efficiency: 100,
          defaulting: zeroBucket(),
          terminated: zeroBucket(),
        },
        {
          month_subscription: 12,
          plan_count: 160,
          units_sold: 160,
          sqm_sold: 48_000,
          sold_value: 370_000_000,
          money_received: 250_000_000,
          balance_owed: 120_000_000,
          efficiency: 67.6,
          defaulting: size300Defaulting,
          terminated: size300Terminated,
        },
      ],
    };

    const size500: MockSizeGroup = {
      size: 500,
      start_value: 900_000_000,
      capacity_sqm: 75_000,
      capacity_units: 150,
      units_sold: 90,
      sqm_sold: 45_000,
      sqm_remaining: 30_000,
      sold_value: 540_000_000,
      efficiency: 60,
      plans: [
        {
          month_subscription: 0,
          plan_count: 20,
          units_sold: 20,
          sqm_sold: 10_000,
          sold_value: 120_000_000,
          money_received: 120_000_000,
          balance_owed: 0,
          efficiency: 100,
          defaulting: zeroBucket(),
          terminated: zeroBucket(),
        },
        {
          month_subscription: 12,
          plan_count: 70,
          units_sold: 70,
          sqm_sold: 35_000,
          sold_value: 420_000_000,
          money_received: 300_000_000,
          balance_owed: 120_000_000,
          efficiency: 71.4,
          defaulting: zeroBucket(),
          terminated: zeroBucket(),
        },
      ],
    };

    analyticsByAsset[assetId] = {
      asset_id: assetId,
      asset_name: row.name,
      location: row.asset_location,
      // Kept equal to estate-profitability.ts's expected_selling_value for this
      // asset, since that value now reads from getAnalyticsFixture() below —
      // changing this number changes the profitability calc too.
      total_inventory_value: 3_200_000_000,
      total_realised: 790_000_000,
      remaining_value: 3_200_000_000 - 1_030_000_000,
      total_value_sold: 1_030_000_000,
      balance_owed: 1_030_000_000 - 790_000_000,
      total_capacity_sqm: 165_000,
      total_capacity_units: 450,
      sqm_sold: 108_000,
      sqm_remaining: 57_000,
      efficiency_rate: 65,
      occupancy_rate: 72,
      total_plans: 300,
      active_plans: 295,
      active_customers: 280,
      total_customers: 300,
      defaulting: size300Defaulting,
      terminated: size300Terminated,
      size_plan_breakdown: [size300, size500],
    };
  }

  if (assetId === '665faaaa00000000000000a2') {
    const defaulting: MockLifecycleBucket = {
      customers: 1,
      plans: 1,
      value: 15_000_000,
      amount_paid: 5_000_000,
      amount_owing: 10_000_000,
    };

    const size400: MockSizeGroup = {
      size: 400,
      start_value: 400_000_000,
      capacity_sqm: 40_000,
      capacity_units: 100,
      units_sold: 60,
      sqm_sold: 24_000,
      sqm_remaining: 16_000,
      sold_value: 240_000_000,
      efficiency: 60,
      plans: [
        {
          month_subscription: 0,
          plan_count: 15,
          units_sold: 15,
          sqm_sold: 6_000,
          sold_value: 60_000_000,
          money_received: 60_000_000,
          balance_owed: 0,
          efficiency: 100,
          defaulting: zeroBucket(),
          terminated: zeroBucket(),
        },
        {
          month_subscription: 6,
          plan_count: 45,
          units_sold: 45,
          sqm_sold: 18_000,
          sold_value: 180_000_000,
          money_received: 120_000_000,
          balance_owed: 60_000_000,
          efficiency: 66.7,
          defaulting,
          terminated: zeroBucket(),
        },
      ],
    };

    analyticsByAsset[assetId] = {
      asset_id: assetId,
      asset_name: row.name,
      location: row.asset_location,
      // See the a1 comment above — kept equal to estate-profitability.ts's
      // expected_selling_value for this asset.
      total_inventory_value: 950_000_000,
      total_realised: 180_000_000,
      remaining_value: 950_000_000 - 240_000_000,
      total_value_sold: 240_000_000,
      balance_owed: 240_000_000 - 180_000_000,
      total_capacity_sqm: 40_000,
      total_capacity_units: 100,
      sqm_sold: 24_000,
      sqm_remaining: 16_000,
      efficiency_rate: 60,
      occupancy_rate: 55,
      total_plans: 60,
      active_plans: 58,
      active_customers: 55,
      total_customers: 60,
      defaulting,
      terminated: zeroBucket(),
      size_plan_breakdown: [size400],
    };
  }
}

/** For estate-profitability.ts's in-process read of revenue figures — not an HTTP route. */
export function getAnalyticsFixture(assetId: string): { total_inventory_value: number; total_realised: number } {
  seedIfNeeded(assetId);
  const data = analyticsByAsset[assetId];
  return { total_inventory_value: data?.total_inventory_value ?? 0, total_realised: data?.total_realised ?? 0 };
}

/** For inventory-reconciliation.ts's in-process read of the commercial (sold/defaulted) side, by size — not an HTTP route. */
export function getAnalyticsSizeBreakdown(assetId: string): MockSizeGroup[] {
  seedIfNeeded(assetId);
  return analyticsByAsset[assetId]?.size_plan_breakdown ?? [];
}

export const assetAnalyticsRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/analytics': ({ params, query }) => {
    seedIfNeeded(params.assetId);
    if (!findActiveAsset(params.assetId)) {
      throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
    }
    const data = analyticsByAsset[params.assetId];
    if (!data) {
      throw new MockHttpError(404, 'No analytics fixture for this asset', 'ASSET_NOT_FOUND');
    }

    const filter = query.filter === 'custom' ? 'custom' : 'all_time';
    return {
      ...data,
      filter,
      start_date: filter === 'custom' ? String(query.start_date ?? '') || null : null,
      end_date: filter === 'custom' ? String(query.end_date ?? '') || null : null,
      as_of: new Date().toISOString(),
    };
  },
};
