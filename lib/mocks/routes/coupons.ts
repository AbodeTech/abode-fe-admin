import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Admin coupons — /admin/coupons*
 * ============================================================ */

type MockCoupon = {
  _id: string;
  couponCode: string;
  discount_percentage: number;
  max_discount_amount: number | null;
  applies_to: Array<'associate-pro-upgrade' | 'client-request'>;
  usage_limit_type: 'unlimited' | 'limited';
  usage_limit: number | null;
  usage_count: number;
  max_uses_per_user: number | null;
  expiry_type: 'no_expiry' | 'expires_on';
  starts_at: string | null;
  ends_at: string | null;
  activates_immediately: boolean;
  status: 'pending' | 'active' | 'paused' | 'expired';
  paused_reason: string | null;
  deleted_at: string | null;
  createdAt: string;
  updatedAt: string;
};

const now = () => new Date().toISOString();

const coupons: MockCoupon[] = [
  {
    _id: '665fcoupon00000000000001',
    couponCode: 'ABODE50',
    discount_percentage: 50,
    max_discount_amount: 10_000,
    applies_to: ['associate-pro-upgrade'],
    usage_limit_type: 'limited',
    usage_limit: 100,
    usage_count: 12,
    max_uses_per_user: 1,
    expiry_type: 'expires_on',
    starts_at: now(),
    ends_at: new Date(Date.now() + 90 * 86_400_000).toISOString(),
    activates_immediately: true,
    status: 'active',
    paused_reason: null,
    deleted_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: '665fcoupon00000000000002',
    couponCode: 'PRO20',
    discount_percentage: 20,
    max_discount_amount: null,
    applies_to: ['associate-pro-upgrade', 'client-request'],
    usage_limit_type: 'unlimited',
    usage_limit: null,
    usage_count: 3,
    max_uses_per_user: null,
    expiry_type: 'no_expiry',
    starts_at: now(),
    ends_at: null,
    activates_immediately: true,
    status: 'paused',
    paused_reason: 'Campaign on hold',
    deleted_at: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

function findLive(code: string) {
  return coupons.find(
    (c) => c.couponCode.toUpperCase() === code.toUpperCase() && c.deleted_at == null
  );
}

function publicCoupon(c: MockCoupon) {
  const { deleted_at: _deleted, ...rest } = c;
  return rest;
}

export const couponRoutes: MockRoutes = {
  'GET /admin/coupons': ({ query }) => {
    let rows = coupons.filter((c) => c.deleted_at == null);
    if (typeof query.status === 'string') {
      rows = rows.filter((c) => c.status === query.status);
    }
    if (typeof query.applies_to === 'string') {
      rows = rows.filter((c) => c.applies_to.includes(query.applies_to as MockCoupon['applies_to'][number]));
    }
    if (typeof query.search === 'string' && query.search.trim()) {
      const q = query.search.trim().toUpperCase();
      rows = rows.filter((c) => c.couponCode.includes(q));
    }
    return paged(rows.map(publicCoupon), query);
  },

  'POST /admin/coupons': ({ body: raw }) => {
    const input = body<{
      couponCode?: string;
      discount_percentage?: number;
      max_discount_amount?: number | null;
      applies_to?: MockCoupon['applies_to'];
      usage_limit_type?: MockCoupon['usage_limit_type'];
      usage_limit?: number | null;
      max_uses_per_user?: number | null;
      expiry_type?: MockCoupon['expiry_type'];
      starts_at?: string | null;
      ends_at?: string | null;
      activates_immediately?: boolean;
    }>(raw);

    const couponCode = (input.couponCode ?? '').trim().toUpperCase();
    if (!couponCode) throw new MockHttpError(400, 'couponCode is required', 'VALIDATION_ERROR');
    if (findLive(couponCode)) {
      throw new MockHttpError(409, 'Coupon code already taken', 'COUPON_CODE_TAKEN');
    }

    const activates = Boolean(input.activates_immediately);
    const created: MockCoupon = {
      _id: `665fcoupon${Date.now().toString(16)}`,
      couponCode,
      discount_percentage: input.discount_percentage ?? 0,
      max_discount_amount: input.max_discount_amount ?? null,
      applies_to: input.applies_to?.length ? input.applies_to : ['associate-pro-upgrade'],
      usage_limit_type: input.usage_limit_type ?? 'unlimited',
      usage_limit: input.usage_limit ?? null,
      usage_count: 0,
      max_uses_per_user: input.max_uses_per_user ?? null,
      expiry_type: input.expiry_type ?? 'no_expiry',
      starts_at: activates ? now() : (input.starts_at ?? null),
      ends_at: input.ends_at ?? null,
      activates_immediately: activates,
      status: activates ? 'active' : 'pending',
      paused_reason: null,
      deleted_at: null,
      createdAt: now(),
      updatedAt: now(),
    };
    coupons.unshift(created);
    return publicCoupon(created);
  },

  'PATCH /admin/coupons/:code': ({ params, body: raw }) => {
    const row = findLive(params.code);
    if (!row) throw new MockHttpError(404, 'Coupon not found', 'COUPON_NOT_FOUND');
    if (row.status === 'expired') {
      throw new MockHttpError(400, 'Expired coupons cannot be edited', 'COUPON_EXPIRED_IMMUTABLE');
    }

    const input = body<Partial<MockCoupon>>(raw);
    Object.assign(row, input, { updatedAt: now() });
    return publicCoupon(row);
  },

  'PATCH /admin/coupons/:code/status': ({ params, body: raw }) => {
    const row = findLive(params.code);
    if (!row) throw new MockHttpError(404, 'Coupon not found', 'COUPON_NOT_FOUND');

    const input = body<{ status?: MockCoupon['status']; reason?: string }>(raw);
    if (!input.status) throw new MockHttpError(400, 'status is required', 'VALIDATION_ERROR');
    if (input.status === 'paused' && !input.reason?.trim()) {
      throw new MockHttpError(400, 'Pause reason required', 'PAUSE_REASON_REQUIRED');
    }

    row.status = input.status;
    row.paused_reason = input.status === 'paused' ? (input.reason?.trim() ?? null) : null;
    row.updatedAt = now();
    return publicCoupon(row);
  },

  'DELETE /admin/coupons/:code': ({ params }) => {
    const row = findLive(params.code);
    if (!row) throw new MockHttpError(404, 'Coupon not found', 'COUPON_NOT_FOUND');
    row.deleted_at = now();
    row.updatedAt = now();
    return { success: true, message: 'Coupon deleted' };
  },
};
