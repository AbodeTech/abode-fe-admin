import { MockHttpError, type MockRoutes } from '../router';
import { findPerson, matchesPersonSearch } from './people';
import { findCommercialPlan } from './commercial-plots';
import { body, paged } from './util';

/* ============================================================
 * Asset transactions mocks — GET /admin/transactions (purchase rows),
 * GET /admin/transactions/documents (the document-fee ledger),
 * the unified review pair under /admin/acquisitions/transactions/:txId,
 * FO transaction detail, GET FO land-plan, and unified plan
 * suspend / unsuspend / allocate under /admin/acquisitions/plans/:planId.
 *
 * Fixtures cover the states the page exists to render: a transfer-paid
 * initial purchase and a transfer-paid installment both awaiting review, a
 * Paystack purchase that confirmed itself, a wallet-paid installment, a
 * declined transfer, and an outright (full-payment) purchase — plus one
 * full-ownership row, since that flow shipped on 2026-08-13 (ticket 20).
 *
 * The list route populates `user` (with its nested `referred_by`) and
 * `source_asset`, mirroring `TX_POPULATE.adminTransactionList` — exactly those
 * fields and no others. The review responses stay unpopulated, as the BE
 * returns them.
 *
 * `description` is set to the same four literals the BE writes. It carries no
 * property name, on purpose: reading it for the Property column is the mistake
 * ticket 24c exists to prevent, and a mock that put a name in there would hide
 * that.
 *
 * Money is decimal naira.
 * ============================================================ */

const USER_A = '665fcccc00000000000000c1';
const USER_B = '665fcccc00000000000000c2';
const USER_C = '665fcccc00000000000000c9';
const ASSET_AVIATION = '665faaaa00000000000000a1';
const ASSET_HARMONY = '665faaaa00000000000000a2';
const FO_PLAN_ID = '665fpl00000000000000fo01';
const FO_DOC_PLAN_ID = '665fdp00000000000000d01';

/** `.populate('source_asset', 'name asset_location')` — those two fields only. */
const ASSETS: Record<string, { _id: string; name: string; asset_location: string }> = {
  [ASSET_AVIATION]: {
    _id: ASSET_AVIATION,
    name: 'Aviation City',
    asset_location: 'Ibeju-Lekki, Lagos',
  },
  [ASSET_HARMONY]: {
    _id: ASSET_HARMONY,
    name: 'Harmony Gardens',
    asset_location: 'Kuje, Abuja',
  },
};

/**
 * Who referred whom, standing in for `User.referred_by`. The BE populates this
 * as a nested hop off the buyer, so the mock resolves it the same way.
 */
const REFERRED_BY: Record<string, string | null> = {
  [USER_A]: USER_B,
  [USER_B]: null, // no referrer — the row says "No referrer", not an em-dash
  [USER_C]: USER_A,
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockPurchase = {
  _id: string;
  user: string;
  wallet: string;
  type: 'purchase';
  direction: 'debit';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  admin_status: string | null;
  payment_method: 'paystack' | 'wallet' | 'transfer' | 'system';
  source_asset: string;
  number_of_units: number;
  decline_reason: string | null;
  purchase_details: {
    transaction_kind: string;
    payment_plan_id: string | null;
    offer_id: string;
    size_sqm: number;
    tenor_months: number;
    no_of_units: string;
    total_asset_price: number;
    monthly_installment: number | null;
    is_full_payment: boolean;
    transfer_bank_name?: string;
    transfer_reference_no?: string;
    transfer_receipt_url?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

const base = {
  type: 'purchase' as const,
  direction: 'debit' as const,
  decline_reason: null,
};

const purchases: MockPurchase[] = [
  // Transfer-paid NEW purchase — the review dialog's main case.
  {
    ...base,
    _id: '665fpp0000000000000000t1',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 3_600_000,
    status: 'pending',
    admin_status: 'pending',
    payment_method: 'transfer',
    source_asset: ASSET_AVIATION,
    number_of_units: 2,
    purchase_details: {
      transaction_kind: 'initial_flex_purchase',
      payment_plan_id: null,
      offer_id: `${ASSET_AVIATION}-offer-0`,
      size_sqm: 300,
      tenor_months: 12,
      no_of_units: '2',
      total_asset_price: 24_000_000,
      monthly_installment: 1_854_545,
      is_full_payment: false,
      transfer_bank_name: 'Guaranty Trust Bank',
      transfer_reference_no: 'GTB-2026-0729-55120',
      transfer_receipt_url: 'https://res.cloudinary.com/demo/image/upload/receipt-55120.jpg',
    },
    createdAt: daysAgo(0.3),
    updatedAt: daysAgo(0.3),
  },
  // Transfer-paid INSTALLMENT awaiting review.
  {
    ...base,
    _id: '665fpp0000000000000000t2',
    user: USER_B,
    wallet: '665fdddd000000000000wa02',
    amount: 818_182,
    status: 'pending',
    admin_status: 'pending',
    payment_method: 'transfer',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'recurring_flex_payment',
      payment_plan_id: '665fpl00000000000000pl02',
      offer_id: `${ASSET_HARMONY}-offer-0`,
      size_sqm: 500,
      tenor_months: 24,
      no_of_units: '1',
      total_asset_price: 12_000_000,
      monthly_installment: 818_182,
      is_full_payment: false,
      transfer_bank_name: 'Access Bank',
      transfer_reference_no: 'ACC-2026-0728-88431',
      transfer_receipt_url: 'https://res.cloudinary.com/demo/image/upload/receipt-88431.jpg',
    },
    createdAt: daysAgo(1.1),
    updatedAt: daysAgo(1.1),
  },
  // Paystack purchase — confirmed itself via webhook; no admin action.
  {
    ...base,
    _id: '665fpp0000000000000000t3',
    user: USER_C,
    wallet: '665fdddd000000000000wa03',
    amount: 5_400_000,
    status: 'completed',
    admin_status: 'auto-approved',
    payment_method: 'paystack',
    source_asset: ASSET_AVIATION,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'initial_flex_purchase',
      payment_plan_id: '665fpl00000000000000pl03',
      offer_id: `${ASSET_AVIATION}-offer-0`,
      size_sqm: 500,
      tenor_months: 0,
      no_of_units: '1',
      total_asset_price: 5_400_000,
      monthly_installment: 0,
      is_full_payment: true,
    },
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  // Wallet-paid installment — settled instantly.
  {
    ...base,
    _id: '665fpp0000000000000000t4',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 818_182,
    status: 'completed',
    admin_status: null,
    payment_method: 'wallet',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'recurring_flex_payment',
      payment_plan_id: '665fpl00000000000000pl02',
      offer_id: `${ASSET_HARMONY}-offer-0`,
      size_sqm: 500,
      tenor_months: 24,
      no_of_units: '1',
      total_asset_price: 12_000_000,
      monthly_installment: 818_182,
      is_full_payment: false,
    },
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  // A declined transfer — the reason renders on the row.
  {
    ...base,
    _id: '665fpp0000000000000000t5',
    user: USER_B,
    wallet: '665fdddd000000000000wa02',
    amount: 1_800_000,
    status: 'failed',
    admin_status: 'declined',
    payment_method: 'transfer',
    source_asset: ASSET_AVIATION,
    number_of_units: 1,
    decline_reason: 'Transfer reference not found on the bank statement after 5 working days',
    purchase_details: {
      transaction_kind: 'initial_flex_purchase',
      payment_plan_id: null,
      offer_id: `${ASSET_AVIATION}-offer-0`,
      size_sqm: 300,
      tenor_months: 12,
      no_of_units: '1',
      total_asset_price: 12_000_000,
      monthly_installment: 927_273,
      is_full_payment: false,
      transfer_bank_name: 'Zenith Bank',
      transfer_reference_no: 'ZEN-2026-0715-11982',
    },
    createdAt: daysAgo(14),
    updatedAt: daysAgo(9),
  },

  // Full-ownership land, outright. Its flow shipped 2026-08-13 (ticket 20), so
  // rows like this can now arrive — and this one gives `asset_type=full-ownership`
  // something to match.
  {
    ...base,
    _id: '665fpp0000000000000000t6',
    user: USER_C,
    wallet: '665fdddd000000000000wa09',
    amount: 24_000_000,
    status: 'pending',
    admin_status: 'pending',
    payment_method: 'transfer',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'fo_outright_land',
      payment_plan_id: null,
      offer_id: `${ASSET_HARMONY}-offer-1`,
      size_sqm: 600,
      tenor_months: 0,
      no_of_units: '1',
      total_asset_price: 24_000_000,
      monthly_installment: null,
      is_full_payment: true,
      transfer_bank_name: 'Access Bank',
      transfer_reference_no: 'ACC-2026-0812-55031',
      transfer_receipt_url: 'https://res.cloudinary.com/demo/image/upload/receipt-55031.jpg',
    },
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // Its document fee, a separate row — this is the `dp` sales-type bucket.
  {
    ...base,
    _id: '665fpp0000000000000000t7',
    user: USER_C,
    wallet: '665fdddd000000000000wa09',
    amount: 750_000,
    status: 'completed',
    admin_status: 'approved',
    payment_method: 'paystack',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'fo_outright_doc',
      payment_plan_id: null,
      offer_id: `${ASSET_HARMONY}-offer-1`,
      size_sqm: 600,
      tenor_months: 0,
      no_of_units: '1',
      total_asset_price: 750_000,
      monthly_installment: null,
      is_full_payment: true,
    },
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // Approved FO installment — already has a land plan, so suspend / allocate
  // can be exercised without going through review first.
  {
    ...base,
    _id: '665fpp0000000000000000t8',
    user: USER_C,
    wallet: '665fdddd000000000000wa09',
    amount: 2_000_000,
    status: 'completed',
    admin_status: 'approved',
    payment_method: 'paystack',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'fo_installment_land',
      payment_plan_id: FO_PLAN_ID,
      offer_id: `${ASSET_HARMONY}-offer-2`,
      size_sqm: 450,
      tenor_months: 12,
      no_of_units: '1',
      total_asset_price: 24_000_000,
      monthly_installment: 2_000_000,
      is_full_payment: false,
    },
    createdAt: daysAgo(21),
    updatedAt: daysAgo(18),
  },

  // Transfer-paid document instalment awaiting review — the document ledger's
  // main case, and the only doc kind the BE lets an admin action on its own.
  {
    ...base,
    _id: '665fpp0000000000000000t9',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 125_000,
    status: 'pending',
    admin_status: 'pending',
    payment_method: 'transfer',
    source_asset: ASSET_HARMONY,
    number_of_units: 1,
    purchase_details: {
      transaction_kind: 'fo_doc_payment',
      payment_plan_id: FO_DOC_PLAN_ID,
      offer_id: `${ASSET_HARMONY}-offer-2`,
      size_sqm: 450,
      tenor_months: 6,
      no_of_units: '1',
      total_asset_price: 750_000,
      monthly_installment: 125_000,
      is_full_payment: false,
      transfer_bank_name: 'Zenith Bank',
      transfer_reference_no: 'ZEN-2026-0826-70118',
      transfer_receipt_url: 'https://res.cloudinary.com/demo/image/upload/receipt-70118.jpg',
    },
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];

type MockFoPlan = {
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
  asset_type: 'full-ownership';
  amount_paid: number;
  amount_payable: number;
  balance: number;
  size: number;
  linked_document_plan_id: string | null;
  document_plan: { _id: string } | null;
};

const foPlans: Record<string, MockFoPlan> = {
  [FO_PLAN_ID]: {
    _id: FO_PLAN_ID,
    user: USER_C,
    asset: ASSET_HARMONY,
    is_suspended: false,
    suspend_reason: null,
    block: null,
    plot: null,
    allocation_status: 'pending',
    allocation_date: null,
    default_count: 2,
    unique_asset_id: 'FO-HARMONY-C-01',
    asset_type: 'full-ownership',
    amount_paid: 8_000_000,
    amount_payable: 24_000_000,
    balance: 16_000_000,
    size: 450,
    linked_document_plan_id: FO_DOC_PLAN_ID,
    document_plan: { _id: FO_DOC_PLAN_ID },
  },
};

function seedFoPlan(id: string, row: MockPurchase): MockFoPlan {
  const payable = row.purchase_details?.total_asset_price ?? row.amount;
  const plan: MockFoPlan = {
    _id: id,
    user: row.user,
    asset: row.source_asset,
    is_suspended: false,
    suspend_reason: null,
    block: null,
    plot: null,
    allocation_status: 'pending',
    allocation_date: null,
    default_count: 0,
    unique_asset_id: `FO-${id.slice(-6)}`,
    asset_type: 'full-ownership',
    amount_paid: row.amount,
    amount_payable: payable,
    balance: Math.max(0, payable - row.amount),
    size: row.purchase_details?.size_sqm ?? 0,
    linked_document_plan_id: null,
    document_plan: null,
  };
  foPlans[id] = plan;
  return plan;
}

/* -------------------- filtering helpers -------------------- */

/**
 * The BE's `transaction-kinds.ts`, mirrored. `dp` is v2-only — production had
 * ap/rap alone, and without a third bucket the document-fee kinds would match
 * neither filter and vanish from every filtered view.
 */
const SALES_TYPE_KINDS: Record<string, string[]> = {
  ap: ['initial_flex_purchase', 'fo_outright_land', 'fo_installment_land'],
  rap: ['recurring_flex_payment', 'fo_recurring_land'],
  dp: ['fo_outright_doc', 'fo_doc_payment'],
};

const ASSET_TYPE_KINDS: Record<string, string[]> = {
  flex: ['initial_flex_purchase', 'recurring_flex_payment'],
  'full-ownership': [
    'fo_outright_land',
    'fo_installment_land',
    'fo_recurring_land',
    'fo_outright_doc',
    'fo_doc_payment',
  ],
};

function resolveKindFilter(salesType: string, assetType: string): string[] | null {
  const bySales = salesType ? (SALES_TYPE_KINDS[salesType] ?? []) : null;
  const byAsset = assetType ? (ASSET_TYPE_KINDS[assetType] ?? []) : null;

  if (!bySales) return byAsset;
  if (!byAsset) return bySales;
  return bySales.filter((kind) => byAsset.includes(kind));
}

/** The two `purchase_kind: 'dev_levy'` kinds, i.e. GET /admin/transactions/documents. */
const DOCUMENT_KINDS = SALES_TYPE_KINDS.dp;

function byKind(rows: MockPurchase[], kinds: string[]): MockPurchase[] {
  return rows.filter((row) => kinds.includes(row.purchase_details?.transaction_kind ?? ''));
}

/**
 * Everything both transaction lists filter on. The kind narrowing differs
 * between them and stays at the call site.
 */
function applyCommonFilters(
  input: MockPurchase[],
  query: Record<string, unknown>
): MockPurchase[] {
  let rows = input;
  const status = String(query.status ?? '');
  const user = String(query.user ?? '');
  const paymentMethod = String(query.payment_method ?? '');
  const startDate = String(query.start_date ?? '');
  const endDate = String(query.end_date ?? '');
  const search = typeof query.search === 'string' ? query.search : '';

  if (status) rows = rows.filter((row) => row.status === status);
  if (user) rows = rows.filter((row) => row.user === user);
  if (paymentMethod) rows = rows.filter((row) => row.payment_method === paymentMethod);
  if (startDate) rows = rows.filter((row) => row.createdAt >= dayStart(startDate));
  if (endDate) rows = rows.filter((row) => row.createdAt <= dayEnd(endDate));

  if (search) {
    // The asset's name or location, OR the payer — the BE ORs both sides.
    const needle = search.trim().toLowerCase();
    rows = rows.filter((row) => {
      const asset = ASSETS[row.source_asset];
      const assetHit =
        !!asset &&
        (asset.name.toLowerCase().includes(needle) ||
          asset.asset_location.toLowerCase().includes(needle));

      const buyer = findPerson(row.user);
      const buyerHit = !!buyer && matchesPersonSearch(buyer, needle);

      return assetHit || buyerHit;
    });
  }

  return rows;
}

/** Both bounds are inclusive; a date-only value covers the whole day. */
const dayStart = (value: string) =>
  value.length === 10 ? `${value}T00:00:00.000Z` : value;
const dayEnd = (value: string) => (value.length === 10 ? `${value}T23:59:59.999Z` : value);

/**
 * `TX_POPULATE.adminTransactionList`, mirrored: the buyer with its nested
 * `referred_by`, and the asset with name + location. Nothing else — a mock that
 * volunteered more would hide a column that renders blank in production.
 */
function populate(row: MockPurchase) {
  const buyer = findPerson(row.user);
  const referrerId = REFERRED_BY[row.user] ?? null;
  const referrer = findPerson(referrerId);

  return {
    ...row,
    user: buyer
      ? {
          _id: buyer._id,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: buyer.email,
          referred_by: referrer
            ? { _id: referrer._id, firstName: referrer.firstName, lastName: referrer.lastName }
            : null,
        }
      : row.user,
    source_asset: ASSETS[row.source_asset] ?? row.source_asset,
  };
}

function requirePendingTransfer(id: string): MockPurchase {
  const row = purchases.find((candidate) => candidate._id === id);
  if (!row) throw new MockHttpError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');

  const kind = row.purchase_details?.transaction_kind ?? '';
  if (kind === 'fo_outright_doc') {
    throw new MockHttpError(
      409,
      'Approve the parent land transaction instead',
      'OUTRIGHT_SIBLING_REQUIRED'
    );
  }

  const isFlex = kind === 'initial_flex_purchase' || kind === 'recurring_flex_payment';
  const isFo =
    kind === 'fo_outright_land' ||
    kind === 'fo_installment_land' ||
    kind === 'fo_recurring_land' ||
    kind === 'fo_doc_payment';

  if ((!isFlex && !isFo) || row.payment_method !== 'transfer' || row.admin_status !== 'pending') {
    throw new MockHttpError(409, 'Not a pending transfer purchase', 'NOT_A_PENDING_TRANSFER');
  }
  return row;
}

function isFoKind(kind: string): boolean {
  return (
    kind === 'fo_outright_land' ||
    kind === 'fo_installment_land' ||
    kind === 'fo_recurring_land' ||
    kind === 'fo_outright_doc' ||
    kind === 'fo_doc_payment'
  );
}

function findOutrightSibling(row: MockPurchase): MockPurchase | null {
  const kind = row.purchase_details?.transaction_kind ?? '';
  const siblingKind = kind === 'fo_outright_land' ? 'fo_outright_doc' : kind === 'fo_outright_doc' ? 'fo_outright_land' : null;
  if (!siblingKind) return null;

  return (
    purchases.find(
      (candidate) =>
        candidate._id !== row._id &&
        candidate.user === row.user &&
        candidate.source_asset === row.source_asset &&
        candidate.purchase_details?.transaction_kind === siblingKind
    ) ?? null
  );
}

function requireFoPlan(id: string): MockFoPlan | NonNullable<ReturnType<typeof findCommercialPlan>> {
  const plan = foPlans[id] ?? findCommercialPlan(id);
  if (!plan) throw new MockHttpError(404, 'Payment plan not found', 'PAYMENT_PLAN_NOT_FOUND');
  return plan;
}

export const assetTransactionRoutes: MockRoutes = {
  /**
   * The all-transactions list. Only `type=purchase` rows live in this file —
   * withdrawals have their own fixtures; a request for another type returns
   * an empty page rather than lying with purchase rows.
   */
  'GET /admin/transactions': ({ query }) => {
    const type = String(query.type ?? '');
    if (type && type !== 'purchase') return paged([], query, 20);

    // Sales type and asset type narrow the same field; both given = intersection,
    // and an empty result is a legitimate combination (dp + flex).
    const kinds = resolveKindFilter(String(query.sales_type ?? ''), String(query.asset_type ?? ''));
    const rows = applyCommonFilters(kinds ? byKind(purchases, kinds) : purchases, query);

    return paged(rows.map(populate), query, 20);
  },

  /**
   * The document ledger. `AdminDocumentTransactionQueryDto` is the asset query
   * minus `sales_type` — the endpoint has already pinned the kind — so a
   * `sales_type` in the query string is ignored here rather than honoured.
   */
  'GET /admin/transactions/documents': ({ query }) => {
    const byAsset = resolveKindFilter('', String(query.asset_type ?? ''));
    const kinds = byAsset
      ? DOCUMENT_KINDS.filter((kind) => byAsset.includes(kind))
      : DOCUMENT_KINDS;
    const rows = applyCommonFilters(byKind(purchases, kinds), query);

    return paged(rows.map(populate), query, 20);
  },

  'GET /admin/fo/purchase/transactions/:txId': ({ params }) => {
    const row = purchases.find((candidate) => candidate._id === params.txId);
    if (!row) throw new MockHttpError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');

    const kind = row.purchase_details?.transaction_kind ?? '';
    if (!isFoKind(kind)) {
      throw new MockHttpError(409, 'Not a full-ownership purchase', 'NOT_AN_FO_TRANSACTION');
    }

    const sibling = findOutrightSibling(row);
    return {
      ...populate(row),
      sibling: sibling ? populate(sibling) : null,
    };
  },

  'POST /admin/acquisitions/transactions/:txId/approve': ({ params }) => {
    const row = requirePendingTransfer(params.txId);
    const kind = row.purchase_details?.transaction_kind ?? '';
    const isFlex = kind === 'initial_flex_purchase' || kind === 'recurring_flex_payment';
    const isInitial =
      kind === 'initial_flex_purchase' ||
      kind === 'fo_outright_land' ||
      kind === 'fo_installment_land';
    const planId = isInitial
      ? `665fpl00000000000000${isFlex ? 'p' : 'f'}${String(Date.now() % 100).padStart(2, '0')}`
      : (row.purchase_details?.payment_plan_id ??
        (isFlex ? '665fpl00000000000000pl99' : '665fpl00000000000000fo99'));

    row.status = 'completed';
    row.admin_status = 'approved';
    if (row.purchase_details) row.purchase_details.payment_plan_id = planId;
    if (!isFlex && isInitial) seedFoPlan(planId, row);

    if (kind === 'fo_outright_land') {
      const sibling = purchases.find(
        (candidate) =>
          candidate.purchase_details?.transaction_kind === 'fo_outright_doc' &&
          candidate.user === row.user &&
          candidate.source_asset === row.source_asset &&
          candidate.admin_status === 'pending'
      );
      if (sibling) {
        sibling.status = 'completed';
        sibling.admin_status = 'approved';
      }
    }

    return isFlex ? { payment_plan_id: planId } : { plan_id: planId };
  },

  'POST /admin/acquisitions/transactions/:txId/decline': ({ params, body: raw }) => {
    const row = requirePendingTransfer(params.txId);

    const dto = body<{ reason?: string }>(raw);
    const reason = (dto.reason ?? '').trim();
    if (reason.length < 20) {
      throw new MockHttpError(
        400,
        'DECLINE_REASON_TOO_SHORT: A decline reason of at least 20 characters is required',
        'VALIDATION_FAILED'
      );
    }

    const kind = row.purchase_details?.transaction_kind ?? '';
    const isFlex = kind === 'initial_flex_purchase' || kind === 'recurring_flex_payment';
    const isInitialFlex = kind === 'initial_flex_purchase';
    const isInitialLand = kind === 'fo_outright_land' || kind === 'fo_installment_land';
    row.status = 'failed';
    row.admin_status = 'declined';
    row.decline_reason = reason;

    if (kind === 'fo_outright_land') {
      const sibling = purchases.find(
        (candidate) =>
          candidate.purchase_details?.transaction_kind === 'fo_outright_doc' &&
          candidate.user === row.user &&
          candidate.source_asset === row.source_asset
      );
      if (sibling && sibling.admin_status === 'pending') {
        sibling.status = 'failed';
        sibling.admin_status = 'declined';
        sibling.decline_reason = reason;
      }
    }

    return {
      message: isFlex
        ? isInitialFlex
          ? 'Transfer purchase declined and units released.'
          : 'Recurring transfer payment declined.'
        : isInitialLand
          ? 'Full-ownership purchase declined and units released.'
          : 'Full-ownership payment declined.',
    };
  },

  'GET /admin/fo/purchase/payment-plans/:id': ({ params }) => requireFoPlan(params.id),

  'POST /admin/acquisitions/plans/:planId/suspend': ({ params, body: raw }) => {
    const plan = requireFoPlan(params.planId);
    const dto = body<{ reason?: string }>(raw);
    const reason = (dto.reason ?? '').trim();
    if (reason.length < 20) {
      throw new MockHttpError(
        400,
        'SUSPEND_REASON_TOO_SHORT: A reason of at least 20 characters is required',
        'VALIDATION_FAILED'
      );
    }
    if (plan.is_suspended) {
      throw new MockHttpError(409, 'Payment plan is already suspended', 'ALREADY_SUSPENDED');
    }
    plan.is_suspended = true;
    plan.suspend_reason = reason;
    return { message: 'Payment plan suspended.', _id: plan._id };
  },

  'POST /admin/acquisitions/plans/:planId/unsuspend': ({ params }) => {
    const plan = requireFoPlan(params.planId);
    if (!plan.is_suspended) {
      throw new MockHttpError(409, 'Payment plan is not suspended', 'NOT_SUSPENDED');
    }
    plan.is_suspended = false;
    plan.suspend_reason = null;
    plan.default_count = 0;
    return { message: 'Payment plan unsuspended.', _id: plan._id };
  },

  'POST /admin/acquisitions/plans/:planId/allocate': ({ params, body: raw }) => {
    const plan = requireFoPlan(params.planId);
    const dto = body<{ block?: string; plot?: string }>(raw);
    const block = (dto.block ?? '').trim();
    const plot = (dto.plot ?? '').trim();
    if (!block || !plot) {
      throw new MockHttpError(400, 'block and plot are required', 'VALIDATION_FAILED');
    }
    const wasAllocated = Boolean(plan.block && plan.plot);
    plan.block = block;
    plan.plot = plot;
    plan.allocation_status = wasAllocated ? 'reassigned' : 'allocated';
    plan.allocation_date = new Date().toISOString();
    return {
      message: wasAllocated
        ? `Reallocated to block ${block}, plot ${plot}.`
        : `Allocated block ${block}, plot ${plot}.`,
      _id: plan._id,
    };
  },
};
