import type { MockRoutes } from '../router';
import { MOCK_ASSET_IDS, MOCK_ASSET_NAMES, MOCK_USERS, formatMockDate } from '../shared';
import { paged } from './util';

/* ============================================================
 * Sales — /admin/sales/*.
 *
 * Mirrors abode-be-v2's sales module as it exists on `origin/staging`
 * (2026-08-29) — not yet deployed to the environment this app talks to, so
 * confirm against a live call once it ships. See
 * features/sales/schemas/sales.schema.ts for the field-level notes.
 *
 * The two streaming CSV exports (GET /admin/sales/export[/full]) are
 * deliberately NOT mocked here — the admin FE builds its export client-side
 * from this list endpoint instead (see features/sales/components/SalesExport.tsx),
 * so those two BE routes have no caller from this app.
 * ============================================================ */

const ASSET_TYPES = ['flex', 'full-ownership', 'commercial', 'developer_plot'] as const;
const SOURCE_TYPES = ['original_purchase', 'original_purchase', 'original_purchase', 'marketplace_resale', 'close_and_relocate'] as const;
const PLAN_STATUSES = ['active', 'active', 'active', 'suspended', 'defaulted', 'completed', 'closed'] as const;
const ADMIN_SUBTYPES = ['gift', 'migration', 'compensation', 'relocation_target', 'developer_plot', 'commercial_new', 'other'] as const;
const LOCATIONS = ['Ibeju-Lekki, Lagos', 'Epe, Lagos', 'Ikeja, Lagos', 'Abeokuta, Ogun', 'Asaba, Delta'];

type PlanStatus = (typeof PLAN_STATUSES)[number];

type MockSalesRow = {
  id: string;
  buyer: { id: string; name: string; email: string };
  referrer: { id: string; name: string; email: string } | null;
  agency: { id: string; name: string } | null;
  asset: { id: string; name: string; type: (typeof ASSET_TYPES)[number]; location: string };
  size: number;
  no_of_units: number;
  price: number;
  amount_paid: number;
  balance: number;
  default_amount: number;
  doc_price: number;
  doc_amount_paid: number;
  month_subscription: number;
  month_remaining: number;
  payment_completion_percentage: number;
  start_date: string;
  next_date_of_payment: string | null;
  allocation_status: 'pending' | 'allocated' | 'released';
  plan_status: PlanStatus;
  is_defaulted: boolean;
  has_defaulted_ever: boolean;
  is_suspended: boolean;
  source_type: (typeof SOURCE_TYPES)[number];
  created_by_admin: boolean;
  admin_creation_subtype: (typeof ADMIN_SUBTYPES)[number] | null;
  originated_from_close_relocate: boolean;
  created_at: string;
};

/** Same revenue-eligibility rule as `src/common/revenue-eligibility.ts` on the BE (S-1b/S-1e). */
const NON_REVENUE_ADMIN_SUBTYPES = new Set(['gift', 'migration', 'compensation', 'relocation_target']);
function isRevenueEligible(row: MockSalesRow): boolean {
  if (row.asset.type === 'developer_plot') return false;
  if (!row.created_by_admin) return true;
  if (!row.admin_creation_subtype) return true;
  return !NON_REVENUE_ADMIN_SUBTYPES.has(row.admin_creation_subtype);
}

const OUTSTANDING_EXCLUDED: PlanStatus[] = ['suspended', 'completed', 'closed'];

const rows: MockSalesRow[] = MOCK_USERS.map((user, i) => {
  const assetIndex = i % MOCK_ASSET_NAMES.length;
  const assetType = ASSET_TYPES[i % ASSET_TYPES.length];
  const sourceType = SOURCE_TYPES[i % SOURCE_TYPES.length];
  const planStatus = PLAN_STATUSES[i % PLAN_STATUSES.length];
  const size = [300, 450, 500, 600][i % 4];
  const noOfUnits = 1 + (i % 3);
  const price = size * noOfUnits * 45_000;
  const isCompleted = planStatus === 'completed' || planStatus === 'closed';
  const amountPaid = isCompleted ? price : Math.round(price * (0.2 + (i % 5) * 0.15));
  const balance = isCompleted ? 0 : price - amountPaid;
  const isDefaulted = planStatus === 'defaulted';
  const isSuspended = planStatus === 'suspended';
  const createdByAdmin = i % 6 === 0;
  const adminSubtype = createdByAdmin ? ADMIN_SUBTYPES[i % ADMIN_SUBTYPES.length] : null;
  const hasReferrer = i % 3 !== 0;
  const hasAgency = i % 5 === 0;

  return {
    id: `sales-${user._id}`,
    buyer: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email },
    referrer: hasReferrer
      ? {
          id: `referrer-${i}`,
          name: `${MOCK_USERS[(i + 3) % MOCK_USERS.length].firstName} ${MOCK_USERS[(i + 3) % MOCK_USERS.length].lastName}`,
          email: MOCK_USERS[(i + 3) % MOCK_USERS.length].email,
        }
      : null,
    agency: hasAgency ? { id: `agency-${i % 4}`, name: `Agency Partners ${(i % 4) + 1}` } : null,
    asset: {
      id: MOCK_ASSET_IDS[assetIndex],
      name: MOCK_ASSET_NAMES[assetIndex],
      type: assetType,
      location: LOCATIONS[i % LOCATIONS.length],
    },
    size,
    no_of_units: noOfUnits,
    price,
    amount_paid: amountPaid,
    balance,
    default_amount: isDefaulted ? Math.round(balance * 0.3) : 0,
    doc_price: 150_000,
    doc_amount_paid: i % 2 === 0 ? 150_000 : 75_000,
    month_subscription: 12 + (i % 4) * 6,
    month_remaining: isCompleted ? 0 : 3 + (i % 6),
    payment_completion_percentage: price > 0 ? Math.round((amountPaid / price) * 10000) / 100 : 0,
    start_date: formatMockDate(180 + i * 5),
    next_date_of_payment: isCompleted ? null : formatMockDate(-(7 + (i % 20))),
    allocation_status: i % 4 === 0 ? 'pending' : i % 4 === 1 ? 'allocated' : 'released',
    plan_status: planStatus,
    is_defaulted: isDefaulted,
    has_defaulted_ever: isDefaulted || i % 7 === 0,
    is_suspended: isSuspended,
    source_type: sourceType,
    created_by_admin: createdByAdmin,
    admin_creation_subtype: adminSubtype,
    originated_from_close_relocate: sourceType === 'close_and_relocate',
    created_at: formatMockDate(180 + i * 5),
  };
});

function applyListFilters(query: Record<string, unknown>): MockSalesRow[] {
  let filtered = rows as MockSalesRow[];

  const q = query.q ? String(query.q).trim().toLowerCase() : null;
  if (q) {
    filtered = filtered.filter(
      (r) =>
        r.buyer.name.toLowerCase().includes(q) ||
        r.buyer.email.toLowerCase().includes(q) ||
        r.asset.name.toLowerCase().includes(q) ||
        (r.referrer?.name.toLowerCase().includes(q) ?? false)
    );
  }

  const createdFrom = query.created_start_date ? new Date(String(query.created_start_date)) : null;
  const createdTo = query.created_end_date ? new Date(String(query.created_end_date)) : null;
  if (createdFrom || createdTo) {
    filtered = filtered.filter((r) => {
      const created = new Date(r.created_at);
      if (createdFrom && created < createdFrom) return false;
      if (createdTo && created > createdTo) return false;
      return true;
    });
  }

  if (query.asset_type) filtered = filtered.filter((r) => r.asset.type === query.asset_type);
  if (query.source_type) filtered = filtered.filter((r) => r.source_type === query.source_type);
  if (query.plan_status) filtered = filtered.filter((r) => r.plan_status === query.plan_status);
  if (query.allocation_status) filtered = filtered.filter((r) => r.allocation_status === query.allocation_status);
  if (query.asset_id) filtered = filtered.filter((r) => r.asset.id === query.asset_id);
  if (query.buyer_user_id) filtered = filtered.filter((r) => r.buyer.id === query.buyer_user_id);
  if (query.referrer_user_id) filtered = filtered.filter((r) => r.referrer?.id === query.referrer_user_id);
  if (query.agency_id) filtered = filtered.filter((r) => r.agency?.id === query.agency_id);
  if (query.is_defaulted !== undefined) filtered = filtered.filter((r) => r.is_defaulted === (String(query.is_defaulted) === 'true'));
  if (query.is_suspended !== undefined) filtered = filtered.filter((r) => r.is_suspended === (String(query.is_suspended) === 'true'));
  if (query.has_defaulted_ever !== undefined) filtered = filtered.filter((r) => r.has_defaulted_ever === (String(query.has_defaulted_ever) === 'true'));
  if (query.created_by_admin !== undefined) filtered = filtered.filter((r) => r.created_by_admin === (String(query.created_by_admin) === 'true'));
  if (query.originated_from_close_relocate !== undefined) filtered = filtered.filter((r) => r.originated_from_close_relocate === (String(query.originated_from_close_relocate) === 'true'));

  return filtered;
}

function analyticsScope(query: Record<string, unknown>): MockSalesRow[] {
  let scoped = (rows as MockSalesRow[]).filter(isRevenueEligible);

  const from = query.start_date ? new Date(String(query.start_date)) : null;
  const to = query.end_date ? new Date(String(query.end_date)) : null;
  if (from || to) {
    scoped = scoped.filter((r) => {
      const created = new Date(r.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
  }

  if (query.asset_type) scoped = scoped.filter((r) => r.asset.type === query.asset_type);
  if (query.asset_location) scoped = scoped.filter((r) => r.asset.location === query.asset_location);
  if (query.source_type) scoped = scoped.filter((r) => r.source_type === query.source_type);

  return scoped;
}

function dashboardCard(scoped: MockSalesRow[]) {
  const total = scoped.reduce((sum, r) => sum + r.price, 0);
  const received = scoped.reduce((sum, r) => sum + r.amount_paid, 0);
  const outstanding = scoped
    .filter((r) => !OUTSTANDING_EXCLUDED.includes(r.plan_status))
    .reduce((sum, r) => sum + r.balance, 0);
  return {
    total,
    received,
    outstanding,
    received_percentage: total > 0 ? Math.round((received / total) * 10000) / 100 : 0,
  };
}

export const salesRoutes: MockRoutes = {
  'GET /admin/sales': ({ query }) => paged(applyListFilters(query), query, 25),

  'GET /admin/sales/dashboard': ({ query }) => {
    const from = query.start_date ? new Date(String(query.start_date)) : null;
    const to = query.end_date ? new Date(String(query.end_date)) : null;
    const eligible = (rows as MockSalesRow[]).filter(isRevenueEligible).filter((r) => {
      const created = new Date(r.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });

    return {
      overall: dashboardCard(eligible),
      flex: dashboardCard(eligible.filter((r) => r.asset.type === 'flex')),
      full_ownership: dashboardCard(eligible.filter((r) => r.asset.type === 'full-ownership')),
      commercial: dashboardCard(eligible.filter((r) => r.asset.type === 'commercial')),
      as_of: new Date().toISOString(),
    };
  },

  'GET /admin/sales/analytics/kpis': ({ query }) => {
    const scoped = analyticsScope(query);
    const expectedAmount = scoped.reduce((sum, r) => sum + r.price, 0);
    const totalReceived = scoped.reduce((sum, r) => sum + r.amount_paid, 0);
    const buyers = new Set(scoped.map((r) => r.buyer.id));
    const salespersons = new Set(scoped.filter((r) => r.referrer).map((r) => r.referrer!.id));
    const completed = scoped.filter((r) => r.plan_status === 'completed').length;
    const defaulted = scoped.filter((r) => r.default_amount > 0).length;
    const terminated = scoped.filter((r) => r.is_suspended).length;
    const active = scoped.filter((r) => r.balance > 0 && !r.is_suspended).length;

    return {
      total_sales_value: expectedAmount,
      expected_amount: expectedAmount,
      total_received: totalReceived,
      outstanding_balance: expectedAmount - totalReceived,
      sqm_sold: scoped.reduce((sum, r) => sum + r.size * r.no_of_units, 0),
      unique_buyers: buyers.size,
      unique_salespersons: salespersons.size,
      completed_payments: completed,
      payment_health: { completed, defaulted, terminated },
      active_transactions: active,
    };
  },

  'GET /admin/sales/analytics/by-asset': ({ query }) => {
    const scoped = analyticsScope(query);
    const byAsset = new Map<string, MockSalesRow[]>();
    scoped.forEach((r) => {
      const list = byAsset.get(r.asset.id) ?? [];
      list.push(r);
      byAsset.set(r.asset.id, list);
    });

    const result = Array.from(byAsset.entries()).map(([assetId, group]) => {
      const expectedAmount = group.reduce((sum, r) => sum + r.price, 0);
      const totalReceived = group.reduce((sum, r) => sum + r.amount_paid, 0);
      const completed = group.filter((r) => r.plan_status === 'completed').length;
      const defaulted = group.filter((r) => r.default_amount > 0).length;
      const terminated = group.filter((r) => r.is_suspended).length;
      return {
        asset_id: assetId,
        asset_name: group[0].asset.name,
        asset_type: group[0].asset.type,
        asset_location: group[0].asset.location,
        expected_amount: expectedAmount,
        total_received: totalReceived,
        outstanding_balance: expectedAmount - totalReceived,
        sqm_sold: group.reduce((sum, r) => sum + r.size * r.no_of_units, 0),
        total_buyers: new Set(group.map((r) => r.buyer.id)).size,
        payment_health: { completed, defaulted, terminated },
      };
    });

    return result.sort((a, b) => b.expected_amount - a.expected_amount).slice(0, 500);
  },

  'GET /admin/sales/analytics/timeline': ({ query }) => {
    const scoped = analyticsScope(query);
    const end = query.end_date ? new Date(String(query.end_date)) : new Date();
    const start = query.start_date
      ? new Date(String(query.start_date))
      : new Date(new Date(end).setMonth(end.getMonth() - 11));

    const buckets: Record<string, MockSalesRow[]> = {};
    scoped.forEach((r) => {
      const created = new Date(r.created_at);
      if (created < start || created > end) return;
      const key = `${created.getUTCFullYear()}-${created.getUTCMonth()}`;
      (buckets[key] ??= []).push(r);
    });

    const out: Array<Record<string, unknown>> = [];
    let cumulativeExpected = 0;
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

    while (cursor <= last) {
      const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`;
      const group = buckets[key] ?? [];
      const expected = group.reduce((sum, r) => sum + r.price, 0);
      cumulativeExpected += expected;
      const defaultedCount = group.filter((r) => r.default_amount > 0).length;

      out.push({
        month: `${cursor.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} '${String(cursor.getUTCFullYear()).slice(-2)}`,
        expected_revenue: cumulativeExpected,
        total_due: group.reduce((sum, r) => sum + (r.price - r.amount_paid), 0),
        total_received: group.reduce((sum, r) => sum + r.amount_paid, 0),
        active_transactions: group.filter((r) => r.balance > 0 && !r.is_suspended).length,
        missed_payment_count: defaultedCount,
        defaulted_count: defaultedCount,
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return out;
  },
};
