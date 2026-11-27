import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Recovery period mocks — /admin/recovery-windows/* (list, stats, record,
 * remind, terms, choice/decline, refund adjust|hold|release|approve).
 *
 * Mirrors abode-be-v2 recovery-window.service.ts / recovery-move.service.ts
 * response shapes. One customer per stage, using the design canvas's figures
 * (land price, 20% admin charge on the land price, FO default fee).
 * ============================================================ */

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();

type Stage =
  | 'open' | 'choice_sent' | 'terms_sent' | 'payment_pending' | 'moved'
  | 'refund_pending' | 'refund_on_hold' | 'ended_refund' | 'ended_no_refund' | 'cancelled';

type MockChoice = {
  asset_id: string;
  asset_type: string;
  asset_name: string;
  size_sqm: number;
  units: number;
  tenor_months: number | null;
  list_land_price: number;
  list_document_price: number;
  chosen_at: string;
  outcome: string | null;
  decline_note: string | null;
};

type MockOffer = {
  version: number;
  sent_at: string;
  sent_by: string;
  holds_until: string;
  status: string;
  is_counter: boolean;
  asset_id: string;
  asset_type: string;
  asset_name: string;
  size_sqm: number;
  units: number;
  land_price: number;
  tenor_months: number;
  document_price: number;
  document_tenor_months: number;
  payment_type: string | null;
  land_carry: number;
  document_carry: number;
  upfront_land: number;
  land_monthly: number;
  document_monthly: number;
  default_fee: number;
  default_fee_waived: boolean;
  change_fee: number;
  change_fee_waived: boolean;
  due_now: number;
  internal_reason: string;
  customer_note: string | null;
  accepted_at: string | null;
};

type MockEnding = ReturnType<typeof outcome> & {
  ended_at: string;
  refund_final: number | null;
  adjust_reason: string | null;
  hold_reason: string | null;
  approved_at: string | null;
  refund_transaction_id: string | null;
};

type MockWindow = {
  id: string;
  plan_id: string;
  user_id: string;
  stage: Stage;
  plan_type: 'flex' | 'full-ownership';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  asset_name: string;
  size_sqm: number;
  unique_asset_id: string;
  snapshot: {
    land_price: number;
    land_paid: number;
    land_balance: number;
    document_price: number;
    document_paid: number;
    default_fee_owed: number;
  };
  suspended_at: string;
  window_ends_at: string;
  reminders: { kind: string; sent_at: string; sent_by: string | null }[];
  choices: MockChoice[];
  offers: MockOffer[];
  move: Record<string, unknown> | null;
  ending: MockEnding | null;
  history: { action: string; actor_type: string; admin_id: string | null; reason: string | null; metadata: null; at: string }[];
  updated_at: string;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function outcome(w: Pick<MockWindow, 'plan_type' | 'snapshot'>) {
  const { land_price, land_paid, default_fee_owed } = w.snapshot;
  const share = (land_paid / land_price) * 100;
  if (share <= 30) {
    return {
      kind: 'no_refund' as const, no_refund_reason: 'at_or_below_threshold', land_price, land_paid,
      share_paid_pct: round2(share), admin_charge: 0, default_fee_deducted: 0,
      default_fee_waived: default_fee_owed, refund_amount: 0,
    };
  }
  const charge = round2(land_price * 0.2);
  const after = Math.max(0, land_paid - charge);
  const fee = w.plan_type === 'flex' ? 0 : Math.min(default_fee_owed, after);
  const refund = round2(after - fee);
  return {
    kind: refund > 0 ? ('refund' as const) : ('no_refund' as const),
    no_refund_reason: refund > 0 ? null : 'charges_exceed_paid',
    land_price, land_paid, share_paid_pct: round2(share), admin_charge: charge,
    default_fee_deducted: fee, default_fee_waived: round2((w.plan_type === 'flex' ? 0 : default_fee_owed) - fee),
    refund_amount: refund,
  };
}

const base = (over: Partial<MockWindow> & Pick<MockWindow, 'id' | 'customer_name' | 'stage'>): MockWindow => ({
  plan_id: `plan-${over.id}`,
  user_id: `user-${over.id}`,
  plan_type: 'full-ownership',
  customer_email: `${over.customer_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  customer_phone: '0805 ••• 1187',
  asset_name: 'Estate A',
  size_sqm: 500,
  unique_asset_id: `PP-${over.id}`,
  snapshot: { land_price: 12_000_000, land_paid: 7_200_000, land_balance: 4_800_000, document_price: 1_500_000, document_paid: 600_000, default_fee_owed: 840_000 },
  suspended_at: at(-42),
  window_ends_at: at(49),
  reminders: [{ kind: 'opened', sent_at: at(-42), sent_by: null }],
  choices: [],
  offers: [],
  move: null,
  ending: null,
  history: [{ action: 'recovery_window.opened', actor_type: 'system', admin_id: null, reason: null, metadata: null, at: at(-42) }],
  updated_at: at(-1),
  ...over,
});

const offer = (over: Partial<MockOffer> = {}): MockOffer => ({
  version: 1, sent_at: at(-2), sent_by: 'admin-1', holds_until: at(5), status: 'waiting', is_counter: false,
  asset_id: 'asset-b', asset_type: 'full-ownership', asset_name: 'Estate B', size_sqm: 300, units: 1,
  land_price: 8_300_000, tenor_months: 6, document_price: 1_200_000, document_tenor_months: 6,
  payment_type: 'all-inclusive', land_carry: 7_200_000, document_carry: 600_000, upfront_land: 0,
  land_monthly: 183_333.33, document_monthly: 100_000, default_fee: 840_000, default_fee_waived: false,
  change_fee: 100_000, change_fee_waived: false, due_now: 940_000,
  internal_reason: 'Their choice at the current Estate B price', customer_note: null, accepted_at: null,
  ...over,
});

const windows: MockWindow[] = [
  base({ id: 'rw-e', customer_name: 'Customer E', stage: 'open', asset_name: 'Estate B', size_sqm: 300,
    snapshot: { land_price: 8_400_000, land_paid: 2_100_000, land_balance: 6_300_000, document_price: 1_200_000, document_paid: 0, default_fee_owed: 420_000 },
    window_ends_at: at(10), reminders: [{ kind: 'opened', sent_at: at(-81), sent_by: null }, { kind: '30d', sent_at: at(-20), sent_by: null }, { kind: '14d', sent_at: at(-4), sent_by: null }] }),
  base({ id: 'rw-h', customer_name: 'Customer H', stage: 'choice_sent', asset_name: 'Estate C', size_sqm: 450,
    snapshot: { land_price: 9_000_000, land_paid: 5_000_000, land_balance: 4_000_000, document_price: 1_500_000, document_paid: 600_000, default_fee_owed: 800_000 },
    window_ends_at: at(63),
    choices: [{ asset_id: 'asset-b', asset_type: 'full-ownership', asset_name: 'Estate B', size_sqm: 300, units: 1, tenor_months: 6, list_land_price: 8_300_000, list_document_price: 1_200_000, chosen_at: at(-1), outcome: null, decline_note: null }] }),
  base({ id: 'rw-a', customer_name: 'Customer A', stage: 'terms_sent',
    choices: [{ asset_id: 'asset-b', asset_type: 'full-ownership', asset_name: 'Estate B', size_sqm: 300, units: 1, tenor_months: 6, list_land_price: 8_300_000, list_document_price: 1_200_000, chosen_at: at(-4), outcome: 'terms_sent', decline_note: null }],
    offers: [offer()] }),
  base({ id: 'rw-f', customer_name: 'Customer F', stage: 'payment_pending', asset_name: 'Estate D', size_sqm: 250,
    snapshot: { land_price: 7_500_000, land_paid: 4_500_000, land_balance: 3_000_000, document_price: 1_000_000, document_paid: 0, default_fee_owed: 600_000 },
    window_ends_at: at(26),
    offers: [offer({ asset_name: 'Estate A', size_sqm: 250, land_carry: 4_500_000, document_carry: 0, default_fee: 600_000, due_now: 700_000, status: 'payment_pending' })] }),
  base({ id: 'rw-b', customer_name: 'Customer B', stage: 'open', plan_type: 'flex', asset_name: 'Estate C', size_sqm: 450,
    snapshot: { land_price: 8_000_000, land_paid: 3_200_000, land_balance: 4_800_000, document_price: 0, document_paid: 0, default_fee_owed: 0 },
    window_ends_at: at(52) }),
  base({ id: 'rw-c', customer_name: 'Customer C', stage: 'refund_pending',
    snapshot: { land_price: 12_000_000, land_paid: 9_000_000, land_balance: 3_000_000, document_price: 1_500_000, document_paid: 900_000, default_fee_owed: 600_000 },
    suspended_at: at(-101), window_ends_at: at(-10) }),
  base({ id: 'rw-d', customer_name: 'Customer D', stage: 'moved', asset_name: 'Estate D', size_sqm: 250,
    snapshot: { land_price: 7_500_000, land_paid: 6_000_000, land_balance: 1_500_000, document_price: 1_000_000, document_paid: 0, default_fee_owed: 0 },
    move: { offer_version: 1, payment_transaction_id: 'tx-d', new_plan_id: 'plan-new-d', carry_over: 6_000_000, moved_at: at(-7) },
    offers: [offer({ status: 'accepted', accepted_at: at(-7), land_carry: 6_000_000, document_carry: 0 })] }),
  base({ id: 'rw-g', customer_name: 'Customer G', stage: 'ended_no_refund', plan_type: 'flex', asset_name: 'Estate C', size_sqm: 450,
    snapshot: { land_price: 7_500_000, land_paid: 1_500_000, land_balance: 6_000_000, document_price: 0, document_paid: 0, default_fee_owed: 0 },
    suspended_at: at(-120), window_ends_at: at(-28) }),
];

// The ended ones carry their frozen outcome, as the real end-of-window job leaves them.
for (const w of windows) {
  if (['refund_pending', 'ended_no_refund'].includes(w.stage)) {
    const o = outcome(w);
    w.ending = { ended_at: w.window_ends_at, ...o, refund_final: null, adjust_reason: null, hold_reason: null, approved_at: null, refund_transaction_id: null };
    w.history.push({ action: 'recovery_window.plan_ended', actor_type: 'system', admin_id: null, reason: null, metadata: null, at: w.window_ends_at });
  }
}

const PRE_END: Stage[] = ['open', 'choice_sent', 'terms_sent', 'payment_pending'];
// Not choice_sent: the customer is waiting on admin's terms (matches the backend).
const REMINDABLE: Stage[] = ['open', 'terms_sent'];

function daysLeft(w: MockWindow) {
  return PRE_END.includes(w.stage) ? Math.max(0, Math.ceil((Date.parse(w.window_ends_at) - Date.now()) / DAY)) : 0;
}

function row(w: MockWindow) {
  const last = [...w.reminders].sort((a, b) => b.sent_at.localeCompare(a.sent_at))[0] ?? null;
  const latestChoice = w.choices.at(-1);
  const latestOffer = w.offers.at(-1);
  return {
    id: w.id, plan_id: w.plan_id, user_id: w.user_id, stage: w.stage, plan_type: w.plan_type,
    customer_name: w.customer_name, customer_email: w.customer_email, customer_phone: w.customer_phone,
    asset_name: w.asset_name, size_sqm: w.size_sqm, unique_asset_id: w.unique_asset_id,
    land_price: w.snapshot.land_price, land_paid: w.snapshot.land_paid,
    share_paid_pct: w.ending?.share_paid_pct ?? round2((w.snapshot.land_paid / w.snapshot.land_price) * 100),
    default_fee_owed: w.snapshot.default_fee_owed, suspended_at: w.suspended_at, window_ends_at: w.window_ends_at,
    days_left: daysLeft(w), expected: PRE_END.includes(w.stage) ? outcome(w) : null,
    refund_amount: w.ending ? (w.ending.refund_final ?? w.ending.refund_amount) : null,
    refund_adjusted: w.ending?.refund_final != null, hold_reason: w.ending?.hold_reason ?? null,
    latest_choice: latestChoice
      ? { asset_name: latestChoice.asset_name, asset_type: latestChoice.asset_type, size_sqm: latestChoice.size_sqm, chosen_at: latestChoice.chosen_at, outcome: latestChoice.outcome }
      : null,
    latest_terms: latestOffer
      ? { version: latestOffer.version, status: latestOffer.status, asset_name: latestOffer.asset_name, size_sqm: latestOffer.size_sqm, due_now: latestOffer.due_now, holds_until: latestOffer.holds_until, is_counter: latestOffer.is_counter }
      : null,
    new_plan_id: (w.move?.new_plan_id as string) ?? null,
    can_remind: REMINDABLE.includes(w.stage),
    last_reminder: last ? { kind: last.kind, sent_at: last.sent_at } : null,
    updated_at: w.updated_at,
  };
}

function detail(w: MockWindow) {
  return {
    ...row(w),
    reminders: w.reminders, snapshot: w.snapshot, choices: w.choices, offers: w.offers, move: w.move,
    ending: w.ending, cancel_reason: null,
    plan: {
      id: w.plan_id, status: PRE_END.includes(w.stage) ? 'suspended' : 'closed', closure_kind: null,
      balance: w.snapshot.land_balance, amount_paid: w.snapshot.land_paid,
      default_fee: w.snapshot.default_fee_owed, default_fee_paid: 0, default_fee_waived: 0,
      default_fee_outstanding: w.snapshot.default_fee_owed, suspension_reason: 'Automatically suspended 28 days past tenor',
    },
    refund_transaction: w.ending?.refund_transaction_id ? { id: w.ending.refund_transaction_id, amount: w.ending.refund_final ?? w.ending.refund_amount, status: 'completed' } : null,
    refund_payout: payoutSummary(w),
    history: w.history,
  };
}

/* ---------- Refund payouts: Transactions › Refunds (refund-payout.service.ts) ---------- */

type PayoutStatus = 'pending' | 'processing' | 'retry_needed' | 'paid';
type MockPayout = {
  id: string;
  recovery_window_id: string;
  user_id: string;
  plan_id: string;
  plan_type: string;
  customer_name: string;
  customer_email: string;
  asset_name: string;
  size_sqm: number;
  ended_early: boolean;
  amount: number;
  status: PayoutStatus;
  method: 'paystack' | 'manual' | null;
  bank: { bank_name: string; account_number: string; account_name: string } | null;
  attempt: number;
  reference: string | null;
  provider_transfer_reference: string | null;
  manual_reference: string | null;
  manual_note: string | null;
  last_error: string | null;
  attempts: { reference: string; outcome: string; error_message: string | null; at: string }[];
  approved_at: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
};

const payouts: MockPayout[] = [];
const bankFor = (name: string) => ({ bank_name: 'GTBank', account_number: '0123456789', account_name: name.toUpperCase() });

function newPayout(w: MockWindow, over: Partial<MockPayout> = {}): MockPayout {
  const id = `rfp-mock-${payouts.length + 1}`;
  const p: MockPayout = {
    id, recovery_window_id: w.id, user_id: w.user_id, plan_id: w.plan_id, plan_type: w.plan_type,
    customer_name: w.customer_name, customer_email: w.customer_email, asset_name: w.asset_name, size_sqm: w.size_sqm,
    ended_early: false, amount: w.ending ? (w.ending.refund_final ?? w.ending.refund_amount) : 0,
    status: 'pending', method: null, bank: bankFor(w.customer_name), attempt: 1, reference: null,
    provider_transfer_reference: null, manual_reference: null, manual_note: null, last_error: null, attempts: [],
    approved_at: new Date().toISOString(), sent_at: null, paid_at: null, created_at: new Date().toISOString(),
    ...over,
  };
  payouts.unshift(p);
  return p;
}

function payoutSummary(w: MockWindow) {
  const p = payouts.find((x) => x.recovery_window_id === w.id);
  if (!p) return null;
  return {
    id: p.id, amount: p.amount, status: p.status, method: p.method,
    bank_name: p.bank?.bank_name ?? null, account_number: p.bank?.account_number ?? null,
    account_name: p.bank?.account_name ?? null, has_bank_details: !!p.bank,
    reference: p.manual_reference ?? p.reference, last_error: p.last_error, sent_at: p.sent_at, paid_at: p.paid_at,
  };
}

function findPayout(id: string) {
  const p = payouts.find((x) => x.id === id);
  if (!p) throw new MockHttpError(404, 'Refund payout not found', 'REFUND_PAYOUT_NOT_FOUND');
  return p;
}

function payoutHistory(p: MockPayout, action: string, reason: string) {
  const w = windows.find((x) => x.id === p.recovery_window_id);
  if (w) touch(w, action, reason);
}

function find(id: string) {
  const w = windows.find((x) => x.id === id);
  if (!w) throw new MockHttpError(404, 'Recovery window not found', 'RECOVERY_WINDOW_NOT_FOUND');
  return w;
}

function touch(w: MockWindow, action: string, reason: string | null = null) {
  w.updated_at = new Date().toISOString();
  w.history.push({ action, actor_type: 'admin', admin_id: 'admin-1', reason, metadata: null, at: w.updated_at });
}

const TABS: Record<string, (w: MockWindow) => boolean> = {
  window: (w) => PRE_END.includes(w.stage),
  ending: (w) => PRE_END.includes(w.stage) && daysLeft(w) <= 14,
  choices: (w) => w.stage === 'choice_sent',
  payment: (w) => w.stage === 'payment_pending',
  refund: (w) => w.stage === 'refund_pending' || w.stage === 'refund_on_hold',
  moved: (w) => w.stage === 'moved',
  ended: (w) => w.stage === 'ended_refund' || w.stage === 'ended_no_refund',
  cancelled: (w) => w.stage === 'cancelled',
};

type TermsBody = {
  asset_id: string;
  asset_type: string;
  size_sqm: number;
  units?: number;
  land_price: number;
  tenor_months: number;
  document_price?: number;
  document_tenor_months?: number;
  payment_type?: string;
  land_carry: number;
  document_carry?: number;
  upfront_land?: number;
  waive_default_fee?: boolean;
  change_fee?: number;
  waive_change_fee?: boolean;
  hold_days?: number;
  internal_reason: string;
  customer_note?: string;
};

const reasonOk = (reason: unknown) => {
  if (typeof reason !== 'string' || reason.trim().length < 15) {
    throw new MockHttpError(400, 'reason must be longer than or equal to 15 characters', 'VALIDATION_FAILED');
  }
};

export const recoveryWindowRoutes: MockRoutes = {
  'GET /admin/recovery-windows': ({ query }) => {
    const tab = String(query.tab ?? 'window');
    const q = String(query.search ?? '').trim().toLowerCase();
    let rows = windows.filter(TABS[tab] ?? TABS.window);
    if (q) {
      rows = rows.filter((w) =>
        [w.customer_name, w.customer_email, w.customer_phone, w.asset_name, w.unique_asset_id].some((v) => v.toLowerCase().includes(q))
      );
    }
    rows = [...rows].sort((a, b) => a.window_ends_at.localeCompare(b.window_ends_at));
    return paged(rows.map(row), query, 20);
  },

  'GET /admin/recovery-windows/stats': () => {
    const count = (tab: string) => windows.filter(TABS[tab]).length;
    return {
      tabs: {
        window: count('window'), ending: count('ending'), choices: count('choices'), payment: count('payment'),
        refund: count('refund'), moved: count('moved'), ended: count('ended'),
      },
      in_window_paid: windows.filter(TABS.window).reduce((s, w) => s + w.snapshot.land_paid, 0),
      refunds_to_approve: windows
        .filter((w) => w.stage === 'refund_pending')
        .reduce((s, w) => s + (w.ending?.refund_final ?? w.ending?.refund_amount ?? 0), 0),
    };
  },

  'GET /admin/recovery-windows/:id': ({ params }) => detail(find(params.id)),

  'POST /admin/recovery-windows/:id/remind': ({ params }) => {
    const w = find(params.id);
    if (!REMINDABLE.includes(w.stage)) throw new MockHttpError(400, 'Not remindable', 'RECOVERY_WINDOW_NOT_REMINDABLE');
    const recent = w.reminders.find((r) => r.kind === 'manual' && Date.now() - Date.parse(r.sent_at) < DAY);
    if (recent) throw new MockHttpError(409, 'Reminder sent recently', 'RECOVERY_REMINDER_SENT_RECENTLY');
    const now = new Date().toISOString();
    w.reminders.push({ kind: 'manual', sent_at: now, sent_by: 'admin-1' });
    touch(w, 'recovery_window.reminder_sent', 'Manual reminder');
    return { sent: true, sent_at: now };
  },

  'POST /admin/recovery-windows/:id/terms': ({ params, body: raw }) => {
    const w = find(params.id);
    const dto = body<TermsBody>(raw);
    if (!['open', 'choice_sent', 'terms_sent'].includes(w.stage)) {
      throw new MockHttpError(400, 'Not open', 'RECOVERY_WINDOW_NOT_OPEN');
    }
    reasonOk(dto.internal_reason);
    const paid = round2(w.snapshot.land_paid + w.snapshot.document_paid);
    const carry = round2(Number(dto.land_carry ?? 0) + Number(dto.document_carry ?? 0));
    if (carry !== paid) throw new MockHttpError(400, 'Carry-over mismatch', 'CARRY_OVER_MISMATCH');
    const choice = w.choices.at(-1);
    const isCounter = !choice || choice.asset_id !== dto.asset_id || choice.size_sqm !== dto.size_sqm || choice.asset_type !== dto.asset_type;
    if (isCounter && choice && !String(dto.customer_note ?? '').trim()) {
      throw new MockHttpError(400, 'Customer note required', 'CUSTOMER_NOTE_REQUIRED_FOR_A_DIFFERENT_OPTION');
    }
    const fee = dto.waive_default_fee ? 0 : w.snapshot.default_fee_owed;
    const change = dto.waive_change_fee ? 0 : Number(dto.change_fee ?? 100_000);
    const upfront = Number(dto.upfront_land ?? 0);
    const landLeft = round2(Number(dto.land_price) - Number(dto.land_carry) - upfront);
    for (const o of w.offers) if (o.status === 'waiting') o.status = 'replaced';
    if (choice && !choice.outcome) choice.outcome = 'terms_sent';
    const next = offer({
      version: (w.offers.at(-1)?.version ?? 0) + 1,
      sent_at: new Date().toISOString(),
      holds_until: at(Number(dto.hold_days ?? 7)),
      is_counter: isCounter,
      asset_id: dto.asset_id, asset_type: dto.asset_type, asset_name: 'Chosen estate', size_sqm: dto.size_sqm, units: dto.units ?? 1,
      land_price: dto.land_price, tenor_months: dto.tenor_months, document_price: dto.document_price ?? 0,
      document_tenor_months: dto.document_tenor_months ?? 0, payment_type: dto.payment_type ?? null,
      land_carry: dto.land_carry, document_carry: dto.document_carry ?? 0, upfront_land: upfront,
      land_monthly: landLeft > 0 ? round2(landLeft / Number(dto.tenor_months)) : 0,
      default_fee: w.snapshot.default_fee_owed, default_fee_waived: Boolean(dto.waive_default_fee),
      change_fee: Number(dto.change_fee ?? 100_000), change_fee_waived: Boolean(dto.waive_change_fee),
      due_now: round2(fee + change + upfront), internal_reason: dto.internal_reason, customer_note: dto.customer_note ?? null,
    });
    w.offers.push(next);
    w.stage = 'terms_sent';
    touch(w, 'recovery_window.terms_sent', dto.internal_reason);
    const view: Partial<MockOffer> = { ...next };
    delete view.internal_reason;
    delete view.sent_by;
    return { ...view, land_left_to_pay: landLeft, document_left_to_pay: round2((dto.document_price ?? 0) - (dto.document_carry ?? 0)) };
  },

  'POST /admin/recovery-windows/:id/choice/decline': ({ params, body: raw }) => {
    const w = find(params.id);
    const dto = body<{ customer_note: string; internal_reason: string }>(raw);
    if (w.stage !== 'choice_sent') throw new MockHttpError(400, 'No choice to answer', 'NO_CHOICE_TO_ANSWER');
    reasonOk(dto.internal_reason);
    const choice = w.choices.at(-1);
    if (!choice) throw new MockHttpError(400, 'No choice to answer', 'NO_CHOICE_TO_ANSWER');
    choice.outcome = 'declined';
    choice.decline_note = dto.customer_note;
    w.stage = 'open';
    touch(w, 'recovery_window.choice_declined', dto.internal_reason);
    return { stage: w.stage };
  },

  'POST /admin/recovery-windows/:id/refund/adjust': ({ params, body: raw }) => {
    const w = find(params.id);
    const dto = body<{ amount: number; reason: string }>(raw);
    if (!w.ending || !['refund_pending', 'refund_on_hold'].includes(w.stage)) throw new MockHttpError(400, 'Not open', 'REFUND_NOT_OPEN');
    reasonOk(dto.reason);
    if (!(dto.amount >= 0) || dto.amount > w.ending.land_paid) throw new MockHttpError(400, 'Out of range', 'REFUND_AMOUNT_OUT_OF_RANGE');
    w.ending.refund_final = dto.amount;
    w.ending.adjust_reason = dto.reason;
    touch(w, 'recovery_window.refund_adjusted', dto.reason);
    return detail(w);
  },

  'POST /admin/recovery-windows/:id/refund/hold': ({ params, body: raw }) => {
    const w = find(params.id);
    const dto = body<{ reason: string }>(raw);
    if (w.stage !== 'refund_pending' || !w.ending) throw new MockHttpError(400, 'Not pending', 'REFUND_NOT_PENDING');
    reasonOk(dto.reason);
    w.stage = 'refund_on_hold';
    w.ending.hold_reason = dto.reason;
    touch(w, 'recovery_window.refund_held', dto.reason);
    return detail(w);
  },

  'POST /admin/recovery-windows/:id/refund/release': ({ params, body: raw }) => {
    const w = find(params.id);
    const dto = body<{ reason: string }>(raw);
    if (w.stage !== 'refund_on_hold' || !w.ending) throw new MockHttpError(400, 'Not on hold', 'REFUND_NOT_ON_HOLD');
    reasonOk(dto.reason);
    w.stage = 'refund_pending';
    w.ending.hold_reason = null;
    touch(w, 'recovery_window.refund_released', dto.reason);
    return detail(w);
  },

  'POST /admin/recovery-windows/:id/refund/approve': ({ params }) => {
    const w = find(params.id);
    if (w.stage !== 'refund_pending' || !w.ending) throw new MockHttpError(400, 'Not pending', 'REFUND_NOT_PENDING');
    w.stage = 'ended_refund';
    w.ending.approved_at = new Date().toISOString();
    const p = newPayout(w);
    touch(w, 'recovery_window.refund_approved', `Refund of ${p.amount} approved, to be paid to the customer's bank`);
    return detail(w);
  },

  'GET /admin/refund-payouts': ({ query }) => {
    const q = String(query.search ?? '').trim().toLowerCase();
    let rows = payouts.filter((p) => !query.status || p.status === query.status);
    if (q) {
      rows = rows.filter((p) =>
        [p.customer_name, p.customer_email, p.asset_name, p.reference ?? '', p.manual_reference ?? ''].some((v) => v.toLowerCase().includes(q))
      );
    }
    return paged(rows, query, 20);
  },

  'GET /admin/refund-payouts/stats': () => {
    const sum = (s: PayoutStatus[]) => {
      const rows = payouts.filter((p) => s.includes(p.status));
      return { count: rows.length, amount: rows.reduce((t, p) => t + p.amount, 0) };
    };
    return {
      owed: sum(['pending', 'processing', 'retry_needed']),
      pending: sum(['pending']),
      processing: sum(['processing']),
      retry_needed: sum(['retry_needed']),
      paid: sum(['paid']),
    };
  },

  'GET /admin/refund-payouts/:id': ({ params }) => findPayout(params.id),

  // Mock Paystack: no webhook to wait for, so a send settles at once.
  'POST /admin/refund-payouts/:id/send': ({ params }) => {
    const p = findPayout(params.id);
    if (p.status !== 'pending' && p.status !== 'retry_needed') {
      throw new MockHttpError(400, 'Not sendable', 'REFUND_PAYOUT_NOT_SENDABLE');
    }
    if (!p.bank) throw new MockHttpError(400, 'No bank details', 'REFUND_PAYOUT_NO_BANK_DETAILS');
    const now = new Date().toISOString();
    p.reference = `rfp-${p.id}-${p.attempt}`;
    p.method = 'paystack';
    p.sent_at = now;
    p.status = 'paid';
    p.paid_at = now;
    p.last_error = null;
    p.attempts.push({ reference: p.reference, outcome: 'sent', error_message: null, at: now });
    payoutHistory(p, 'recovery_window.refund_paid', `Paid ${p.amount} to ${p.bank.bank_name}`);
    return p;
  },

  'POST /admin/refund-payouts/:id/mark-paid': ({ params, body: raw }) => {
    const p = findPayout(params.id);
    const dto = body<{ reference: string; note?: string }>(raw);
    if (p.status !== 'pending' && p.status !== 'retry_needed') {
      throw new MockHttpError(400, 'Not markable', 'REFUND_PAYOUT_NOT_MARKABLE');
    }
    p.status = 'paid';
    p.method = 'manual';
    p.manual_reference = dto.reference;
    p.manual_note = dto.note ?? null;
    p.paid_at = new Date().toISOString();
    payoutHistory(p, 'recovery_window.refund_marked_paid', `Paid by hand, reference ${dto.reference}`);
    return p;
  },
};

// Two example refunds already on the Refunds page: one paid, one that bounced.
for (const [id, name, status] of [
  ['rw-pay-1', 'Customer H', 'paid'],
  ['rw-pay-2', 'Customer I', 'retry_needed'],
] as const) {
  const w = base({ id, customer_name: name, stage: 'ended_refund', asset_name: 'Estate A', size_sqm: 300,
    snapshot: { land_price: 10_000_000, land_paid: 6_000_000, land_balance: 4_000_000, document_price: 1_500_000, document_paid: 500_000, default_fee_owed: 0 },
    suspended_at: at(-110), window_ends_at: at(-20) });
  w.ending = { ended_at: w.window_ends_at, ...outcome(w), refund_final: null, adjust_reason: null, hold_reason: null, approved_at: at(-15), refund_transaction_id: null };
  windows.push(w);
  newPayout(w, status === 'paid'
    ? { status, method: 'paystack', reference: `rfp-${id}-1`, sent_at: at(-14), paid_at: at(-14), approved_at: at(-15) }
    : { status, method: 'paystack', reference: `rfp-${id}-1`, attempt: 2, sent_at: at(-3), approved_at: at(-4),
        last_error: 'Account closed', attempts: [{ reference: `rfp-${id}-1`, outcome: 'failed', error_message: 'Account closed', at: at(-3) }] });
}
