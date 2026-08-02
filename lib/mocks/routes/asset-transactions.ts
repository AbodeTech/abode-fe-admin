import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Asset transactions mocks — GET /admin/transactions (purchase rows) and
 * the flex review pair under /admin/acquisitions/flex.
 *
 * Fixtures cover the states the page exists to render: a transfer-paid
 * initial purchase and a transfer-paid installment both awaiting review, a
 * Paystack purchase that confirmed itself, a wallet-paid installment, a
 * declined transfer, and an outright (full-payment) purchase. Refs are bare
 * ObjectIds, as the BE serves them (⛔ ticket 13).
 *
 * No full-ownership fixtures on purpose: the backend has no full-ownership
 * purchase flow, so such rows cannot exist. A mock that invented them would
 * disagree with every real environment.
 *
 * Money is decimal naira.
 * ============================================================ */

const USER_A = '665fcccc00000000000000c1';
const USER_B = '665fcccc00000000000000c2';
const USER_C = '665fcccc00000000000000c9';
const ASSET_AVIATION = '665faaaa00000000000000a1';
const ASSET_HARMONY = '665faaaa00000000000000a2';

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
];

function requirePendingTransfer(id: string): MockPurchase {
  const row = purchases.find((candidate) => candidate._id === id);
  if (!row) throw new MockHttpError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');

  const kind = row.purchase_details?.transaction_kind ?? '';
  const isFlex = kind === 'initial_flex_purchase' || kind === 'recurring_flex_payment';
  if (!isFlex || row.payment_method !== 'transfer' || row.admin_status !== 'pending') {
    throw new MockHttpError(409, 'Not a pending transfer purchase', 'NOT_A_PENDING_TRANSFER');
  }
  return row;
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

    let rows = purchases;
    const status = String(query.status ?? '');
    const user = String(query.user ?? '');
    if (status) rows = rows.filter((row) => row.status === status);
    if (user) rows = rows.filter((row) => row.user === user);

    return paged(rows, query, 20);
  },

  'POST /admin/acquisitions/flex/:txId/approve': ({ params }) => {
    const row = requirePendingTransfer(params.txId);

    const isInitial = row.purchase_details?.transaction_kind === 'initial_flex_purchase';
    const planId = isInitial
      ? `665fpl00000000000000p${String(Date.now() % 100).padStart(2, '0')}`
      : (row.purchase_details?.payment_plan_id ?? '665fpl00000000000000pl99');

    row.status = 'completed';
    row.admin_status = 'approved';
    if (row.purchase_details) row.purchase_details.payment_plan_id = planId;

    return { payment_plan_id: planId };
  },

  'POST /admin/acquisitions/flex/:txId/decline': ({ params, body: raw }) => {
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

    const isInitial = row.purchase_details?.transaction_kind === 'initial_flex_purchase';
    row.status = 'failed';
    row.admin_status = 'declined';
    row.decline_reason = reason;

    return {
      message: isInitial
        ? 'Transfer purchase declined and units released.'
        : 'Recurring transfer payment declined.',
    };
  },
};
