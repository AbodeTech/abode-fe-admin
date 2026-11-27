import type { MockRoutes } from '../router';
import { listLiveAssets, offerTree, type MockAsset } from './assets';
import { requireMockPermission } from './auth';

/* ============================================================
 * Portfolio analytics — GET /admin/assets/analytics/portfolio, the two banners
 * above the assets list.
 *
 * Built from the live asset fixtures (assets.ts), so the counts, the sizes and
 * the price range are the same estates the table lists. The money is the part
 * with no source of truth here: per-asset analytics (asset-analytics.ts) exists
 * for only two estates and is not split by product, so a category's sold value
 * is the asset's sold share (sold_units / sales_cap) applied to the product's
 * list value, and what was collected on it is that value times a stand-in
 * collection rate per category (below). The numbers are internally consistent
 * and move with the fixtures, but they are NOT reconciled to an estate's own
 * Performance tab, so do not read a figure across the two.
 *
 * `developer_plot` is a real category with its own row but is excluded from every
 * portfolio-wide roll-up (`excluded_from_rollup`), as on the BE: a handful of
 * hand-priced plots would skew every other product's market-priced numbers.
 *
 * Needs `view_asset_analytics`, the same key that gates an estate's Performance tab.
 * ============================================================ */

const CATEGORIES = ['flex', 'full-ownership', 'commercial', 'developer_plot'] as const;
type Category = (typeof CATEGORIES)[number];

/** `developer-plot` (the offer type) is the category `developer_plot`. */
const categoryOf = (offerType: string): Category => (offerType === 'developer-plot' ? 'developer_plot' : (offerType as Category));

/** Stand-ins: what share of a sold product's value has been collected. */
const COLLECTION_RATE: Record<Category, number> = {
  flex: 0.62,
  'full-ownership': 0.88,
  commercial: 0.74,
  developer_plot: 0.5,
};

/** Share of a category's customers who are behind, and of its sold value they hold. */
const DEFAULTING_CUSTOMER_SHARE = 0.06;
const DEFAULTING_VALUE_SHARE = 0.05;
const DEFAULTERS_PAID_SHARE = 0.4;

type ProductFigures = {
  assetId: string;
  active: boolean;
  capacitySqm: number;
  capacityUnits: number;
  listValue: number;
  soldShare: number;
  soldUnits: number;
};

/** One product (offer) of one asset: its capacity, its list value, and how much of it has sold. */
function productFigures(asset: MockAsset, offerIndex: number): ProductFigures {
  const offer = offerTree(asset)[offerIndex];
  const sizes = offer.sizes.filter((size) => size.is_active);
  const soldShare = asset.sales_cap > 0 ? Math.min(1, asset.sold_units / asset.sales_cap) : 0;
  return {
    assetId: asset._id,
    active: offer.is_active,
    capacitySqm: sizes.reduce((sum, s) => sum + s.size_sqm * s.configured_units, 0),
    capacityUnits: sizes.reduce((sum, s) => sum + s.configured_units, 0),
    // The first plan is the cash / shortest-tenor price, the list value a size is sold at.
    listValue: sizes.reduce((sum, s) => sum + (s.plans[0]?.land_price ?? 0) * s.configured_units, 0),
    soldShare,
    // An asset's sold units, split evenly across the products it offers.
    soldUnits: Math.round(asset.sold_units / Math.max(1, asset.offers.length)),
  };
}

const round = (n: number) => Math.round(n);
const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 1000) / 10 : 0);

function categoryMetrics(category: Category, assets: MockAsset[]) {
  const products = assets.flatMap((asset) =>
    asset.offers.flatMap((offer, index) => (categoryOf(offer.offer_type) === category ? [productFigures(asset, index)] : [])),
  );
  const live = products.filter((p) => p.active);

  const capacitySqm = live.reduce((sum, p) => sum + p.capacitySqm, 0);
  const capacityUnits = live.reduce((sum, p) => sum + p.capacityUnits, 0);
  const valueSold = round(live.reduce((sum, p) => sum + p.listValue * p.soldShare, 0));
  const moneyReceived = round(valueSold * COLLECTION_RATE[category]);
  const sqmSold = round(live.reduce((sum, p) => sum + p.capacitySqm * p.soldShare, 0));
  const activePlans = live.reduce((sum, p) => sum + p.soldUnits, 0);
  const activeCustomers = round(activePlans * 0.8);
  const defaultedValue = round(valueSold * DEFAULTING_VALUE_SHARE);
  const paidByDefaulters = round(defaultedValue * DEFAULTERS_PAID_SHARE);

  return {
    category,
    excluded_from_rollup: category === 'developer_plot',
    total_assets: new Set(products.map((p) => p.assetId)).size,
    active_assets: new Set(live.map((p) => p.assetId)).size,
    gross_revenue: moneyReceived,
    total_capacity_sqm: capacitySqm,
    total_capacity_units: capacityUnits,
    sqm_sold: sqmSold,
    value_sold: valueSold,
    money_received: moneyReceived,
    balance_owed: valueSold - moneyReceived,
    collection_efficiency: pct(moneyReceived, valueSold),
    occupancy_rate: pct(sqmSold, capacitySqm),
    active_customers: activeCustomers,
    active_plans: activePlans,
    defaulting: {
      customers: round(activeCustomers * DEFAULTING_CUSTOMER_SHARE),
      value_of_defaulted_assets: defaultedValue,
      amount_paid_by_defaulters: paidByDefaulters,
      amount_still_owing: defaultedValue - paidByDefaulters,
    },
  };
}

/** Worth of a product line across every asset: the list value of its live sizes. */
function worthOf(category: Category, assets: MockAsset[]) {
  const products = assets.flatMap((asset) =>
    asset.offers.flatMap((offer, index) => (categoryOf(offer.offer_type) === category ? [productFigures(asset, index)] : [])),
  );
  return { assets: new Set(products.filter((p) => p.active).map((p) => p.assetId)).size, worth: products.filter((p) => p.active).reduce((sum, p) => sum + p.listValue, 0) };
}

export const portfolioAnalyticsRoutes: MockRoutes = {
  'GET /admin/assets/analytics/portfolio': () => {
    requireMockPermission('view_asset_analytics', 'You need permission to view asset analytics');
    const assets = listLiveAssets();

    const categories = CATEGORIES.map((category) => categoryMetrics(category, assets));
    const rolled = categories.filter((c) => !c.excluded_from_rollup);
    const sum = (pick: (c: (typeof categories)[number]) => number) => rolled.reduce((total, c) => total + pick(c), 0);

    const rolledAssetIds = new Set(
      assets.filter((a) => a.offers.some((o) => categoryOf(o.offer_type) !== 'developer_plot')).map((a) => a._id),
    );
    const activeAssetIds = new Set(
      assets
        .filter((a) => a.offers.some((o) => o.is_active && categoryOf(o.offer_type) !== 'developer_plot'))
        .map((a) => a._id),
    );

    const defaultedValue = sum((c) => c.defaulting.value_of_defaulted_assets);
    const paidByDefaulters = sum((c) => c.defaulting.amount_paid_by_defaulters);
    const valueSold = sum((c) => c.value_sold);
    const moneyReceived = sum((c) => c.money_received);
    const capacitySqm = sum((c) => c.total_capacity_sqm);
    const sqmSold = sum((c) => c.sqm_sold);

    const flex = worthOf('flex', assets);
    const full = worthOf('full-ownership', assets);
    const commercial = worthOf('commercial', assets);
    const dev = worthOf('developer_plot', assets);

    return {
      portfolio: {
        total_portfolio_value: flex.worth + full.worth + commercial.worth,
        gross_revenue: moneyReceived,
        total_capacity_sqm: capacitySqm,
        total_capacity_units: sum((c) => c.total_capacity_units),
        total_assets: rolledAssetIds.size,
        total_active_assets: activeAssetIds.size,
        active_plans: sum((c) => c.active_plans),
        active_customers: sum((c) => c.active_customers),
        total_money_received: moneyReceived,
        total_value_sold: valueSold,
        total_sqm_sold: sqmSold,
        total_balance_owed: valueSold - moneyReceived,
        overall_efficiency: pct(moneyReceived, valueSold),
        occupancy_rate: pct(sqmSold, capacitySqm),
        defaulting: {
          customers: sum((c) => c.defaulting.customers),
          value_of_defaulted_assets: defaultedValue,
          amount_paid_by_defaulters: paidByDefaulters,
          amount_still_owing: defaultedValue - paidByDefaulters,
        },
      },
      categories,
      // The inventory banner counts every category, developer plots included.
      summary: {
        total_assets: assets.length,
        total_worth: flex.worth + full.worth + commercial.worth + dev.worth,
        total_flex_assets: flex.assets,
        total_flex_worth: flex.worth,
        total_full_ownership_assets: full.assets,
        total_full_ownership_worth: full.worth,
        total_commercial_assets: commercial.assets,
        total_commercial_worth: commercial.worth,
        total_developer_plot_assets: dev.assets,
        total_developer_plot_worth: dev.worth,
      },
      asset_details: assets.map((asset) => {
        const sizes = offerTree(asset).filter((o) => o.is_active).flatMap((o) => o.sizes.filter((s) => s.is_active));
        const prices = sizes.flatMap((s) => s.plans.filter((p) => p.is_active).map((p) => p.land_price));
        return {
          asset_id: asset._id,
          name: asset.name,
          location: asset.asset_location,
          available_sizes: [...new Set(sizes.map((s) => s.size_sqm))].sort((a, b) => a - b),
          total_units: sizes.reduce((sum, s) => sum + s.configured_units, 0),
          min_price: prices.length ? Math.min(...prices) : null,
          max_price: prices.length ? Math.max(...prices) : null,
        };
      }),
      as_of: new Date().toISOString(),
    };
  },
};
