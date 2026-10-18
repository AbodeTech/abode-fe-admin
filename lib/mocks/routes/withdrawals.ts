import { MockHttpError, type MockRoutes } from '../router';
import { findPerson, matchesPersonSearch } from './people';
import { body, paged } from './util';

/* ============================================================
 * Withdrawal queue mocks — /admin/withdrawals.
 *
 * Rows are wallet Transaction documents with type 'withdrawal'. Fixtures
 * cover every admin_status, both providers, and a rail_attempts history —
 * the states the queue exists to render.
 *
 * Fixtures store `user`, `bank_details_id` and `reviewed_by` as ids; the queue
 * route resolves them on the way out, mirroring
 * `findTransactionsPaginated(filter, page, limit, true)` — which populates as of
 * 2026-08-13 (ticket 13). Each is populated with **exactly** the fields the BE's
 * projection selects, no more: `user` → `firstName lastName email`,
 * `bank_details_id` → `bank_name account_number account_name`, `reviewed_by` →
 * `firstName lastName`.
 *
 * Note `user` here carries **no `phoneNumber`** even though the shared fixture
 * has one, because this endpoint's projection doesn't select it. Being more
 * generous than the backend is how a column gets built that works in mock mode
 * and renders blank in production.
 *
 * The single-row and action responses stay unpopulated, as the BE returns them.
 *
 * One special fixture: approving WD_RAIL_REFUSER always has the rail refuse
 * the transfer, so the "200 but no money moved" path — the one worth
 * testing most — is reachable in mock mode.
 *
 * Money is decimal naira.
 * ============================================================ */

const USER_A = '665fcccc00000000000000c1';
const USER_B = '665fcccc00000000000000c2';
const USER_C = '665fcccc00000000000000c9';
const BANK_A = '665fbbbb000000000000ba01';
const BANK_B = '665fbbbb000000000000ba02';

/**
 * What `.populate('bank_details_id', 'bank_name account_number account_name')`
 * resolves to. snake_case, matching the BE's projection — the schema also
 * accepts the camelCase spelling some BankDetails models use, but this endpoint
 * returns these names.
 */
const BANK_DETAILS: Record<string, object> = {
  [BANK_A]: {
    _id: BANK_A,
    bank_name: 'Guaranty Trust Bank',
    account_number: '0123456789',
    account_name: 'Okafor John Chukwuemeka',
  },
  [BANK_B]: {
    _id: BANK_B,
    bank_name: 'Zenith Bank',
    account_number: '2098765432',
    account_name: 'Eze Uche Daniel',
  },
};

/** The admin who reviewed a row — `.populate('reviewed_by', 'firstName lastName')`. */
const ADMIN_REF = {
  _id: '665fbbbb00000000000000bb',
  firstName: 'Tolu',
  lastName: 'Adeyemi',
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockWithdrawal = {
  _id: string;
  user: string;
  wallet: string;
  type: 'withdrawal';
  direction: 'debit';
  amount: number;
  fee_amount: number | null;
  total_debited: number | null;
  net_amount: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  admin_status:
    | 'pending'
    | 'auto-approved'
    | 'approved'
    | 'approved-retry-needed'
    | 'declined'
    | 'failed';
  payment_method: 'system';
  payment_provider: 'paystack' | 'paga' | null;
  provider_transfer_reference: string | null;
  rail_attempts: {
    provider: 'paystack' | 'paga';
    error: { code: string; message: string; retryable: boolean };
    attempted_at: string;
  }[];
  bank_details_id: string;
  withdrawal_reason: string | null;
  decline_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  processing_type: 'auto' | 'manual' | null;
  createdAt: string;
  updatedAt: string;
};

/** Approving this one always has the rail refuse — exercises the warning path. */
export const WD_RAIL_REFUSER = '665fee0000000000000000w2';

const base = {
  type: 'withdrawal' as const,
  direction: 'debit' as const,
  payment_method: 'system' as const,
  provider_transfer_reference: null,
  rail_attempts: [],
  withdrawal_reason: null,
  decline_reason: null,
  reviewed_by: null,
  reviewed_at: null,
  processing_type: null,
};

const withdrawals: MockWithdrawal[] = [
  {
    ...base,
    _id: '665fee0000000000000000w1',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 250_000,
    fee_amount: 100,
    total_debited: 250_100,
    net_amount: 250_000,
    status: 'pending',
    admin_status: 'pending',
    payment_provider: 'paystack',
    bank_details_id: BANK_A,
    withdrawal_reason: 'Monthly commission cash-out',
    createdAt: daysAgo(0.2),
    updatedAt: daysAgo(0.2),
  },
  {
    ...base,
    _id: WD_RAIL_REFUSER,
    user: USER_B,
    wallet: '665fdddd000000000000wa02',
    amount: 1_200_000,
    fee_amount: 100,
    total_debited: 1_200_100,
    net_amount: 1_200_000,
    status: 'pending',
    admin_status: 'pending',
    payment_provider: 'paystack',
    bank_details_id: BANK_B,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    ...base,
    _id: '665fee0000000000000000w3',
    user: USER_C,
    wallet: '665fdddd000000000000wa03',
    amount: 480_000,
    fee_amount: 100,
    total_debited: 480_100,
    net_amount: 480_000,
    status: 'pending',
    admin_status: 'approved-retry-needed',
    payment_provider: 'paga',
    bank_details_id: BANK_A,
    processing_type: 'manual',
    rail_attempts: [
      {
        provider: 'paystack',
        error: { code: 'INSUFFICIENT_FLOAT', message: 'Paystack balance too low for transfer', retryable: true },
        attempted_at: daysAgo(2),
      },
      {
        provider: 'paga',
        error: { code: 'PROVIDER_TIMEOUT', message: 'Paga did not respond within 30s', retryable: true },
        attempted_at: daysAgo(1.5),
      },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1.5),
  },
  {
    ...base,
    _id: '665fee0000000000000000w4',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 90_000,
    fee_amount: 100,
    total_debited: 90_100,
    net_amount: 90_000,
    status: 'processing',
    admin_status: 'approved',
    payment_provider: 'paystack',
    provider_transfer_reference: 'TRF_mock_8842',
    reviewed_by: '665fbbbb00000000000000bb',
    reviewed_at: daysAgo(0.5),
    processing_type: 'manual',
    bank_details_id: BANK_A,
    createdAt: daysAgo(1.2),
    updatedAt: daysAgo(0.5),
  },
  {
    ...base,
    _id: '665fee0000000000000000w5',
    user: USER_B,
    wallet: '665fdddd000000000000wa02',
    amount: 60_000,
    fee_amount: 100,
    total_debited: 60_100,
    net_amount: 60_000,
    status: 'completed',
    admin_status: 'auto-approved',
    payment_provider: 'paga',
    provider_transfer_reference: 'PGA_mock_1191',
    processing_type: 'auto',
    bank_details_id: BANK_B,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5.8),
  },
  {
    ...base,
    _id: '665fee0000000000000000w6',
    user: USER_C,
    wallet: '665fdddd000000000000wa03',
    amount: 2_000_000,
    fee_amount: 100,
    total_debited: 2_000_100,
    net_amount: 2_000_000,
    status: 'cancelled',
    admin_status: 'declined',
    payment_provider: 'paystack',
    decline_reason: 'Bank account name does not match the KYC name on file',
    reviewed_by: '665fbbbb00000000000000bb',
    reviewed_at: daysAgo(9),
    processing_type: 'manual',
    bank_details_id: BANK_A,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(9),
  },
  {
    ...base,
    _id: '665fee0000000000000000w7',
    user: USER_A,
    wallet: '665fdddd000000000000wa01',
    amount: 150_000,
    fee_amount: 100,
    total_debited: 150_100,
    net_amount: 150_000,
    status: 'failed',
    admin_status: 'failed',
    payment_provider: 'paga',
    provider_transfer_reference: 'PGA_mock_0473',
    processing_type: 'auto',
    bank_details_id: BANK_A,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(13),
  },
];

/**
 * Resolve the queue row's three refs, each with exactly its own BE projection.
 * An id with no fixture stays bare — how a ref to a deleted record behaves.
 */
function populate(row: MockWithdrawal) {
  const requester = findPerson(row.user);

  return {
    ...row,
    user: requester
      ? {
          _id: requester._id,
          firstName: requester.firstName,
          lastName: requester.lastName,
          email: requester.email,
          // No phoneNumber — this endpoint's projection doesn't select it.
          //
          // The TIN arrives through a nested hop (ticket 23): the BE keeps `kyc`
          // in the user projection so it can populate `kyc` with
          // `tin.value tin.state`. A person with no TIN on file gets an empty
          // artifact rather than a missing `kyc`, which is what an unsubmitted
          // KYC document looks like.
          kyc: { tin: requester.tin ?? { value: null, state: 'not_started' } },
        }
      : row.user,
    bank_details_id: BANK_DETAILS[row.bank_details_id] ?? row.bank_details_id,
    reviewed_by:
      row.reviewed_by && row.reviewed_by === ADMIN_REF._id ? ADMIN_REF : row.reviewed_by,
  };
}

function requireWithdrawal(id: string): MockWithdrawal {
  const row = withdrawals.find((candidate) => candidate._id === id);
  if (!row) throw new MockHttpError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
  return row;
}

function requireReason(raw: unknown): string {
  const dto = body<{ reason?: string }>(raw);
  const reason = (dto.reason ?? '').trim();
  if (reason.length < 20 || reason.length > 500) {
    throw new MockHttpError(
      400,
      'REASON_TOO_SHORT: reason must be between 20 and 500 characters',
      'VALIDATION_FAILED'
    );
  }
  return reason;
}

/** Mirrors `initiateRailTransfer` — bind and go, or record the refusal. */
function runRail(row: MockWithdrawal, overrideProvider?: 'paystack' | 'paga'): MockWithdrawal {
  if (overrideProvider) row.payment_provider = overrideProvider;
  const provider = row.payment_provider ?? 'paystack';

  if (row._id === WD_RAIL_REFUSER) {
    row.admin_status = 'approved-retry-needed';
    row.processing_type = 'manual';
    row.rail_attempts = [
      ...row.rail_attempts,
      {
        provider,
        error: { code: 'INSUFFICIENT_FLOAT', message: `${provider} balance too low for transfer`, retryable: true },
        attempted_at: new Date().toISOString(),
      },
    ];
    return row;
  }

  row.status = 'processing';
  row.admin_status = 'approved';
  row.processing_type = 'manual';
  row.provider_transfer_reference = `TRF_mock_${Date.now() % 100_000}`;
  row.reviewed_at = new Date().toISOString();
  return row;
}

/**
 * GET /admin/withdrawals/stats — derived from the same fixtures the queue
 * serves, so the cards and the rows below them always agree.
 *
 * Global on the real BE too: it takes a date range and ignores the queue's
 * filters, so this deliberately does not read `query`'s other params.
 */
function withdrawalStats() {
  const countBy = (predicate: (row: MockWithdrawal) => boolean) =>
    withdrawals.filter(predicate).length;

  const pending = withdrawals.filter((row) => row.admin_status === 'pending');

  return {
    pending_review_count: pending.length,
    pending_review_amount: pending.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    approved_count: countBy((row) => row.admin_status === 'approved'),
    rejected_count: countBy((row) => row.admin_status === 'declined'),
    // The auto rail stamps `processing_type` when the transfer is initiated and
    // it survives a later failure — which is what separates these two.
    auto_approved_count: countBy(
      (row) => row.admin_status === 'approved' && row.processing_type === 'auto',
    ),
    auto_failed_count: countBy(
      (row) => row.admin_status === 'failed' && row.processing_type === 'auto',
    ),
  };
}

export const withdrawalRoutes: MockRoutes = {
  'GET /admin/withdrawals/stats': () => withdrawalStats(),

  /**
   * GET /admin/wallets/stats — the users' wallet balance KPI.
   *
   * A FLAT FIXTURE, unlike every other number in this file: the mock layer has
   * no wallet documents to sum, so there is nothing to derive it from. It lives
   * here because the wallet and withdrawal routes are one BE module.
   */
  'GET /admin/wallets/stats': () => ({ users_wallet_balance: 84_200_000 }),

  'GET /admin/withdrawals': ({ query }) => {
    let rows: MockWithdrawal[] = withdrawals;
    const adminStatus = String(query.admin_status ?? '');
    const provider = String(query.payment_provider ?? '');
    const search = typeof query.search === 'string' ? query.search : '';
    if (adminStatus) rows = rows.filter((row) => row.admin_status === adminStatus);
    if (provider) rows = rows.filter((row) => row.payment_provider === provider);
    if (search) {
      // Requester only, matching `userRepo.findIdsBySearch`. The destination
      // account name is deliberately not searched — it isn't on the BE either,
      // so a mock that matched it would invent a capability.
      rows = rows.filter((row) => {
        const requester = findPerson(row.user);
        return requester ? matchesPersonSearch(requester, search) : false;
      });
    }

    return paged(rows.map(populate), query, 20);
  },

  'PATCH /admin/withdrawals/:id/approve': ({ params, body: raw }) => {
    const row = requireWithdrawal(params.id);
    if (row.type !== 'withdrawal') throw new MockHttpError(404, 'Not a withdrawal', 'WITHDRAWAL_NOT_FOUND');
    if (row.provider_transfer_reference) {
      throw new MockHttpError(409, 'A transfer is already bound to this transaction', 'TRANSACTION_ALREADY_BOUND');
    }

    const dto = body<{ override_provider?: 'paystack' | 'paga' }>(raw);
    return runRail(row, dto.override_provider);
  },

  'PATCH /admin/withdrawals/:id/decline': ({ params, body: raw }) => {
    const row = requireWithdrawal(params.id);
    if (row.provider_transfer_reference) {
      throw new MockHttpError(409, 'A transfer is already bound to this transaction', 'TRANSACTION_ALREADY_BOUND');
    }
    const reason = requireReason(raw);

    row.status = 'cancelled';
    row.admin_status = 'declined';
    row.decline_reason = reason;
    row.reviewed_at = new Date().toISOString();
    return { released: true };
  },

  'POST /admin/withdrawals/:id/retry': ({ params, body: raw }) => {
    const row = requireWithdrawal(params.id);
    if (row.admin_status !== 'approved-retry-needed') {
      throw new MockHttpError(409, 'Only approved-retry-needed withdrawals can be retried', 'INVALID_STATE_FOR_RETRY');
    }
    if (row.provider_transfer_reference) {
      throw new MockHttpError(409, 'A transfer is already bound to this transaction', 'TRANSACTION_ALREADY_BOUND');
    }
    const dto = body<{ reason?: string; override_provider?: 'paystack' | 'paga' }>(raw);
    requireReason(raw);
    return runRail(row, dto.override_provider);
  },
};
