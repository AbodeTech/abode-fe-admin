import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Associate upgrade queue.
 *
 * Fixtures carry `user` and `referrer` as **bare ObjectIds**, matching what
 * `findUpgradesPaginated` actually returns today (⛔ ticket 13). That is
 * deliberate — mocking populated names would hide the gap the UI is built to
 * handle, and the em-dash path would never be exercised.
 *
 * Amounts are decimal naira.
 * ============================================================ */

const ADMIN_ID = '665fbbbb00000000000000bb';

type MockUpgrade = {
  _id: string;
  user: string;
  referrer: string | null;
  from_tier: string;
  to_tier: string;
  fee_amount: number;
  payment_method: string;
  status: string;
  transaction: string | null;
  bank_name: string | null;
  reference_no: string | null;
  file_url: string | null;
  coupon: string | null;
  coupon_code_snapshot: string | null;
  original_amount: number | null;
  discount_amount: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decline_reason: string | null;
  createdAt: string;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const base = {
  from_tier: 'associate',
  to_tier: 'associate-pro',
  fee_amount: 20_000,
  coupon: null,
  coupon_code_snapshot: null,
  original_amount: null,
  discount_amount: null,
  reviewed_by: null,
  reviewed_at: null,
  decline_reason: null,
};

const upgrades: MockUpgrade[] = [
  {
    ...base,
    _id: '665f0000000000000000a001',
    user: '665fcccc00000000000000c1',
    referrer: '665fcccc00000000000000c2',
    payment_method: 'transfer',
    status: 'pending',
    transaction: '665f1111000000000000t001',
    bank_name: 'Guaranty Trust Bank',
    reference_no: 'GTB-2026-0714-88213',
    file_url: 'https://res.cloudinary.com/demo/image/upload/receipt-88213.jpg',
    createdAt: daysAgo(1),
  },
  {
    ...base,
    _id: '665f0000000000000000a002',
    user: '665fcccc00000000000000c3',
    referrer: null, // no referrer — commission pays nobody
    payment_method: 'paystack',
    status: 'pending',
    transaction: '665f1111000000000000t002',
    bank_name: null,
    reference_no: null,
    file_url: null,
    createdAt: daysAgo(2),
  },
  {
    ...base,
    _id: '665f0000000000000000a003',
    user: '665fcccc00000000000000c4',
    referrer: '665fcccc00000000000000c2',
    payment_method: 'transfer',
    status: 'pending',
    transaction: '665f1111000000000000t003',
    bank_name: 'Zenith Bank',
    reference_no: 'ZEN-2026-0712-40021',
    file_url: 'https://res.cloudinary.com/demo/image/upload/receipt-40021.jpg',
    // Coupon used — approving this one pays no commission.
    coupon: '665f2222000000000000cp01',
    coupon_code_snapshot: 'ABODE50',
    original_amount: 20_000,
    discount_amount: 10_000,
    fee_amount: 10_000,
    createdAt: daysAgo(3),
  },
  {
    ...base,
    _id: '665f0000000000000000a004',
    user: '665fcccc00000000000000c5',
    referrer: '665fcccc00000000000000c1',
    payment_method: 'transfer',
    status: 'approved',
    transaction: '665f1111000000000000t004',
    bank_name: 'Access Bank',
    reference_no: 'ACC-2026-0630-11902',
    file_url: 'https://res.cloudinary.com/demo/image/upload/receipt-11902.jpg',
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(12),
    createdAt: daysAgo(14),
  },
  {
    ...base,
    _id: '665f0000000000000000a005',
    user: '665fcccc00000000000000c6',
    referrer: '665fcccc00000000000000c2',
    payment_method: 'transfer',
    status: 'declined',
    transaction: '665f1111000000000000t005',
    bank_name: 'First Bank',
    reference_no: 'FBN-2026-0620-77310',
    file_url: 'https://res.cloudinary.com/demo/image/upload/receipt-77310.jpg',
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(20),
    decline_reason:
      'The transfer reference does not match any payment received on that date. Please re-submit with the correct receipt.',
    createdAt: daysAgo(22),
  },
  {
    ...base,
    _id: '665f0000000000000000a006',
    user: '665fcccc00000000000000c7',
    referrer: null,
    from_tier: 'user',
    to_tier: 'associate',
    fee_amount: 0,
    payment_method: 'admin-manual',
    status: 'approved',
    transaction: null,
    bank_name: null,
    reference_no: null,
    file_url: null,
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(30),
    createdAt: daysAgo(30),
  },
];

function requirePending(id: string): MockUpgrade {
  const upgrade = upgrades.find((row) => row._id === id);
  if (!upgrade) throw new MockHttpError(404, 'Upgrade not found', 'UPGRADE_NOT_FOUND');
  if (upgrade.status !== 'pending') {
    throw new MockHttpError(
      400,
      `This upgrade is already ${upgrade.status}`,
      'UPGRADE_NOT_PENDING'
    );
  }
  return upgrade;
}

const DECLINE_REASON_MIN = 20;

export const upgradeRoutes: MockRoutes = {
  'GET /admin/referrals/upgrades': ({ query }) => {
    const filtered = upgrades.filter((upgrade) => {
      if (query.status && upgrade.status !== query.status) return false;
      if (query.payment_method && upgrade.payment_method !== query.payment_method) return false;
      if (query.to_tier && upgrade.to_tier !== query.to_tier) return false;
      return true;
    });

    return paged(filtered, query);
  },

  'PATCH /admin/referrals/upgrades/:id/approve': ({ params }) => {
    const upgrade = requirePending(params.id);
    upgrade.status = 'approved';
    upgrade.reviewed_by = ADMIN_ID;
    upgrade.reviewed_at = new Date().toISOString();
    return upgrade;
  },

  'PATCH /admin/referrals/upgrades/:id/decline': ({ params, body: raw }) => {
    const { reason } = body<{ reason?: string }>(raw);

    if (!reason || reason.trim().length < DECLINE_REASON_MIN) {
      throw new MockHttpError(
        400,
        `DECLINE_REASON_TOO_SHORT: a decline reason of at least ${DECLINE_REASON_MIN} characters is required`,
        'DECLINE_REASON_TOO_SHORT'
      );
    }

    const upgrade = requirePending(params.id);
    upgrade.status = 'declined';
    upgrade.decline_reason = reason.trim();
    upgrade.reviewed_by = ADMIN_ID;
    upgrade.reviewed_at = new Date().toISOString();
    return upgrade;
  },
};
