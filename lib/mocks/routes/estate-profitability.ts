import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, offerTree, type MockAsset, type MockOfferType, type MockPlan } from './assets';
import { getAnalyticsFixture } from './asset-analytics';
import {
  countsAsCost,
  getCostEvents,
  getCostItems,
  getCostObligations,
  getCurrentAllocationRule,
  signFor,
  DIRECT_GROUPS,
  type MockCostEvent,
  type MockCostItem,
} from './asset-costs';
import { getLandSnapshot } from './land-configuration';

/* ============================================================
 * Estate profitability — GET /admin/assets/:assetId/profitability(/matrix|
 * /drill-down), confirmed field-for-field against
 * `profitability.service.ts`/`profitability.calculator.ts` on staging (PR
 * #82). Replaces the old client-side "accounting basis" toggle entirely —
 * the real model recognises exactly one number: an APPROVED
 * incurred/reversal/adjustment event.
 *
 * `revenue`/`received` still come from asset-analytics.ts's mock fixture
 * (`total_inventory_value`/`total_realised`) — the real backend's own
 * revenue side draws on payment-plan data this mock layer doesn't model in
 * that much depth either; this keeps the Performance tab and this
 * calculation reading the same numbers rather than two invented fixtures.
 * ============================================================ */

const round2 = (n: number) => Math.round(n * 100) / 100;

type ScopeResult = {
  revenue: number;
  received: number;
  direct_cost: number;
  gross_profit: number;
  allocated_opex: number;
  net_profit: number;
  margin_pct: number | null;
  units: number;
  sqm: number;
  cost_per_total_sqm: number | null;
  cost_per_saleable_sqm: number | null;
  complete: boolean;
  warnings: string[];
};

function recognisedAmount(events: MockCostEvent[]): number {
  let total = 0;
  for (const event of events) {
    if (event.status === 'approved' && event.amount != null && countsAsCost(event.financial_stage)) {
      total += event.amount * signFor(event.financial_stage);
    }
  }
  return total;
}

/** Every item's recognised cost, split by whether its group counts before or after gross profit. */
function costTotals(assetId: string): { directCost: number; allocatedOpex: number; byItem: Map<string, number> } {
  const items = getCostItems(assetId);
  const obligations = getCostObligations(assetId);
  let directCost = 0;
  let allocatedOpex = 0;
  const byItem = new Map<string, number>();

  for (const item of items) {
    const itemObligations = obligations.filter((o) => o.cost_item_id === item._id);
    const events = itemObligations.flatMap((o) => getCostEvents(o._id));
    const recognised = round2(recognisedAmount(events));
    byItem.set(item._id, recognised);
    if (DIRECT_GROUPS.includes(item.group)) directCost += recognised;
    else allocatedOpex += recognised;
  }

  return { directCost: round2(directCost), allocatedOpex: round2(allocatedOpex), byItem };
}

function computeSummary(row: MockAsset): ScopeResult {
  const { directCost, allocatedOpex } = costTotals(row._id);
  const land = getLandSnapshot(row._id);
  const analytics = getAnalyticsFixture(row._id);

  const revenue = analytics.total_inventory_value ?? 0;
  const received = analytics.total_realised ?? 0;
  const grossProfit = round2(revenue - directCost);
  const netProfit = round2(grossProfit - allocatedOpex);
  const marginPct = revenue > 0 ? round2((netProfit / revenue) * 100) : null;

  const totalLandSqm = land.total_land_sqm;
  const saleableSqm = land.saleable_assigned_sqm || null;
  const costPerTotalSqm = totalLandSqm ? round2((directCost + allocatedOpex) / totalLandSqm) : null;
  const costPerSaleableSqm = saleableSqm ? round2((directCost + allocatedOpex) / saleableSqm) : null;

  const warnings: string[] = [];
  if (!totalLandSqm) warnings.push('Total land sqm is not set on the Land Account — cost per total sqm cannot be computed.');

  return {
    revenue,
    received,
    direct_cost: directCost,
    gross_profit: grossProfit,
    allocated_opex: allocatedOpex,
    net_profit: netProfit,
    margin_pct: marginPct,
    units: 0,
    sqm: totalLandSqm ?? 0,
    cost_per_total_sqm: costPerTotalSqm,
    cost_per_saleable_sqm: costPerSaleableSqm,
    complete: warnings.length === 0,
    warnings,
  };
}

/** How much of an item's recognised cost lands on one product, per its allocation basis / current rule. */
function shareForProduct(
  assetId: string,
  item: MockCostItem,
  recognised: number,
  offerType: MockOfferType,
  activeOfferTypes: MockOfferType[],
  assignedSqmByOffer: Map<string, number>
): number {
  if (item.excluded_products.includes(offerType)) return 0;
  if (item.applies_to_products.length > 0 && !item.applies_to_products.includes(offerType)) return 0;

  const basis = item.allocation_basis;
  if (!basis) return 0;

  if (basis === 'direct') {
    // A direct item books its full recognised cost to the ONE product its obligations name.
    return 0; // handled separately in computeByProduct via obligation.product
  }
  if (basis === 'manual' || basis === 'amount') {
    const rule = getCurrentAllocationRule(assetId, item._id);
    const share = rule?.shares.find((s) => s.offer_type === offerType);
    if (!share) return 0;
    if (share.amount != null) return share.amount;
    if (share.percent != null) return round2((recognised * share.percent) / 100);
    return 0;
  }
  if (basis === 'equal') {
    return activeOfferTypes.length > 0 ? round2(recognised / activeOfferTypes.length) : 0;
  }
  // total_sqm / saleable_sqm / product_sqm / sqm_sold / revenue / units — all fall back to a
  // proportional-by-assigned-sqm split for this mock (a reasonable stand-in for the several
  // real sqm/unit/revenue bases without re-deriving each one from live plan data).
  const totalAssigned = [...assignedSqmByOffer.values()].reduce((a, b) => a + b, 0);
  const ownAssigned = assignedSqmByOffer.get(offerType) ?? 0;
  if (totalAssigned <= 0 || ownAssigned <= 0) return 0;
  return round2(recognised * (ownAssigned / totalAssigned));
}

/**
 * How much of one cost item's recognised amount is charged to one product.
 * The single source for both `by_product` and the drill-down's `shares`, so
 * the two can never disagree (the real backend derives both from one
 * allocation pass, too).
 */
function productShareOfItem(
  assetId: string,
  item: MockCostItem,
  recognised: number,
  offerType: MockOfferType,
  obligations: ReturnType<typeof getCostObligations>,
  activeOfferTypes: MockOfferType[],
  assignedSqmByOffer: Map<string, number>
): number {
  if (item.allocation_basis === 'direct') {
    return obligations.some((o) => o.cost_item_id === item._id && o.product === offerType) ? recognised : 0;
  }
  if (item.is_shared) {
    return shareForProduct(assetId, item, recognised, offerType, activeOfferTypes, assignedSqmByOffer);
  }
  if (obligations.some((o) => o.cost_item_id === item._id && o.product === offerType)) return recognised;
  if (obligations.some((o) => o.cost_item_id === item._id && o.product === null)) {
    // Estate-wide, non-shared item with no product tag at all — split evenly as a fallback.
    return activeOfferTypes.length > 0 ? round2(recognised / activeOfferTypes.length) : 0;
  }
  return 0;
}

function computeByProduct(row: MockAsset): { offer_type: MockOfferType; scope: ScopeResult }[] {
  const items = getCostItems(row._id);
  const obligations = getCostObligations(row._id);
  const { byItem } = costTotals(row._id);
  const offers = offerTree(row);
  const activeOffers = offers.filter((o) => o.is_active);
  const activeOfferTypes = activeOffers.map((o) => o.offer_type as MockOfferType);
  const assignedSqmByOffer = new Map(activeOffers.map((o) => [o.offer_type, o.assigned_sqm]));

  const unitPrice = (plans: MockPlan[]) => {
    if (plans.length === 0) return 0;
    const base = [...plans].sort((a, b) => a.tenor_months - b.tenor_months)[0];
    return base.land_price + base.development_levy + base.document_levy;
  };

  return offers.map((offer) => {
    const offerType = offer.offer_type as MockOfferType;
    const activeSizes = offer.sizes.filter((s) => s.is_active);
    const revenue = round2(activeSizes.reduce((sum, s) => sum + unitPrice(s.plans) * s.configured_units, 0));
    const units = activeSizes.reduce((sum, s) => sum + s.configured_units, 0);
    const sqm = activeSizes.reduce((sum, s) => sum + s.size_sqm * s.configured_units, 0);

    let directCost = 0;
    let allocatedOpex = 0;
    for (const item of items) {
      const recognised = byItem.get(item._id) ?? 0;
      if (recognised === 0) continue;

      const share = productShareOfItem(row._id, item, recognised, offerType, obligations, activeOfferTypes, assignedSqmByOffer);

      if (DIRECT_GROUPS.includes(item.group)) directCost += share;
      else allocatedOpex += share;
    }

    const grossProfit = round2(revenue - directCost);
    const netProfit = round2(grossProfit - allocatedOpex);
    const marginPct = revenue > 0 ? round2((netProfit / revenue) * 100) : null;

    return {
      offer_type: offerType,
      scope: {
        revenue,
        received: 0,
        direct_cost: round2(directCost),
        gross_profit: grossProfit,
        allocated_opex: round2(allocatedOpex),
        net_profit: netProfit,
        margin_pct: marginPct,
        units,
        sqm,
        cost_per_total_sqm: null,
        cost_per_saleable_sqm: null,
        complete: true,
        warnings: [],
      },
    };
  });
}

function computeBySize(row: MockAsset, byProduct: { offer_type: MockOfferType; scope: ScopeResult }[]) {
  const offers = offerTree(row);
  const unitPrice = (plans: MockPlan[]) => {
    if (plans.length === 0) return 0;
    const base = [...plans].sort((a, b) => a.tenor_months - b.tenor_months)[0];
    return base.land_price + base.development_levy + base.document_levy;
  };

  return offers.flatMap((offer) => {
    const offerType = offer.offer_type as MockOfferType;
    const productScope = byProduct.find((p) => p.offer_type === offerType)?.scope;
    const activeSizes = offer.sizes.filter((s) => s.is_active);
    const sqmWeight = (s: (typeof activeSizes)[number]) => s.size_sqm * s.configured_units;
    const totalWeight = activeSizes.reduce((sum, s) => sum + sqmWeight(s), 0);

    return activeSizes.map((size) => {
      const revenue = round2(unitPrice(size.plans) * size.configured_units);
      const weightShare = totalWeight > 0 ? sqmWeight(size) / totalWeight : 0;
      const directCost = round2((productScope?.direct_cost ?? 0) * weightShare);
      const allocatedOpex = round2((productScope?.allocated_opex ?? 0) * weightShare);
      const grossProfit = round2(revenue - directCost);
      const netProfit = round2(grossProfit - allocatedOpex);
      const marginPct = revenue > 0 ? round2((netProfit / revenue) * 100) : null;

      return {
        offer_type: offerType,
        size_id: size._id,
        size_sqm: size.size_sqm,
        revenue,
        received: 0,
        direct_cost: directCost,
        gross_profit: grossProfit,
        allocated_opex: allocatedOpex,
        net_profit: netProfit,
        margin_pct: marginPct,
        units: size.configured_units,
        sqm: sqmWeight(size),
        cost_per_total_sqm: null,
        cost_per_saleable_sqm: null,
        complete: true,
        warnings: [],
      };
    });
  });
}

function computeCommission(assetId: string) {
  const obligations = getCostObligations(assetId).filter((o) => o.source_type === 'commission_transaction');
  const byProduct = new Map<string, number>();
  let settledTotal = 0;
  for (const obligation of obligations) {
    const events = getCostEvents(obligation._id);
    const settled = round2(recognisedAmount(events));
    settledTotal += settled;
    if (obligation.product) byProduct.set(obligation.product, (byProduct.get(obligation.product) ?? 0) + settled);
  }
  return {
    settled_by_product: [...byProduct.entries()].map(([offer_type, amount]) => ({ offer_type, amount: round2(amount) })),
    settled_total: round2(settledTotal),
    awaiting_settlement: 0,
  };
}

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'COST_ASSET_NOT_FOUND');
  return row;
}

export const estateProfitabilityRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/profitability': ({ params }) => {
    const row = requireAsset(params.assetId);
    const summary = computeSummary(row);
    const byProduct = computeByProduct(row);
    const land = getLandSnapshot(row._id);

    return {
      asset: { id: row._id, name: row.name },
      total_land_sqm: land.total_land_sqm,
      saleable_sqm: land.saleable_assigned_sqm || null,
      summary,
      by_product: byProduct.map(({ offer_type, scope }) => ({ offer_type, ...scope })),
      by_size: computeBySize(row, byProduct),
      as_of: new Date().toISOString(),
      commission: computeCommission(row._id),
      complete: summary.complete,
      warnings: summary.warnings,
    };
  },

  'GET /admin/assets/:assetId/profitability/matrix': ({ params }) => {
    const row = requireAsset(params.assetId);
    const byProduct = computeByProduct(row);
    const offers = offerTree(row);

    const rows = offers.flatMap((offer) => {
      const offerType = offer.offer_type as MockOfferType;
      const scope = byProduct.find((p) => p.offer_type === offerType)?.scope;
      const activeSizes = offer.sizes.filter((s) => s.is_active);
      return activeSizes.flatMap((size) =>
        size.plans.map((plan) => {
          const soldValue = plan.land_price + plan.development_levy + plan.document_levy;
          return {
            offer_type: offerType,
            size_id: size._id,
            tenor_months: plan.tenor_months,
            sold_value: soldValue,
            received: 0,
            balance: soldValue,
            collection_efficiency_pct: soldValue > 0 ? 0 : null,
            units: size.configured_units,
            forecast_gross_profit: scope ? round2(soldValue - scope.direct_cost) : soldValue,
            allocated_opex: scope?.allocated_opex ?? 0,
            forecast_net_contribution: scope ? round2(soldValue - scope.direct_cost - scope.allocated_opex) : soldValue,
            margin_pct: null,
            complete: true,
          };
        })
      );
    });

    return {
      asset: { id: row._id, name: row.name },
      rows,
      as_of: new Date().toISOString(),
      calculation_version: `costs:${getCostItems(row._id).length}`,
      complete: true,
      warnings: [],
    };
  },

  'GET /admin/assets/:assetId/profitability/drill-down': ({ params }) => {
    const row = requireAsset(params.assetId);
    const summary = computeSummary(row);
    const items = getCostItems(row._id);
    const { byItem } = costTotals(row._id);
    const offers = offerTree(row);

    const unitPrice = (plans: MockPlan[]) => {
      if (plans.length === 0) return 0;
      const base = [...plans].sort((a, b) => a.tenor_months - b.tenor_months)[0];
      return base.land_price + base.development_levy + base.document_levy;
    };

    const revenueRows = offers.flatMap((offer) =>
      offer.sizes
        .filter((s) => s.is_active)
        .flatMap((size) =>
          size.plans.map((plan) => ({
            offer_type: offer.offer_type,
            size_id: size._id,
            tenor_months: plan.tenor_months,
            sold_value: unitPrice([plan]),
            received: 0,
            units: size.configured_units,
            sqm: size.size_sqm * size.configured_units,
          }))
        )
    );

    const obligations = getCostObligations(row._id);
    const activeOffers = offers.filter((o) => o.is_active);
    const activeOfferTypes = activeOffers.map((o) => o.offer_type as MockOfferType);
    const assignedSqmByOffer = new Map(activeOffers.map((o) => [o.offer_type, o.assigned_sqm]));

    const costRows = items.map((item: MockCostItem) => {
      const amount = byItem.get(item._id) ?? null;
      const rule = getCurrentAllocationRule(row._id, item._id);
      // Same per-product amounts `by_product` is built from, as the real
      // drill-down's `shares` are — one entry per product actually charged.
      const shares = amount
        ? offers
            .map((offer) => {
              const offerType = offer.offer_type as MockOfferType;
              const charged = productShareOfItem(row._id, item, amount, offerType, obligations, activeOfferTypes, assignedSqmByOffer);
              return { offer_type: offerType, amount: round2(charged), share_pct: round2((charged / amount) * 100) };
            })
            .filter((share) => share.amount !== 0)
        : [];
      return {
        cost_item_id: item._id,
        name: item.name,
        group: item.group,
        group_label: item.group,
        amount,
        basis: item.allocation_basis,
        included_products: item.applies_to_products,
        excluded_products: item.excluded_products,
        shares,
        // The real `drillDown()`: counted means it was charged to at least one product.
        counted: shares.length > 0,
        warning: item.is_shared && !rule ? 'This shared item has no allocation rule yet — excluded from every product.' : null,
      };
    });

    return {
      asset: { id: row._id, name: row.name },
      revenue_rows: revenueRows,
      cost_rows: costRows,
      formula: {
        gross_profit: 'revenue − direct cost',
        net_profit: 'gross profit − allocated OPEX',
        margin_pct: 'net profit ÷ revenue × 100',
        cost_per_total_sqm: '(direct cost + allocated OPEX) ÷ total estate sqm',
        cost_per_saleable_sqm: '(direct cost + allocated OPEX) ÷ saleable sqm',
      },
      subtotals: summary,
      as_of: new Date().toISOString(),
      complete: summary.complete,
      warnings: summary.warnings,
    };
  },
};
