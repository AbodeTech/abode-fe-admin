import { MockHttpError, type MockRoutes } from '../router';
import { applicantRef } from './people';
import { paged } from './util';

/* ============================================================
 * Commercial plot plans — GET /admin/commercial/purchase/plans and
 * GET /admin/commercial/purchase/plans/:id.
 *
 * Suspend / unsuspend / allocate stay registered on the acquisition routes
 * in asset-transactions.ts; those handlers look commercial plans up through
 * `findCommercialPlan` so a commercial id is a first-class land plan.
 * ============================================================ */

const USER_A = '665fcccc00000000000000c1';
const USER_C = '665fcccc00000000000000c9';
const ASSET_AVIATION = '665faaaa00000000000000a1';

const ASSETS: Record<string, { _id: string; name: string; asset_location: string }> = {
  [ASSET_AVIATION]: {
    _id: ASSET_AVIATION,
    name: 'Aviation City',
    asset_location: 'Ibeju-Lekki, Lagos',
  },
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export type MockCommercialPlan = {
  _id: string;
  user: string;
  asset: string;
  is_suspended: boolean;
  suspend_reason: string | null;
  block: string | null;
  plot: string | null;
  allocation_status: 'pending' | 'allocated' | 'email_sent' | 'reassigned';
  allocation_date: string | null;
  default_count: number;
  unique_asset_id: string;
  asset_type: 'commercial';
  amount_paid: number;
  amount_payable: number;
  balance: number;
  size: number;
  document_plan: { _id: string } | null;
  createdAt: string;
  updatedAt: string;
};

const commercialPlans: Record<string, MockCommercialPlan> = {
  '665fpl00000000000000cp01': {
    _id: '665fpl00000000000000cp01',
    user: USER_A,
    asset: ASSET_AVIATION,
    is_suspended: false,
    suspend_reason: null,
    block: 'C',
    plot: '8',
    allocation_status: 'allocated',
    allocation_date: daysAgo(12),
    default_count: 0,
    unique_asset_id: 'CP-AVIATION-A-01',
    asset_type: 'commercial',
    amount_paid: 18_000_000,
    amount_payable: 45_000_000,
    balance: 27_000_000,
    size: 1000,
    document_plan: { _id: '665fdp00000000000000c01' },
    createdAt: daysAgo(40),
    updatedAt: daysAgo(12),
  },
  '665fpl00000000000000cp02': {
    _id: '665fpl00000000000000cp02',
    user: USER_C,
    asset: ASSET_AVIATION,
    is_suspended: true,
    suspend_reason: 'Missed three consecutive commercial plot instalments.',
    block: null,
    plot: null,
    allocation_status: 'pending',
    allocation_date: null,
    default_count: 3,
    unique_asset_id: 'CP-AVIATION-C-02',
    asset_type: 'commercial',
    amount_paid: 5_000_000,
    amount_payable: 45_000_000,
    balance: 40_000_000,
    size: 1000,
    document_plan: null,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
};

export function findCommercialPlan(id: string): MockCommercialPlan | undefined {
  return commercialPlans[id];
}

function populate(plan: MockCommercialPlan) {
  return {
    ...plan,
    user: applicantRef(plan.user),
    asset: ASSETS[plan.asset] ?? plan.asset,
  };
}

function requirePlan(id: string): MockCommercialPlan {
  const plan = commercialPlans[id];
  if (!plan) {
    throw new MockHttpError(404, 'Commercial plot plan not found', 'PAYMENT_PLAN_NOT_FOUND');
  }
  return plan;
}

export const commercialPlotRoutes: MockRoutes = {
  'GET /admin/commercial/purchase/plans': ({ query }) => {
    let rows = Object.values(commercialPlans);
    const suspended = String(query.suspended ?? '');
    if (suspended === 'true') rows = rows.filter((row) => row.is_suspended);
    if (suspended === 'false') rows = rows.filter((row) => !row.is_suspended);
    rows = [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return paged(rows.map(populate), query, 20);
  },

  'GET /admin/commercial/purchase/plans/:id': ({ params }) => populate(requirePlan(params.id)),
};
