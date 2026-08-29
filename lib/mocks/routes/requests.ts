import { MockHttpError, type MockRoutes } from '../router';
import { findPerson, matchesPersonSearch } from './people';
import { body } from './util';

/* ============================================================
 * Client requests mocks — /admin/requests/*.
 *
 * Responses are shaped like the BE's `ClientRequestView`: refs collapsed to
 * `{id, name, email}` (populated), one `*_details` block per type, admin
 * identities as bare ids. Every status and all three types are represented
 * so each row of the transition table can be exercised.
 *
 * The write routes enforce `VALID_TRANSITIONS` and the one type rule
 * (custom requests can't be system-approved), so a client that lets the
 * wrong action through hits the same refusal it would from the server.
 *
 * Fees are whole naira.
 * ============================================================ */

type Status = 'submitted' | 'under_review' | 'approved' | 'completed' | 'declined' | 'cancelled';
type PaymentStatus = 'not_applicable' | 'submitted' | 'verified' | 'refunded' | 'cancelled' | 'declined';
type RequestType = 'document_change' | 'asset_update' | 'custom_request';

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  submitted: ['under_review', 'approved', 'declined', 'cancelled'],
  under_review: ['approved', 'declined', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

const ADMIN_ID = '665fbbbb00000000000000bb';
const ASSET_AVIATION = { id: '665faaaa00000000000000a1', name: 'Aviation City' };
const ASSET_HARMONY = { id: '665faaaa00000000000000a2', name: 'Harmony Gardens' };

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const userRef = (id: string) => {
  const person = findPerson(id);
  return person
    ? { id, name: `${person.firstName} ${person.lastName}`, email: person.email }
    : { id };
};

type MockRequest = {
  id: string;
  request_id: string;
  _userId: string;
  request_type: RequestType;
  status: Status;
  document_change_details?: Record<string, unknown> | null;
  asset_update_details?: Record<string, unknown> | null;
  custom_request_details?: Record<string, unknown> | null;
  processing_fee: number;
  original_fee: number;
  discount_amount: number;
  coupon: string | null;
  coupon_code_snapshot: string | null;
  payment_status: PaymentStatus;
  payment_proof: Record<string, unknown> | null;
  processing_fee_transaction: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  approval_mode: 'system' | 'manual' | null;
  admin_notes: string | null;
  decline_reason: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  estimated_completion_hours: number | null;
  createdAt: string;
  updatedAt: string;
};

const blank = {
  coupon: null,
  coupon_code_snapshot: null,
  payment_proof: null,
  processing_fee_transaction: null,
  reviewed_by: null,
  reviewed_at: null,
  completed_by: null,
  completed_at: null,
  approval_mode: null,
  admin_notes: null,
  decline_reason: null,
  cancellation_reason: null,
  cancelled_by: null,
  cancelled_at: null,
  estimated_completion_hours: null,
};

const proof = (bank: string, ref: string, daysBack: number, verified: boolean) => ({
  bank_name: bank,
  reference_number: ref,
  proof_image_url: `https://res.cloudinary.com/demo/image/upload/${ref}.jpg`,
  submitted_at: daysAgo(daysBack),
  verified_at: verified ? daysAgo(daysBack - 0.5) : null,
  verified_by: verified ? ADMIN_ID : null,
});

const requests: MockRequest[] = [
  // ── document change ──
  {
    ...blank,
    id: '665frq00000000000000r001',
    request_id: 'DCR-373829',
    _userId: '665fcccc00000000000000c1',
    request_type: 'document_change',
    status: 'submitted',
    document_change_details: {
      asset: ASSET_AVIATION,
      unique_asset_id: 'AVC-300-0042',
      asset_name_snapshot: 'Aviation City',
      document_type: 'Deed of assignment',
      current_name: 'John Okafor',
      current_address: '14 Adeola Odeku St, Victoria Island',
      new_name: 'John Chukwuemeka Okafor',
      new_address: '14 Adeola Odeku St, Victoria Island',
      reason_for_change: 'Adding my middle name to match my international passport for the visa application.',
    },
    processing_fee: 20_000,
    original_fee: 20_000,
    discount_amount: 0,
    payment_status: 'verified',
    payment_proof: proof('Guaranty Trust Bank', 'GTB-DCR-88213', 1.2, true),
    processing_fee_transaction: '665ftx000000000000000t01',
    createdAt: daysAgo(1.2),
    updatedAt: daysAgo(0.7),
  },
  {
    ...blank,
    id: '665frq00000000000000r002',
    request_id: 'DCR-518204',
    _userId: '665fcccc00000000000000c2',
    request_type: 'document_change',
    status: 'under_review',
    document_change_details: {
      asset: ASSET_HARMONY,
      unique_asset_id: 'HRG-500-0011',
      asset_name_snapshot: 'Harmony Gardens',
      document_type: 'Survey plan',
      current_name: 'Uche Eze',
      current_address: '7 Ring Road, Ibadan',
      new_name: 'Uche Eze',
      new_address: 'Plot 22 Gwarinpa Estate, Abuja',
      reason_for_change: 'Relocated to Abuja last quarter; documents should carry the current address.',
    },
    processing_fee: 15_000,
    original_fee: 20_000,
    discount_amount: 5_000,
    coupon: '665fcp000000000000000cp1',
    coupon_code_snapshot: 'LOYAL25',
    payment_status: 'submitted',
    payment_proof: proof('Access Bank', 'ACC-DCR-11982', 3, false),
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(2),
    admin_notes: 'Awaiting bank confirmation of the transfer before approving.',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    ...blank,
    id: '665frq00000000000000r003',
    request_id: 'DCR-902117',
    _userId: '665fcccc00000000000000c3',
    request_type: 'document_change',
    status: 'completed',
    document_change_details: {
      asset: ASSET_AVIATION,
      unique_asset_id: 'AVC-500-0007',
      asset_name_snapshot: 'Aviation City',
      document_type: 'Contract of sales',
      current_name: 'Ada Nwosu',
      current_address: '3 Bode Thomas St, Surulere',
      new_name: 'Ada Nwosu-Bello',
      new_address: '3 Bode Thomas St, Surulere',
      reason_for_change: 'Name change following marriage — certificate attached to the original submission.',
    },
    processing_fee: 20_000,
    original_fee: 20_000,
    discount_amount: 0,
    payment_status: 'verified',
    payment_proof: proof('Zenith Bank', 'ZEN-DCR-55120', 9, true),
    processing_fee_transaction: '665ftx000000000000000t03',
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(8),
    completed_by: ADMIN_ID,
    completed_at: daysAgo(7.5),
    approval_mode: 'system',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(7.5),
  },
  // ── asset update ──
  {
    ...blank,
    id: '665frq00000000000000r004',
    request_id: 'AUR-864002',
    _userId: '665fcccc00000000000000c4',
    request_type: 'asset_update',
    status: 'submitted',
    asset_update_details: {
      asset: ASSET_HARMONY,
      unique_asset_id: 'HRG-300-0093',
      asset_name_snapshot: 'Harmony Gardens',
      update_type: 'size',
      current_size: 300,
      current_units: 1,
      new_size: 500,
      new_units: 1,
      reason_for_update: 'Upsizing to 500sqm — the 300 plot is too small for the duplex design we settled on.',
      computed_new_total_price: 12_000_000,
      computed_price_delta: 4_800_000,
    },
    processing_fee: 100_000,
    original_fee: 100_000,
    discount_amount: 0,
    payment_status: 'verified',
    payment_proof: proof('First Bank', 'FBN-AUR-40711', 0.5, true),
    processing_fee_transaction: '665ftx000000000000000t04',
    createdAt: daysAgo(0.5),
    updatedAt: daysAgo(0.3),
  },
  {
    ...blank,
    id: '665frq00000000000000r005',
    request_id: 'AUR-140556',
    _userId: '665fcccc00000000000000c5',
    request_type: 'asset_update',
    status: 'approved',
    asset_update_details: {
      asset: ASSET_AVIATION,
      unique_asset_id: 'AVC-300-0118',
      asset_name_snapshot: 'Aviation City',
      update_type: 'units',
      current_size: 300,
      current_units: 2,
      new_size: 300,
      new_units: 3,
      reason_for_update: 'Adding a third unit for my brother who wants to build alongside — same size, same block.',
      computed_new_total_price: 21_600_000,
      computed_price_delta: 7_200_000,
    },
    processing_fee: 100_000,
    original_fee: 100_000,
    discount_amount: 0,
    payment_status: 'verified',
    payment_proof: proof('UBA', 'UBA-AUR-22308', 5, true),
    processing_fee_transaction: '665ftx000000000000000t05',
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(4),
    approval_mode: 'manual',
    estimated_completion_hours: 72,
    admin_notes: 'Adjacent unit needs the block layout re-drawn — surveyor booked for Thursday.',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
  },
  {
    ...blank,
    id: '665frq00000000000000r006',
    request_id: 'AUR-773390',
    _userId: '665fcccc00000000000000c6',
    request_type: 'asset_update',
    status: 'declined',
    asset_update_details: {
      asset: ASSET_HARMONY,
      unique_asset_id: 'HRG-1000-0004',
      asset_name_snapshot: 'Harmony Gardens',
      update_type: 'size',
      current_size: 1000,
      current_units: 1,
      new_size: 300,
      new_units: 1,
      reason_for_update: 'Downsizing — finances have changed and I want to keep only what I can complete.',
      computed_new_total_price: 7_200_000,
      computed_price_delta: -16_800_000,
    },
    processing_fee: 100_000,
    original_fee: 100_000,
    discount_amount: 0,
    payment_status: 'declined',
    payment_proof: proof('Sterling Bank', 'STB-AUR-90015', 12, false),
    reviewed_by: ADMIN_ID,
    reviewed_at: daysAgo(11),
    decline_reason:
      'The 1000sqm plot has 4 instalments already paid against it; a downsize with refund is handled by the resale desk, not as an asset update. Please contact support to open a resale.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(11),
  },
  // ── custom ──
  {
    ...blank,
    id: '665frq00000000000000r007',
    request_id: 'CRR-215648',
    _userId: '665fcccc00000000000000c9',
    request_type: 'custom_request',
    status: 'submitted',
    custom_request_details: {
      title: 'Statement of account for mortgage application',
      description:
        'My bank needs a stamped statement showing all payments made on my Aviation City plan to date, on company letterhead. Deadline is next Friday.',
      category: 'documentation',
      related_asset: ASSET_AVIATION,
      related_asset_name_snapshot: 'Aviation City',
      attachments: ['https://res.cloudinary.com/demo/image/upload/bank-request-letter.pdf'],
    },
    processing_fee: 0,
    original_fee: 0,
    discount_amount: 0,
    payment_status: 'not_applicable',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    ...blank,
    id: '665frq00000000000000r008',
    request_id: 'CRR-660931',
    _userId: '665fcccc00000000000000c1',
    request_type: 'custom_request',
    status: 'cancelled',
    custom_request_details: {
      title: 'Site visit for family',
      description: 'Would like to bring my parents to see the Harmony Gardens site on a weekend.',
      category: 'property',
      related_asset: ASSET_HARMONY,
      related_asset_name_snapshot: 'Harmony Gardens',
      attachments: [],
    },
    processing_fee: 0,
    original_fee: 0,
    discount_amount: 0,
    payment_status: 'not_applicable',
    cancellation_reason: 'User rescheduled through the site-visit booking flow instead — no longer needed as a request.',
    cancelled_by: ADMIN_ID,
    cancelled_at: daysAgo(6),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
  },
];

/** The wire shape — `_userId` swapped for a populated `user` ref. */
const view = ({ _userId, ...rest }: MockRequest) => ({ ...rest, user: userRef(_userId) });

/**
 * Keyed on `request_id` ONLY — `findOne({ request_id })` is the backend's
 * sole lookup. This mock used to accept the Mongo `id` too, which let the
 * FE send the wrong field and pass in mock mode while 404ing for real.
 * A mock that is looser than the server hides exactly the bug it should
 * catch.
 */
function requireRequest(requestId: string): MockRequest {
  const row = requests.find((candidate) => candidate.request_id === requestId);
  if (!row) throw new MockHttpError(404, 'That request does not exist', 'REQUEST_NOT_FOUND');
  return row;
}

function requireTransition(row: MockRequest, to: Status): void {
  if (!VALID_TRANSITIONS[row.status].includes(to)) {
    throw new MockHttpError(
      409,
      `Cannot move a ${row.status} request to ${to}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

function requireReason(value: unknown, field: string): string {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (reason.length < 20 || reason.length > 2000) {
    throw new MockHttpError(400, `${field} must be between 20 and 2000 characters`, 'VALIDATION_FAILED');
  }
  return reason;
}

function analyticsFor(rows: MockRequest[]) {
  const count = (status: Status) => rows.filter((row) => row.status === status).length;
  const sum = (predicate: (row: MockRequest) => boolean) =>
    rows.filter(predicate).reduce((total, row) => total + row.processing_fee, 0);
  return {
    total_requests: rows.length,
    submitted_requests: count('submitted'),
    under_review_requests: count('under_review'),
    approved_requests: count('approved'),
    completed_requests: count('completed'),
    declined_requests: count('declined'),
    cancelled_requests: count('cancelled'),
    total_processing_fees: sum(() => true),
    fees_collected: sum((row) => row.payment_status === 'verified'),
    fees_pending_verification: sum((row) => row.payment_status === 'submitted'),
    fees_refunded: sum((row) => row.payment_status === 'refunded'),
  };
}

function inRange(row: MockRequest, from?: string, to?: string): boolean {
  const created = new Date(row.createdAt).getTime();
  if (from && created < new Date(from).getTime()) return false;
  if (to && created > new Date(to).getTime() + 86_400_000) return false;
  return true;
}

export const requestRoutes: MockRoutes = {
  /** Declared before `:request_id`, like the BE — a literal after a param would be swallowed. */
  'GET /admin/requests/statistics': ({ query }) => {
    const from = query.date_from ? String(query.date_from) : undefined;
    const to = query.date_to ? String(query.date_to) : undefined;
    const rows = requests.filter((row) => inRange(row, from, to));
    const a = analyticsFor(rows);
    const ofType = (type: RequestType) => rows.filter((row) => row.request_type === type);
    const pendingOf = (type: RequestType) => ofType(type).filter((row) => row.status === 'submitted').length;

    return {
      total_requests: a.total_requests,
      submitted_requests: a.submitted_requests,
      under_review_requests: a.under_review_requests,
      approved_requests: a.approved_requests,
      completed_requests: a.completed_requests,
      declined_requests: a.declined_requests,
      cancelled_requests: a.cancelled_requests,
      document_change_requests: ofType('document_change').length,
      asset_update_requests: ofType('asset_update').length,
      custom_requests: ofType('custom_request').length,
      pending_document_change: pendingOf('document_change'),
      pending_asset_update: pendingOf('asset_update'),
      pending_custom: pendingOf('custom_request'),
      paid_requests: rows.filter((row) => row.payment_status === 'verified').length,
      unpaid_requests: rows.filter((row) => row.payment_status === 'submitted').length,
      refunded_requests: rows.filter((row) => row.payment_status === 'refunded').length,
      total_fees_collected: a.fees_collected,
      total_fees_pending_verification: a.fees_pending_verification,
      total_fees_refunded: a.fees_refunded,
    };
  },

  'GET /admin/requests': ({ query }) => {
    let rows = requests;
    const status = String(query.status ?? '');
    const type = String(query.request_type ?? '');
    const payment = String(query.payment_status ?? '');
    const search = String(query.search ?? '').trim();
    const from = query.date_from ? String(query.date_from) : undefined;
    const to = query.date_to ? String(query.date_to) : undefined;

    if (status) rows = rows.filter((row) => row.status === status);
    if (type) rows = rows.filter((row) => row.request_type === type);
    if (payment) rows = rows.filter((row) => row.payment_status === payment);
    if (from || to) rows = rows.filter((row) => inRange(row, from, to));
    if (search) {
      const needle = search.toLowerCase();
      rows = rows.filter((row) => {
        if (row.request_id.toLowerCase().includes(needle)) return true;
        const person = findPerson(row._userId);
        return person ? matchesPersonSearch(person, search) : false;
      });
    }

    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25) || 25));
    const start = (page - 1) * limit;

    // Newest first, like the BE.
    const sorted = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      requests: sorted.slice(start, start + limit).map(view),
      total: rows.length,
      page,
      limit,
      analytics: analyticsFor(rows),
    };
  },

  'GET /admin/requests/:request_id': ({ params }) => view(requireRequest(params.request_id)),

  'PATCH /admin/requests/:request_id/review': ({ params, body: raw }) => {
    const row = requireRequest(params.request_id);
    requireTransition(row, 'under_review');
    const dto = body<{ admin_notes?: string }>(raw);
    row.status = 'under_review';
    row.reviewed_by = ADMIN_ID;
    row.reviewed_at = new Date().toISOString();
    if (dto.admin_notes) row.admin_notes = dto.admin_notes;
    row.updatedAt = new Date().toISOString();
    return view(row);
  },

  'POST /admin/requests/:request_id/approve': ({ params, body: raw }) => {
    const row = requireRequest(params.request_id);
    requireTransition(row, 'approved');
    const dto = body<{ mode?: 'system' | 'manual'; admin_notes?: string; estimated_completion_hours?: number }>(raw);
    if (dto.mode !== 'system' && dto.mode !== 'manual') {
      throw new MockHttpError(400, 'mode must be system or manual', 'VALIDATION_FAILED');
    }
    if (dto.mode === 'system' && row.request_type === 'custom_request') {
      throw new MockHttpError(400, 'Custom requests cannot be system-approved', 'CUSTOM_REQUEST_NOT_SYSTEM_APPROVABLE');
    }

    const now = new Date().toISOString();
    row.approval_mode = dto.mode;
    row.reviewed_by = row.reviewed_by ?? ADMIN_ID;
    row.reviewed_at = row.reviewed_at ?? now;
    if (dto.admin_notes) row.admin_notes = dto.admin_notes;

    if (dto.mode === 'system') {
      row.status = 'completed';
      row.completed_by = ADMIN_ID;
      row.completed_at = now;
    } else {
      row.status = 'approved';
      row.estimated_completion_hours = dto.estimated_completion_hours ?? 72;
    }
    row.updatedAt = now;
    return view(row);
  },

  'PATCH /admin/requests/:request_id/complete': ({ params, body: raw }) => {
    const row = requireRequest(params.request_id);
    requireTransition(row, 'completed');
    const dto = body<{ admin_notes?: string }>(raw);
    const now = new Date().toISOString();
    row.status = 'completed';
    row.completed_by = ADMIN_ID;
    row.completed_at = now;
    if (dto.admin_notes) row.admin_notes = dto.admin_notes;
    row.updatedAt = now;
    return view(row);
  },

  'PATCH /admin/requests/:request_id/decline': ({ params, body: raw }) => {
    const row = requireRequest(params.request_id);
    requireTransition(row, 'declined');
    const dto = body<{ decline_reason?: string; admin_notes?: string }>(raw);
    const reason = requireReason(dto.decline_reason, 'decline_reason');
    const now = new Date().toISOString();
    row.status = 'declined';
    row.decline_reason = reason;
    row.reviewed_by = row.reviewed_by ?? ADMIN_ID;
    row.reviewed_at = row.reviewed_at ?? now;
    if (row.payment_status === 'submitted') row.payment_status = 'declined';
    if (dto.admin_notes) row.admin_notes = dto.admin_notes;
    row.updatedAt = now;
    return view(row);
  },

  /** The only path that refunds a verified fee. */
  'PATCH /admin/requests/:request_id/cancel': ({ params, body: raw }) => {
    const row = requireRequest(params.request_id);
    requireTransition(row, 'cancelled');
    const dto = body<{ reason?: string }>(raw);
    const reason = requireReason(dto.reason, 'reason');
    const now = new Date().toISOString();
    row.status = 'cancelled';
    row.cancellation_reason = reason;
    row.cancelled_by = ADMIN_ID;
    row.cancelled_at = now;
    if (row.payment_status === 'verified') row.payment_status = 'refunded';
    else if (row.payment_status === 'submitted') row.payment_status = 'cancelled';
    row.updatedAt = now;
    return view(row);
  },
};
