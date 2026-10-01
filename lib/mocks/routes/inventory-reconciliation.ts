import { MockHttpError, type MockRoutes } from '../router';
import { assetPlots, findActiveAsset, isGroundConfirmed, type MockPlot } from './assets';
import { getAnalyticsSizeBreakdown } from './asset-analytics';

/* ============================================================
 * Physical (Block/Plot) vs. commercial (Analytics) reconciliation —
 * GET /admin/assets/:assetId/inventory-reconciliation.
 *
 * 🚧 Provisional — same greenfield status as the other Live Inventory mocks.
 * Reads assets.ts's plot store and asset-analytics.ts's size breakdown
 * in-process (not HTTP) and joins them by `size` — the one field both
 * domains already share (confirmed: block-plot.schema.ts's `Plot.size` and
 * asset-analytics.schema.ts's `AssetSizePlanGroup.size` are the same kind of
 * value, and this file's own fixtures happen to already align on Aviation
 * City: Block A's 500sqm plots / Block B's 300sqm plots against the
 * analytics module's size-500 and size-300 groups).
 *
 * This is a deliberately PARTIAL reconciliation — by size only, not by
 * product (no product dimension exists on either side of this join; see
 * land-configuration.schema.ts's own "four non-reconciling sqm concepts"
 * doc comment). The exceptions below are computed once, here, so the FE
 * never re-derives a discrepancy that should be authoritative.
 * ============================================================ */

type MockSizeGroup = ReturnType<typeof getAnalyticsSizeBreakdown>[number];

function physicalStatusForSize(plots: MockPlot[], size: number) {
  const atSize = plots.filter((p) => p.size === size);
  if (atSize.length === 0) return null;

  const allocated = atSize.filter((p) => p.status === 'allocated');
  return {
    allocated_count: allocated.length,
    available_count: atSize.length - allocated.length,
    ground_confirmed_count: allocated.filter((p) => isGroundConfirmed(p._id)).length,
    total_sqm: atSize.reduce((sum, p) => sum + p.size, 0),
    allocated_holders: allocated.map((p) => ({
      plot_id: p._id,
      plot_name: `${p.block_label}-${p.plot_number}`,
      customer_name: p.customer_name ?? null,
      attributable_value: p.attributable_value ?? null,
    })),
  };
}

function commercialStatusForGroup(group: MockSizeGroup) {
  const defaultedCount = group.plans.reduce((sum, plan) => sum + plan.defaulting.customers, 0);
  const defaultedValue = group.plans.reduce((sum, plan) => sum + plan.defaulting.value, 0);
  return {
    units_sold: group.units_sold,
    sqm_sold: group.sqm_sold,
    sold_value: group.sold_value,
    defaulted_count: defaultedCount,
    defaulted_value: defaultedValue,
  };
}

export const inventoryReconciliationRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/inventory-reconciliation': ({ params }) => {
    if (!findActiveAsset(params.assetId)) {
      throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
    }

    const plots = assetPlots(params.assetId);
    const sizeGroups = getAnalyticsSizeBreakdown(params.assetId);

    const sizes = Array.from(new Set([...plots.map((p) => p.size), ...sizeGroups.map((g) => g.size)])).sort(
      (a, b) => a - b
    );

    const rows = sizes.map((size) => {
      const physical = physicalStatusForSize(plots, size);
      const group = sizeGroups.find((g) => g.size === size) ?? null;
      const commercial = group ? commercialStatusForGroup(group) : null;

      const exceptions: { code: 'NO_SALES_DATA' | 'NO_PHYSICAL_PLOTS' | 'OVERSOLD'; message: string }[] = [];
      if (physical && !commercial) {
        exceptions.push({
          code: 'NO_SALES_DATA',
          message: `${size} sqm has ${physical.allocated_count + physical.available_count} physical plot(s) but no matching sales data`,
        });
      } else if (!physical && commercial) {
        exceptions.push({
          code: 'NO_PHYSICAL_PLOTS',
          message: `${size} sqm shows ${commercial.units_sold} unit(s) sold but no physical plots are recorded`,
        });
      } else if (physical && commercial && commercial.units_sold > physical.allocated_count) {
        exceptions.push({
          code: 'OVERSOLD',
          message: `${size} sqm: ${commercial.units_sold - physical.allocated_count} more unit(s) sold than physically allocated`,
        });
      }

      return { size, physical, commercial, exceptions };
    });

    const warnings: string[] = [];
    if (plots.length === 0) {
      warnings.push('This estate has no blocks recorded at all.');
    }

    // "Reconcile the whole estate" — sum what's already reconciled per size.
    const estateTotals = {
      physical_plot_count: rows.reduce((sum, row) => sum + (row.physical ? row.physical.allocated_count + row.physical.available_count : 0), 0),
      physical_sqm: rows.reduce((sum, row) => sum + (row.physical?.total_sqm ?? 0), 0),
      ground_confirmed_count: rows.reduce((sum, row) => sum + (row.physical?.ground_confirmed_count ?? 0), 0),
      commercial_units_sold: rows.reduce((sum, row) => sum + (row.commercial?.units_sold ?? 0), 0),
      commercial_sqm_sold: rows.reduce((sum, row) => sum + (row.commercial?.sqm_sold ?? 0), 0),
      commercial_sold_value: rows.reduce((sum, row) => sum + (row.commercial?.sold_value ?? 0), 0),
      exception_count: rows.reduce((sum, row) => sum + row.exceptions.length, 0),
    };

    return {
      asset_id: params.assetId,
      as_of: new Date().toISOString(),
      estate_totals: estateTotals,
      rows,
      warnings,
    };
  },
};
