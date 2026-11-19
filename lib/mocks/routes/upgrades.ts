import { MockHttpError, type MockRoutes } from '../router';
import { PEOPLE, adminRef, applicantRef, findPerson, matchesPersonSearch, referrerRef } from './people';
import { body, paged } from './util';

/* ============================================================
 * Associate upgrade queue.
 *
 * Fixtures store `user` and `referrer` as ids and the queue route populates them
 * on the way out — mirroring `findUpgradesPaginated(filter, page, limit, true)`,
 * which populates as of 2026-08-13 (ticket 13).
 *
 * Every ref on the approve / decline / manual-upgrade responses stays bare on
 * purpose, because the BE returns the document as written there — which keeps
 * the em-dash + copyable-id path exercised rather than becoming dead code.
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

/**
 * What the queue route returns: the row with all three person refs resolved,
 * each carrying only the fields its own BE projection selects. The referrer's
 * is the applicant's minus `referral_status`; `reviewed_by` is an Admin and
 * gets name only.
 */
function populate(upgrade: MockUpgrade) {
  return {
    ...upgrade,
    user: applicantRef(upgrade.user),
    referrer: referrerRef(upgrade.referrer),
    reviewed_by: adminRef(upgrade.reviewed_by),
  };
}

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

const REASON_MIN = 20;

const UPGRADE_TARGET_TIERS = ['associate', 'associate-pro', 'founder', 'premium', 'management'];

/**
 * Proposed eligibility (Admin v2 — Backend Requirements, item 12): the course
 * each tier requires, and who has completed it. Completion here is seeded per
 * person; the BE reads `Enrolment.completed_at`.
 */
const UPGRADE_REQUIREMENTS = [
  { to_tier: 'associate', from: ['guest', 'user'], course: { id: '66cc0a0000000000000002', title: 'Abode Associate Certification' } },
  { to_tier: 'associate-pro', from: ['guest', 'user', 'associate'], course: { id: '66cc0a0000000000000001', title: 'Selling Woodgate Prime' } },
] as const;

const completionFor = (personIndex: number, toTier: string) => {
  // Two of every three eligible people have finished; scores vary by person.
  if (personIndex % 3 === 2) return null;
  return {
    completed_at: new Date(Date.now() - (personIndex * 4 + (toTier === 'associate' ? 2 : 9)) * 86_400_000).toISOString(),
    best_score_pct: 70 + ((personIndex * 7) % 30),
  };
};

export const upgradeRoutes: MockRoutes = {
  'GET /admin/referrals/upgrades/eligible': ({ query }) => {
    // Like the BE's DTO: the tier is required and only these two exist.
    const toTier = String(query.to_tier ?? '');
    if (toTier !== 'associate' && toTier !== 'associate-pro') {
      throw new MockHttpError(
        400,
        'to_tier must be one of the following values: associate, associate-pro',
        'VALIDATION_FAILED'
      );
    }
    const req = UPGRADE_REQUIREMENTS.find((r) => r.to_tier === toTier)!;
    const search = typeof query.search === 'string' ? query.search : '';
    const rows = PEOPLE.flatMap((person, index) => {
      if (!(req.from as readonly string[]).includes(person.referral_status)) return [];
      if (search && !matchesPersonSearch(person, search)) return [];
      const done = completionFor(index, req.to_tier);
      if (!done) return [];
      // The BE leaves out anyone with a pending or approved request for the tier.
      const requests = upgrades.filter((u) => u.user === person._id && u.to_tier === req.to_tier);
      if (requests.some((u) => u.status === 'pending' || u.status === 'approved')) return [];
      return [
        {
          id: person._id,
          first_name: person.firstName,
          last_name: person.lastName,
          email: person.email,
          referral_status: person.referral_status,
          course_id: req.course.id,
          course_title: req.course.title,
          completed_at: done.completed_at,
          best_score_pct: done.best_score_pct,
          upgrade_requested: false,
        },
      ];
    });
    rows.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
    const page = paged(rows, query);
    return { ...page, meta: { ...page.meta, course: req.course } };
  },

  'GET /admin/referrals/upgrades': ({ query }) => {
    const search = typeof query.search === 'string' ? query.search : '';

    const filtered = upgrades.filter((upgrade) => {
      if (query.status && upgrade.status !== query.status) return false;
      if (query.payment_method && upgrade.payment_method !== query.payment_method) return false;
      if (query.to_tier && upgrade.to_tier !== query.to_tier) return false;

      if (search) {
        // Applicant only, matching `findUserIdsBySearch` — a referrer's name
        // returns nothing here, exactly as it does against the real backend.
        const applicant = findPerson(upgrade.user);
        if (!applicant || !matchesPersonSearch(applicant, search)) return false;
      }

      return true;
    });

    return paged(filtered.map(populate), query);
  },

  'PATCH /admin/referrals/upgrades/:id/approve': ({ params }) => {
    const upgrade = requirePending(params.id);
    upgrade.status = 'approved';
    upgrade.reviewed_by = ADMIN_ID;
    upgrade.reviewed_at = new Date().toISOString();
    // Unpopulated, like the BE's `findUpgradeById` re-read.
    return upgrade;
  },

  'PATCH /admin/referrals/upgrades/:id/decline': ({ params, body: raw }) => {
    const { reason } = body<{ reason?: string }>(raw);

    if (!reason || reason.trim().length < REASON_MIN) {
      throw new MockHttpError(
        400,
        `DECLINE_REASON_TOO_SHORT: a decline reason of at least ${REASON_MIN} characters is required`,
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

  /**
   * Force-upgrade, with an optional off-platform fee (ticket 15). Mirrors
   * `ReferralService.manualUpgrade`: a fee writes a transaction, commission
   * needs both a fee and a referrer, and a fee against a walletless user fails.
   */
  'POST /admin/users/:id/manual-upgrade': ({ params, body: raw }) => {
    const dto = body<{
      to_tier?: string;
      fee_amount?: number;
      pay_commission?: boolean;
      reason?: string;
    }>(raw);

    const target = findPerson(params.id);
    if (!target) {
      throw new MockHttpError(404, 'User not found', 'UPGRADE_NOT_FOUND');
    }
    if (!dto.to_tier || !UPGRADE_TARGET_TIERS.includes(dto.to_tier)) {
      throw new MockHttpError(400, 'to_tier must be a valid tier', 'VALIDATION_ERROR');
    }
    if (!dto.reason || dto.reason.trim().length < REASON_MIN) {
      throw new MockHttpError(
        400,
        `REASSIGN_REASON_TOO_SHORT: a reason of at least ${REASON_MIN} characters is required`,
        'REASSIGN_REASON_TOO_SHORT'
      );
    }

    const fee = dto.fee_amount ?? 0;
    if (fee > 0 && !target.wallet) {
      throw new MockHttpError(400, 'User has no wallet', 'PAYSTACK_INIT_FAILED');
    }

    const referrer = upgrades.find((row) => row.user === target._id)?.referrer ?? null;
    const transaction = fee > 0 ? `665f1111000000000000t${upgrades.length + 1}` : null;

    const created: MockUpgrade = {
      _id: `665f0000000000000000a0${upgrades.length + 1}`,
      user: target._id,
      referrer,
      from_tier: target.referral_status,
      to_tier: dto.to_tier,
      fee_amount: fee,
      payment_method: 'admin-manual',
      status: 'approved',
      transaction,
      bank_name: null,
      reference_no: null,
      file_url: null,
      coupon: null,
      coupon_code_snapshot: null,
      original_amount: null,
      discount_amount: null,
      reviewed_by: ADMIN_ID,
      reviewed_at: new Date().toISOString(),
      decline_reason: null,
      createdAt: new Date().toISOString(),
    };

    upgrades.unshift(created);
    target.referral_status = dto.to_tier;

    return created;
  },
};
