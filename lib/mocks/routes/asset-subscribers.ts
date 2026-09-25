import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset } from './assets';
import { findPerson } from './people';
import { paged } from './util';

/* ============================================================
 * Asset subscribers — GET /admin/assets/:assetId/subscribers.
 *
 * A real abode-be-v2 module exists for this (asset-subscribers.schema.ts's
 * own header cites the exact DTOs it was transcribed from), but — like
 * asset-analytics.ts before it — it was never given a mock route here, so
 * every call 404'd in mock-mode dev and the Customers tab always rendered
 * its error card. This file is that missing mock, not a new feature.
 *
 * Carved out of the assets domain's /admin/assets/* claim the same way
 * asset-analytics.ts is — the segment after :assetId is the
 * literal "subscribers". The CSV export sibling
 * (GET .../subscribers/export) is deliberately NOT mocked:
 * use-export-asset-subscribers.ts already refuses in mock mode itself
 * ("point the app at a real backend"), matching the flex-leads/agency/
 * purchase-confirmations precedent for streamed CSV endpoints.
 * ============================================================ */

type MockSubscriberRow = {
  plan_id: string;
  createdAt: string;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  asset_id: string;
  asset_name: string | null;
  asset_type: string | null;
  size: number | null;
  no_of_units: number;
  unique_asset_id: string | null;
  asset_price: number;
  land_price: number | null;
  document_price: number | null;
  amount_paid: number;
  amount_payable: number;
  initial_payment: number;
  balance: number;
  default_amount: number;
  month_subscription: number;
  months_covered: number;
  months_overdue: number;
  start_date: string;
  next_payment_date: string | null;
  payment_percentage: string;
  status: string;
  is_defaulted: boolean;
  is_suspended: boolean;
};

function subscriber(partial: Pick<MockSubscriberRow, 'plan_id' | 'asset_id' | 'buyer_id'> & Partial<MockSubscriberRow>): MockSubscriberRow {
  const buyer = findPerson(partial.buyer_id);
  const referrer = findPerson(partial.referrer_id ?? null);
  return {
    createdAt: '2026-01-01T09:00:00.000Z',
    buyer_name: buyer ? `${buyer.firstName} ${buyer.lastName}` : null,
    buyer_email: buyer?.email ?? null,
    buyer_phone: buyer?.phoneNumber ?? null,
    referrer_id: referrer?._id ?? null,
    referrer_name: referrer ? `${referrer.firstName} ${referrer.lastName}` : null,
    referrer_email: referrer?.email ?? null,
    asset_name: null,
    asset_type: null,
    size: null,
    no_of_units: 1,
    unique_asset_id: null,
    land_price: null,
    document_price: null,
    initial_payment: 0,
    default_amount: 0,
    month_subscription: 0,
    months_covered: 0,
    months_overdue: 0,
    start_date: '2026-01-01T09:00:00.000Z',
    next_payment_date: null,
    payment_percentage: '0.00',
    status: 'active',
    is_defaulted: false,
    is_suspended: false,
    asset_price: 0,
    amount_paid: 0,
    amount_payable: 0,
    balance: 0,
    ...partial,
  };
}

const subscribersByAsset: Record<string, MockSubscriberRow[]> = {
  // Aviation City — the estate seeded with a full offer/cost tree elsewhere
  // in these mocks gets a full subscriber list too, covering all four
  // SUBSCRIBER_TYPES buckets plus a referred and an unreferred buyer.
  '665faaaa00000000000000a1': [
    subscriber({
      plan_id: 'sub-plan-0001',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c1', // John Okafor
      referrer_id: '665fcccc00000000000000c3', // Funke Adebayo
      size: 300,
      no_of_units: 1,
      asset_price: 15_000_000,
      amount_paid: 15_000_000,
      amount_payable: 15_000_000,
      balance: 0,
      month_subscription: 0,
      payment_percentage: '100.00',
      status: 'completed',
      start_date: '2026-01-10T09:00:00.000Z',
      createdAt: '2026-01-10T09:00:00.000Z',
    }),
    subscriber({
      plan_id: 'sub-plan-0002',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c2', // Uche Eze
      size: 500,
      asset_price: 25_000_000,
      amount_paid: 9_000_000,
      amount_payable: 25_000_000,
      balance: 16_000_000,
      month_subscription: 24,
      months_covered: 9,
      payment_percentage: '36.00',
      status: 'active',
      start_date: '2026-03-01T09:00:00.000Z',
      next_payment_date: '2026-10-01T09:00:00.000Z',
      createdAt: '2026-03-01T09:00:00.000Z',
    }),
    subscriber({
      plan_id: 'sub-plan-0003',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c4', // Ibrahim Musa
      referrer_id: '665fcccc00000000000000c1',
      size: 300,
      no_of_units: 2,
      asset_price: 30_000_000,
      amount_paid: 4_000_000,
      amount_payable: 30_000_000,
      balance: 26_000_000,
      default_amount: 2_500_000,
      month_subscription: 36,
      months_covered: 3,
      months_overdue: 4,
      payment_percentage: '13.33',
      status: 'defaulted',
      is_defaulted: true,
      next_payment_date: '2026-06-01T09:00:00.000Z',
      start_date: '2026-02-15T09:00:00.000Z',
      createdAt: '2026-02-15T09:00:00.000Z',
    }),
    subscriber({
      plan_id: 'sub-plan-0004',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c5', // Ngozi Nwosu
      referrer_id: '665fcccc00000000000000c3',
      size: 500,
      asset_price: 25_000_000,
      amount_paid: 6_000_000,
      amount_payable: 25_000_000,
      balance: 19_000_000,
      month_subscription: 12,
      months_covered: 6,
      payment_percentage: '24.00',
      status: 'suspended',
      is_suspended: true,
      start_date: '2026-04-20T09:00:00.000Z',
      createdAt: '2026-04-20T09:00:00.000Z',
    }),
    subscriber({
      plan_id: 'sub-plan-0005',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c6', // Tunde Balogun
      size: 300,
      asset_price: 15_000_000,
      amount_paid: 5_500_000,
      amount_payable: 15_000_000,
      balance: 9_500_000,
      month_subscription: 18,
      months_covered: 7,
      payment_percentage: '36.67',
      status: 'active',
      start_date: '2026-05-05T09:00:00.000Z',
      next_payment_date: '2026-10-05T09:00:00.000Z',
      createdAt: '2026-05-05T09:00:00.000Z',
    }),
    subscriber({
      plan_id: 'sub-plan-0006',
      asset_id: '665faaaa00000000000000a1',
      buyer_id: '665fcccc00000000000000c9', // Amaka Obi
      referrer_id: '665fcccc00000000000000c6',
      size: 500,
      asset_price: 25_000_000,
      amount_paid: 1_000_000,
      amount_payable: 25_000_000,
      balance: 24_000_000,
      month_subscription: 24,
      months_covered: 1,
      payment_percentage: '4.00',
      status: 'active',
      next_payment_date: '2026-09-15T09:00:00.000Z',
      start_date: '2026-08-01T09:00:00.000Z',
      createdAt: '2026-08-01T09:00:00.000Z',
    }),
  ],
  // Harmony Gardens — the honest-empty case, matching every other Site
  // Setup/Costs/Offers slice's use of this asset for its empty state.
  '665faaaa00000000000000a2': [],
};

/** Mirrors the BE's four buckets closely enough for this mock's purposes — see asset-subscribers.schema.ts's SUBSCRIBER_TYPES. */
function matchesSubscriberType(row: MockSubscriberRow, type: string): boolean {
  if (type === 'suspended') return row.is_suspended;
  if (type === 'defaulted') return row.is_defaulted;
  if (type === 'completed') return row.status === 'completed';
  if (type === 'thirty_percent') return Number.parseFloat(row.payment_percentage) >= 30;
  return true;
}

function matchesSearch(row: MockSubscriberRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return [row.buyer_name, row.buyer_email, row.buyer_phone].some((field) =>
    field?.toLowerCase().includes(needle)
  );
}

const SORTABLE: Record<string, keyof MockSubscriberRow> = {
  created_at: 'createdAt',
  amount_paid: 'amount_paid',
  balance: 'balance',
  asset_price: 'asset_price',
  next_payment_date: 'next_payment_date',
};

export const assetSubscribersRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/subscribers': ({ params, query }) => {
    if (!findActiveAsset(params.assetId)) {
      throw new MockHttpError(404, 'Asset not found', 'ASSET_NOT_FOUND');
    }
    const rows = subscribersByAsset[params.assetId] ?? [];

    const q = typeof query.q === 'string' ? query.q : '';
    const subscriberType = typeof query.subscriber_type === 'string' ? query.subscriber_type : '';
    const sortField = SORTABLE[typeof query.sort_by === 'string' ? query.sort_by : 'created_at'] ?? 'createdAt';
    const sortDir = query.sort_dir === 'asc' ? 1 : -1;

    const filtered = rows
      .filter((row) => matchesSearch(row, q))
      .filter((row) => matchesSubscriberType(row, subscriberType))
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return av > bv ? sortDir : av < bv ? -sortDir : 0;
      });

    return paged(filtered, query, 25);
  },
};
