import { MockHttpError, type MockRoutes } from '../router';
import { findAdmin, type MockAdmin } from './cs-managers';
import { body } from './util';

/* ============================================================
 * Financial Officers mocks — /admin/financial-officers/*.
 *
 * 🚧 No BE module exists; this is the FE's proposed contract (see
 * features/financial-officers/schemas and docs/BACKEND-REQUESTS.md #33).
 *
 * Simplifications a real BE must not copy:
 * - Approval stats are fixed fixture numbers, not an aggregation over
 *   decisions. The recent-decisions list is illustrative.
 * - "Recovered this period" is the trailing 30 days, not the requested
 *   calendar month, so the page never reads empty on the 1st.
 * - Recovery follows the plan's CURRENT officer. The BE must attribute each
 *   payment to whoever held the plan when it was paid (assignment window), so
 *   a reassignment or a demotion never moves money already recovered.
 * - Officers are admins from the cs-managers fixture (`GET /admin/admins` is
 *   registered there), so the promote picker and the dashboard agree on names.
 * ============================================================ */

const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY).toISOString();

/** Monday of last week at hh:mm, shifted by `offsetDays` — so weekday-specific fixtures stay in the past. */
const lastWeek = (offsetDays: number, hh: number, mm: number) => {
  const d = new Date();
  const sinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sinceMonday - 7 + offsetDays);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

const APPROVAL_TARGET_HOURS = 24;

const toAdminMin = (a: MockAdmin | undefined) =>
  a
    ? { id: a._id, user_name: a.userName, first_name: a.firstName, last_name: a.lastName, email: a.email, role: a.role }
    : null;

/* -------------------- fixtures -------------------- */

type Stats = {
  decided: number;
  approved: number;
  declined: number;
  avg_hours: number | null;
  median_hours: number | null;
  slowest: { hours: number; customer_name: string; submitted_at: string } | null;
};

type Decision = {
  id: string;
  kind: 'asset' | 'associate_pro';
  label: string;
  customer_name: string;
  amount: number;
  submitted_at: string;
  decided_at: string;
  hours_counted: number;
  outcome: 'approved' | 'declined';
};

type MockOfficer = {
  _id: string;
  adminId: string;
  assigned_from: string;
  asset: Stats;
  pro: Stats;
  decisions: Decision[];
};

const O1 = '665fadmn00000000000000d4';
const O2 = '665fadmn00000000000000d5';
const O3 = '665fadmn00000000000000d3';

const noStats = (): Stats => ({ decided: 0, approved: 0, declined: 0, avg_hours: null, median_hours: null, slowest: null });

const officers: MockOfficer[] = [
  {
    _id: '665ffino00000000000000a1',
    adminId: O1,
    assigned_from: daysAgo(260),
    asset: { decided: 142, approved: 128, declined: 14, avg_hours: 8.6, median_hours: 5.1, slowest: { hours: 30.3, customer_name: 'Zainab Aliyu', submitted_at: lastWeek(1, 8, 30) } },
    pro: { decided: 38, approved: 35, declined: 3, avg_hours: 14.2, median_hours: 11.0, slowest: { hours: 29.5, customer_name: 'Obinna Uche', submitted_at: lastWeek(3, 10, 0) } },
    decisions: [
      { id: 'fod1', kind: 'asset', label: 'Flex installment', customer_name: 'Kemi Salako', amount: 450_000, submitted_at: lastWeek(7, 9, 12), decided_at: lastWeek(7, 11, 40), hours_counted: 2.5, outcome: 'approved' },
      { id: 'fod2', kind: 'associate_pro', label: 'Upgrade', customer_name: 'Yusuf Danjuma', amount: 50_000, submitted_at: lastWeek(4, 17, 10), decided_at: lastWeek(7, 10, 5), hours_counted: 16.9, outcome: 'approved' },
      { id: 'fod3', kind: 'asset', label: 'Flex installment', customer_name: 'Grace Etim', amount: 300_000, submitted_at: lastWeek(5, 11, 0), decided_at: lastWeek(7, 8, 15), hours_counted: 8.3, outcome: 'approved' },
      { id: 'fod4', kind: 'associate_pro', label: 'Upgrade', customer_name: 'Obinna Uche', amount: 50_000, submitted_at: lastWeek(3, 10, 0), decided_at: lastWeek(4, 15, 30), hours_counted: 29.5, outcome: 'approved' },
      { id: 'fod5', kind: 'asset', label: 'Commercial outright', customer_name: 'Femi Ojo', amount: 1_200_000, submitted_at: lastWeek(2, 13, 0), decided_at: lastWeek(2, 16, 20), hours_counted: 3.3, outcome: 'declined' },
      { id: 'fod6', kind: 'asset', label: 'Full ownership installment', customer_name: 'Zainab Aliyu', amount: 2_400_000, submitted_at: lastWeek(1, 8, 30), decided_at: lastWeek(2, 14, 45), hours_counted: 30.3, outcome: 'approved' },
    ],
  },
  {
    _id: '665ffino00000000000000a2',
    adminId: O2,
    assigned_from: daysAgo(200),
    asset: { decided: 118, approved: 109, declined: 9, avg_hours: 11.4, median_hours: 7.9, slowest: { hours: 41.2, customer_name: 'Segun Afolabi', submitted_at: lastWeek(0, 9, 0) } },
    pro: { decided: 32, approved: 30, declined: 2, avg_hours: 17.0, median_hours: 13.5, slowest: { hours: 36.0, customer_name: 'Ada Nwosu', submitted_at: lastWeek(2, 12, 0) } },
    decisions: [
      { id: 'fod7', kind: 'asset', label: 'Commercial installment', customer_name: 'Segun Afolabi', amount: 1_400_000, submitted_at: lastWeek(0, 9, 0), decided_at: lastWeek(1, 15, 12), hours_counted: 30.2, outcome: 'approved' },
      { id: 'fod8', kind: 'associate_pro', label: 'Upgrade', customer_name: 'Ada Nwosu', amount: 50_000, submitted_at: lastWeek(2, 12, 0), decided_at: lastWeek(4, 0, 0), hours_counted: 36.0, outcome: 'approved' },
      { id: 'fod9', kind: 'asset', label: 'Flex installment', customer_name: 'Chioma Nnadi', amount: 600_000, submitted_at: lastWeek(3, 8, 0), decided_at: lastWeek(3, 17, 54), hours_counted: 9.9, outcome: 'approved' },
    ],
  },
  {
    _id: '665ffino00000000000000a3',
    adminId: O3,
    assigned_from: daysAgo(90),
    asset: { decided: 104, approved: 97, declined: 7, avg_hours: 6.8, median_hours: 4.4, slowest: { hours: 22.9, customer_name: 'Hauwa Garba', submitted_at: lastWeek(1, 9, 0) } },
    pro: { decided: 32, approved: 29, declined: 3, avg_hours: 9.4, median_hours: 7.2, slowest: { hours: 20.1, customer_name: 'Ifeanyi Obi', submitted_at: lastWeek(3, 11, 0) } },
    decisions: [
      { id: 'fod10', kind: 'asset', label: 'Flex installment', customer_name: 'Hauwa Garba', amount: 400_000, submitted_at: lastWeek(1, 9, 0), decided_at: lastWeek(1, 12, 6), hours_counted: 3.1, outcome: 'approved' },
      { id: 'fod11', kind: 'associate_pro', label: 'Upgrade', customer_name: 'Ifeanyi Obi', amount: 50_000, submitted_at: lastWeek(3, 11, 0), decided_at: lastWeek(4, 7, 6), hours_counted: 20.1, outcome: 'declined' },
      { id: 'fod12', kind: 'asset', label: 'Full ownership installment', customer_name: 'Yakubu Sani', amount: 2_200_000, submitted_at: lastWeek(2, 10, 0), decided_at: lastWeek(2, 14, 0), hours_counted: 4.0, outcome: 'approved' },
    ],
  },
];

/** Admins with approve permission who aren't officers. */
const OTHER_ADMINS = { asset: { decided: 15, avg_hours: 20.1 }, pro: { decided: 6, avg_hours: 28.2 } };

const QUEUE = {
  total: 30,
  under_12h: 18,
  between_12_24h: 8,
  over_24h: 4,
  asset: { waiting: 23, over_24h: 3 },
  associate_pro: { waiting: 7, over_24h: 1 },
};

type MockTarget = { _id: string; officer: string; month: number; year: number; recovery_target: number; createdAt: string; updatedAt: string };

const thisMonth = () => ({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
const lastMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

const targets: MockTarget[] = [
  { _id: 'fot1', officer: O1, ...thisMonth(), recovery_target: 5_000_000, createdAt: daysAgo(25), updatedAt: daysAgo(25) },
  { _id: 'fot2', officer: O1, ...lastMonth(), recovery_target: 4_500_000, createdAt: daysAgo(55), updatedAt: daysAgo(55) },
  { _id: 'fot3', officer: O2, ...thisMonth(), recovery_target: 6_000_000, createdAt: daysAgo(25), updatedAt: daysAgo(25) },
  { _id: 'fot4', officer: O3, ...thisMonth(), recovery_target: 4_000_000, createdAt: daysAgo(25), updatedAt: daysAgo(25) },
];

type Payment = {
  id: string;
  amount: number;
  paid_at: string;
  method: 'transfer' | 'paystack' | 'wallet';
  approved_by: string | null;
  approval_hours: number | null;
};

type MockPlan = {
  plan_id: string;
  officer: string;
  assigned_at: string;
  auto: boolean;
  customer: { id: string; first_name: string; last_name: string; email: string; phone: string | null };
  asset: string;
  product: 'flex' | 'full_ownership' | 'commercial';
  tenor_months: number;
  entered_book_at: string;
  entry_reason: 'due_soon' | 'overdue';
  state: 'due_soon' | 'overdue' | 'cleared' | 'suspended';
  final_due_date: string;
  months_overdue: number;
  days_past_due: number;
  suspends_at: string | null;
  penalty_at: string | null;
  balance: number;
  plan_price: number;
  amount_paid: number;
  start_date: string;
  left_book_at: string | null;
  payments: Payment[];
};

let paymentSeq = 0;
const pay = (daysBack: number, amount: number, method: Payment['method'], approvedBy: string | null = null, hours: number | null = null): Payment => ({
  id: `fop${++paymentSeq}`,
  amount,
  paid_at: daysAgo(daysBack),
  method,
  approved_by: approvedBy,
  approval_hours: hours,
});

const customer = (id: string, first: string, last: string, phone: string | null = null) => ({
  id: `665ffcus000000000000${id}`,
  first_name: first,
  last_name: last,
  email: `${first}.${last}`.toLowerCase() + '@example.com',
  phone,
});

const plans: MockPlan[] = [
  // ---- O1 ----
  { plan_id: 'fopl01', officer: O1, assigned_at: daysAgo(93), auto: true, customer: customer('0001', 'Chinedu', 'Eze', '+2348030000001'), asset: 'Palm Grove Estate', product: 'flex', tenor_months: 18, entered_book_at: daysAgo(93), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(200), months_overdue: 3, days_past_due: 0, suspends_at: daysFromNow(12), penalty_at: null, balance: 3_200_000, plan_price: 7_200_000, amount_paid: 4_000_000, start_date: daysAgo(330), left_book_at: null, payments: [] },
  { plan_id: 'fopl02', officer: O1, assigned_at: daysAgo(51), auto: true, customer: customer('0002', 'Funke', 'Adeyemi', '+2348030000002'), asset: 'Riverside Commercial', product: 'commercial', tenor_months: 12, entered_book_at: daysAgo(51), entry_reason: 'due_soon', state: 'overdue', final_due_date: daysAgo(21), months_overdue: 0, days_past_due: 21, suspends_at: daysFromNow(35), penalty_at: daysFromNow(7), balance: 4_800_000, plan_price: 12_000_000, amount_paid: 7_200_000, start_date: daysAgo(386), left_book_at: null, payments: [pay(40, 700_000, 'transfer', O1, 5.2), pay(12, 500_000, 'transfer', O2, 26.4)] },
  { plan_id: 'fopl03', officer: O1, assigned_at: daysAgo(12), auto: true, customer: customer('0003', 'Amaka', 'Obi', '+2348030000003'), asset: 'Palm Grove Estate', product: 'full_ownership', tenor_months: 24, entered_book_at: daysAgo(12), entry_reason: 'due_soon', state: 'due_soon', final_due_date: daysFromNow(18), months_overdue: 0, days_past_due: 0, suspends_at: daysFromNow(74), penalty_at: daysFromNow(46), balance: 1_500_000, plan_price: 9_000_000, amount_paid: 7_500_000, start_date: daysAgo(712), left_book_at: null, payments: [pay(5, 500_000, 'paystack')] },
  { plan_id: 'fopl04', officer: O1, assigned_at: daysAgo(24), auto: true, customer: customer('0004', 'Tunde', 'Bakare', null), asset: 'Oak Ridge Gardens', product: 'flex', tenor_months: 12, entered_book_at: daysAgo(24), entry_reason: 'due_soon', state: 'due_soon', final_due_date: daysFromNow(6), months_overdue: 0, days_past_due: 0, suspends_at: daysFromNow(126), penalty_at: null, balance: 600_000, plan_price: 4_800_000, amount_paid: 4_200_000, start_date: daysAgo(359), left_book_at: null, payments: [] },
  { plan_id: 'fopl05', officer: O1, assigned_at: daysAgo(26), auto: true, customer: customer('0005', 'Ibrahim', 'Musa', '+2348030000005'), asset: 'Oak Ridge Gardens', product: 'flex', tenor_months: 24, entered_book_at: daysAgo(26), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(400), months_overdue: 1, days_past_due: 0, suspends_at: daysFromNow(92), penalty_at: daysFromNow(4), balance: 2_100_000, plan_price: 4_800_000, amount_paid: 2_700_000, start_date: daysAgo(330), left_book_at: null, payments: [] },
  { plan_id: 'fopl06', officer: O1, assigned_at: daysAgo(46), auto: true, customer: customer('0006', 'Emeka', 'Nwosu', '+2348030000006'), asset: 'Palm Grove Estate', product: 'flex', tenor_months: 12, entered_book_at: daysAgo(46), entry_reason: 'due_soon', state: 'cleared', final_due_date: daysAgo(16), months_overdue: 0, days_past_due: 0, suspends_at: null, penalty_at: null, balance: 0, plan_price: 6_000_000, amount_paid: 6_000_000, start_date: daysAgo(381), left_book_at: daysAgo(5), payments: [pay(20, 900_000, 'transfer', O1, 3.4), pay(5, 750_000, 'wallet')] },
  { plan_id: 'fopl07', officer: O1, assigned_at: daysAgo(95), auto: true, customer: customer('0007', 'Halima', 'Bello', '+2348030000007'), asset: 'Cedar Court', product: 'full_ownership', tenor_months: 18, entered_book_at: daysAgo(95), entry_reason: 'due_soon', state: 'suspended', final_due_date: daysAgo(65), months_overdue: 0, days_past_due: 56, suspends_at: daysAgo(9), penalty_at: null, balance: 2_300_000, plan_price: 8_100_000, amount_paid: 5_800_000, start_date: daysAgo(612), left_book_at: daysAgo(9), payments: [pay(70, 400_000, 'transfer', O1, 11.0)] },
  { plan_id: 'fopl08', officer: O1, assigned_at: daysAgo(8), auto: true, customer: customer('0008', 'Grace', 'Etim', '+2348030000008'), asset: 'Cedar Court', product: 'flex', tenor_months: 18, entered_book_at: daysAgo(8), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(150), months_overdue: 1, days_past_due: 0, suspends_at: daysFromNow(112), penalty_at: daysFromNow(22), balance: 1_800_000, plan_price: 5_400_000, amount_paid: 3_600_000, start_date: daysAgo(390), left_book_at: null, payments: [pay(3, 300_000, 'transfer', O1, 8.3)] },
  { plan_id: 'fopl09', officer: O1, assigned_at: daysAgo(20), auto: true, customer: customer('0009', 'Kemi', 'Salako', '+2348030000009'), asset: 'Riverside Commercial', product: 'commercial', tenor_months: 12, entered_book_at: daysAgo(20), entry_reason: 'due_soon', state: 'due_soon', final_due_date: daysFromNow(10), months_overdue: 0, days_past_due: 0, suspends_at: daysFromNow(66), penalty_at: daysFromNow(38), balance: 2_700_000, plan_price: 10_800_000, amount_paid: 8_100_000, start_date: daysAgo(355), left_book_at: null, payments: [pay(9, 450_000, 'transfer', O1, 2.5)] },
  { plan_id: 'fopl10', officer: O1, assigned_at: daysAgo(110), auto: false, customer: customer('0010', 'Musa', 'Danladi', '+2348030000010'), asset: 'Palm Grove Estate', product: 'flex', tenor_months: 12, entered_book_at: daysAgo(110), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(60), months_overdue: 3, days_past_due: 0, suspends_at: daysFromNow(9), penalty_at: null, balance: 1_450_000, plan_price: 4_200_000, amount_paid: 2_750_000, start_date: daysAgo(305), left_book_at: null, payments: [pay(60, 350_000, 'transfer', O1, 6.1)] },
  // ---- O2 ----
  { plan_id: 'fopl11', officer: O2, assigned_at: daysAgo(15), auto: true, customer: customer('0011', 'Chioma', 'Nnadi', '+2348030000011'), asset: 'Oak Ridge Gardens', product: 'flex', tenor_months: 12, entered_book_at: daysAgo(15), entry_reason: 'due_soon', state: 'due_soon', final_due_date: daysFromNow(15), months_overdue: 0, days_past_due: 0, suspends_at: daysFromNow(135), penalty_at: null, balance: 900_000, plan_price: 4_800_000, amount_paid: 3_900_000, start_date: daysAgo(350), left_book_at: null, payments: [pay(7, 600_000, 'transfer', O2, 9.9)] },
  { plan_id: 'fopl12', officer: O2, assigned_at: daysAgo(60), auto: true, customer: customer('0012', 'Segun', 'Afolabi', '+2348030000012'), asset: 'Riverside Commercial', product: 'commercial', tenor_months: 12, entered_book_at: daysAgo(60), entry_reason: 'due_soon', state: 'overdue', final_due_date: daysAgo(30), months_overdue: 0, days_past_due: 30, suspends_at: daysFromNow(26), penalty_at: null, balance: 3_600_000, plan_price: 12_000_000, amount_paid: 8_400_000, start_date: daysAgo(395), left_book_at: null, payments: [pay(25, 1_400_000, 'transfer', O2, 12.2), pay(4, 1_000_000, 'paystack')] },
  { plan_id: 'fopl13', officer: O2, assigned_at: daysAgo(62), auto: true, customer: customer('0013', 'Ngozi', 'Umeh', null), asset: 'Palm Grove Estate', product: 'flex', tenor_months: 18, entered_book_at: daysAgo(62), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(180), months_overdue: 2, days_past_due: 0, suspends_at: daysFromNow(58), penalty_at: null, balance: 2_500_000, plan_price: 6_300_000, amount_paid: 3_800_000, start_date: daysAgo(360), left_book_at: null, payments: [] },
  { plan_id: 'fopl14', officer: O2, assigned_at: daysAgo(28), auto: true, customer: customer('0014', 'Yakubu', 'Sani', '+2348030000014'), asset: 'Cedar Court', product: 'full_ownership', tenor_months: 18, entered_book_at: daysAgo(28), entry_reason: 'due_soon', state: 'cleared', final_due_date: daysFromNow(2), months_overdue: 0, days_past_due: 0, suspends_at: null, penalty_at: null, balance: 0, plan_price: 8_100_000, amount_paid: 8_100_000, start_date: daysAgo(545), left_book_at: daysAgo(3), payments: [pay(3, 2_200_000, 'transfer', O3, 4.0)] },
  // ---- O3 ----
  { plan_id: 'fopl15', officer: O3, assigned_at: daysAgo(8), auto: true, customer: customer('0015', 'Tobi', 'Oladipo', '+2348030000015'), asset: 'Oak Ridge Gardens', product: 'flex', tenor_months: 12, entered_book_at: daysAgo(8), entry_reason: 'due_soon', state: 'due_soon', final_due_date: daysFromNow(22), months_overdue: 0, days_past_due: 0, suspends_at: daysFromNow(142), penalty_at: null, balance: 750_000, plan_price: 4_800_000, amount_paid: 4_050_000, start_date: daysAgo(343), left_book_at: null, payments: [] },
  { plan_id: 'fopl16', officer: O3, assigned_at: daysAgo(95), auto: true, customer: customer('0016', 'Hauwa', 'Garba', '+2348030000016'), asset: 'Palm Grove Estate', product: 'flex', tenor_months: 24, entered_book_at: daysAgo(95), entry_reason: 'overdue', state: 'overdue', final_due_date: daysFromNow(300), months_overdue: 3, days_past_due: 0, suspends_at: daysFromNow(5), penalty_at: null, balance: 3_900_000, plan_price: 7_200_000, amount_paid: 3_300_000, start_date: daysAgo(430), left_book_at: null, payments: [pay(18, 400_000, 'transfer', O3, 3.1)] },
  { plan_id: 'fopl17', officer: O3, assigned_at: daysAgo(70), auto: true, customer: customer('0017', 'Obinna', 'Chukwu', null), asset: 'Riverside Commercial', product: 'commercial', tenor_months: 12, entered_book_at: daysAgo(70), entry_reason: 'due_soon', state: 'suspended', final_due_date: daysAgo(60), months_overdue: 0, days_past_due: 56, suspends_at: daysAgo(4), penalty_at: null, balance: 5_100_000, plan_price: 12_000_000, amount_paid: 6_900_000, start_date: daysAgo(425), left_book_at: daysAgo(4), payments: [] },
];

/* -------------------- derivations -------------------- */

const RECOVERY_WINDOW_DAYS = 30;
const inWindow = (iso: string) => Date.now() - new Date(iso).getTime() <= RECOVERY_WINDOW_DAYS * DAY;
const isOpen = (p: MockPlan) => p.state === 'due_soon' || p.state === 'overdue';
const suspendingSoon = (p: MockPlan) =>
  p.state === 'overdue' && !!p.suspends_at && new Date(p.suspends_at).getTime() - Date.now() <= 14 * DAY;

/** Payments counted as recovery: in the window, and before the plan was suspended. */
const recoveredPayments = (p: MockPlan) =>
  p.payments.filter(
    (pay) => inWindow(pay.paid_at) && (p.state !== 'suspended' || !p.left_book_at || pay.paid_at <= p.left_book_at)
  );

const round1 = (n: number) => Math.round(n * 10) / 10;
const speedComponent = (avg: number | null) => (avg == null ? 0 : 25 * Math.min(1, APPROVAL_TARGET_HOURS / avg));

const periodOf = (query: Record<string, unknown>) => {
  const now = thisMonth();
  const month = Number(query.month) || now.month;
  const year = Number(query.year) || now.year;
  return {
    month,
    year,
    start: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString(),
  };
};

const targetFor = (adminId: string, month: number, year: number) =>
  targets.find((t) => t.officer === adminId && t.month === month && t.year === year) ?? null;

function officerRecovery(adminId: string, period: { month: number; year: number }) {
  const mine = plans.filter((p) => p.officer === adminId);
  const open = mine.filter(isOpen);
  const counted = mine.map((p) => ({ plan: p, payments: recoveredPayments(p) }));
  const recovered = counted.reduce((s, c) => s + c.payments.reduce((a, pay) => a + pay.amount, 0), 0);
  const suspended = mine.filter((p) => p.state === 'suspended' && p.left_book_at && inWindow(p.left_book_at));
  return {
    target: targetFor(adminId, period.month, period.year)?.recovery_target ?? 0,
    recovered,
    payments_count: counted.reduce((s, c) => s + c.payments.length, 0),
    plans_paid_count: counted.filter((c) => c.payments.length > 0).length,
    in_book: open.length,
    due_soon: open.filter((p) => p.state === 'due_soon').length,
    overdue: open.filter((p) => p.state === 'overdue').length,
    outstanding: open.reduce((s, p) => s + p.balance, 0),
    cleared: mine.filter((p) => p.state === 'cleared' && p.left_book_at && inWindow(p.left_book_at)).length,
    suspended: suspended.length,
    unrecovered_on_suspension: suspended.reduce((s, p) => s + p.balance, 0),
    suspending_within_14_days: open.filter(suspendingSoon).length,
  };
}

function officerScore(o: MockOfficer, recovery: ReturnType<typeof officerRecovery>) {
  const asset = speedComponent(o.asset.avg_hours);
  const pro = speedComponent(o.pro.avg_hours);
  const rec = recovery.target > 0 ? 50 * Math.min(1, recovery.recovered / recovery.target) : 0;
  return {
    score: round1(asset + pro + rec),
    asset_speed_component: round1(asset),
    pro_speed_component: round1(pro),
    recovery_component: round1(rec),
  };
}

const FILTERS: Record<string, (p: MockPlan) => boolean> = {
  in_book: isOpen,
  due_soon: (p) => p.state === 'due_soon',
  overdue: (p) => p.state === 'overdue',
  suspending_soon: suspendingSoon,
  cleared: (p) => p.state === 'cleared' && !!p.left_book_at && inWindow(p.left_book_at),
  suspended: (p) => p.state === 'suspended' && !!p.left_book_at && inWindow(p.left_book_at),
};

const recoveredSinceAssigned = (p: MockPlan) =>
  p.payments.filter((pay) => pay.paid_at >= p.assigned_at).reduce((s, pay) => s + pay.amount, 0);

function toRow(p: MockPlan) {
  return {
    plan_id: p.plan_id,
    customer: p.customer,
    asset: p.asset,
    product: p.product,
    tenor_months: p.tenor_months,
    entered_book_at: p.entered_book_at,
    entry_reason: p.entry_reason,
    state: p.state,
    final_due_date: p.final_due_date,
    months_overdue: p.months_overdue,
    days_past_due: p.days_past_due,
    suspends_at: p.suspends_at,
    balance: p.balance,
    recovered_since_assigned: recoveredSinceAssigned(p),
    left_book_at: p.left_book_at,
  };
}

function toDetail(p: MockPlan) {
  return {
    ...toRow(p),
    plan_price: p.plan_price,
    amount_paid: p.amount_paid,
    start_date: p.start_date,
    penalty_at: p.penalty_at,
    assignment: { officer: toAdminMin(findAdmin(p.officer)), assigned_at: p.assigned_at, auto: p.auto },
    payments: [...p.payments]
      .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
      .map((pay) => ({ ...pay, approved_by: pay.approved_by ? toAdminMin(findAdmin(pay.approved_by)) : null })),
  };
}

const findOfficer = (adminId: string) => officers.find((o) => o.adminId === adminId);

const requireOfficer = (adminId: string) => {
  const o = findOfficer(adminId);
  if (!o) throw new MockHttpError(404, 'Financial Officer not found', 'NOT_FOUND');
  return o;
};

/** Fewest open plans wins — the same rule that assigns new plans. */
const leastLoadedOfficer = (exclude?: string) =>
  officers
    .filter((o) => o.adminId !== exclude)
    .map((o) => ({ o, open: plans.filter((p) => p.officer === o.adminId && isOpen(p)).length }))
    .sort((a, b) => a.open - b.open)[0]?.o ?? null;

/* -------------------- routes -------------------- */

export const financialOfficerRoutes: MockRoutes = {
  'GET /admin/financial-officers': () => {
    const period = thisMonth();
    return officers.map((o) => {
      const recovery = officerRecovery(o.adminId, period);
      return {
        id: o._id,
        officer: toAdminMin(findAdmin(o.adminId)),
        active_since: o.assigned_from,
        open_plans_count: recovery.in_book,
        current_period_score: recovery.target > 0 ? officerScore(o, recovery).score : null,
      };
    });
  },

  'POST /admin/financial-officers': ({ body: raw }) => {
    const { admin_id } = body<{ admin_id?: string }>(raw);
    if (!admin_id || !findAdmin(admin_id)) throw new MockHttpError(404, 'Admin not found', 'NOT_FOUND');
    if (findOfficer(admin_id)) throw new MockHttpError(409, 'This admin is already a Financial Officer', 'CONFLICT');
    const created: MockOfficer = {
      _id: `665ffino0000000000000${String(officers.length + 1).padStart(3, '0')}`,
      adminId: admin_id,
      assigned_from: new Date().toISOString(),
      asset: noStats(),
      pro: noStats(),
      decisions: [],
    };
    officers.push(created);
    return { id: created._id, officer: admin_id, assigned_from: created.assigned_from, assigned_to: null, created_by: '665fadmn00000000000000d1' };
  },

  'DELETE /admin/financial-officers/:officer_id': ({ params }) => {
    const o = requireOfficer(params.officer_id);
    officers.splice(officers.indexOf(o), 1);
    // Their open plans go back through auto-assignment.
    for (const p of plans.filter((p) => p.officer === o.adminId && isOpen(p))) {
      const next = leastLoadedOfficer();
      if (!next) break;
      p.officer = next.adminId;
      p.assigned_at = new Date().toISOString();
      p.auto = true;
    }
    return { id: o._id, officer: o.adminId, assigned_from: o.assigned_from, assigned_to: new Date().toISOString(), created_by: '665fadmn00000000000000d1' };
  },

  'GET /admin/financial-officers/:officer_id/targets': ({ params }) =>
    targets.filter((t) => t.officer === params.officer_id).map(({ _id, ...t }) => ({ id: _id, ...t })),

  'PUT /admin/financial-officers/:officer_id/targets/:year/:month': ({ params, body: raw }) => {
    requireOfficer(params.officer_id);
    const { recovery_target } = body<{ recovery_target?: number }>(raw);
    if (typeof recovery_target !== 'number' || recovery_target < 0) {
      throw new MockHttpError(400, 'recovery_target must be a non-negative number', 'Bad Request');
    }
    const month = Number(params.month);
    const year = Number(params.year);
    const now = new Date().toISOString();
    let t = targetFor(params.officer_id, month, year);
    if (t) {
      t.recovery_target = recovery_target;
      t.updatedAt = now;
    } else {
      t = { _id: `fot${targets.length + 1}`, officer: params.officer_id, month, year, recovery_target, createdAt: now, updatedAt: now };
      targets.push(t);
    }
    const { _id, ...rest } = t;
    return { id: _id, ...rest };
  },

  'GET /admin/financial-officers/team-dashboard': ({ query }) => {
    const period = periodOf(query);
    const rows = officers.map((o) => {
      const recovery = officerRecovery(o.adminId, period);
      return {
        officer: toAdminMin(findAdmin(o.adminId)),
        active_since: o.assigned_from,
        in_book: recovery.in_book,
        suspending_within_14_days: recovery.suspending_within_14_days,
        recovered: recovery.recovered,
        recovery_target: recovery.target,
        asset_avg_hours: o.asset.avg_hours,
        pro_avg_hours: o.pro.avg_hours,
        decisions: o.asset.decided + o.pro.decided,
        score: recovery.target > 0 ? officerScore(o, recovery).score : null,
        _recovery: recovery,
      };
    });

    const weightedAvg = (parts: { decided: number; avg: number | null }[]) => {
      const withAvg = parts.filter((p) => p.avg != null && p.decided > 0);
      const n = withAvg.reduce((s, p) => s + p.decided, 0);
      return n === 0 ? null : round1(withAvg.reduce((s, p) => s + p.decided * (p.avg as number), 0) / n);
    };
    const assetParts = [...officers.map((o) => ({ decided: o.asset.decided, avg: o.asset.avg_hours })), { decided: OTHER_ADMINS.asset.decided, avg: OTHER_ADMINS.asset.avg_hours }];
    const proParts = [...officers.map((o) => ({ decided: o.pro.decided, avg: o.pro.avg_hours })), { decided: OTHER_ADMINS.pro.decided, avg: OTHER_ADMINS.pro.avg_hours }];
    const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);

    return {
      period,
      approval_target_hours: APPROVAL_TARGET_HOURS,
      approvals: {
        asset: { decided: assetParts.reduce((s, p) => s + p.decided, 0), avg_hours: weightedAvg(assetParts) },
        associate_pro: { decided: proParts.reduce((s, p) => s + p.decided, 0), avg_hours: weightedAvg(proParts) },
      },
      queue: QUEUE,
      expired_unreviewed_upgrades: 2,
      recovery: {
        recovered: sum((r) => r._recovery.recovered),
        target: sum((r) => r._recovery.target),
        in_book: sum((r) => r._recovery.in_book),
        outstanding: sum((r) => r._recovery.outstanding),
        suspended: sum((r) => r._recovery.suspended),
        unrecovered_on_suspension: sum((r) => r._recovery.unrecovered_on_suspension),
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      officers: rows.map(({ _recovery, ...r }) => r),
      other_admins: {
        asset_avg_hours: OTHER_ADMINS.asset.avg_hours,
        pro_avg_hours: OTHER_ADMINS.pro.avg_hours,
        decisions: OTHER_ADMINS.asset.decided + OTHER_ADMINS.pro.decided,
      },
    };
  },

  'GET /admin/financial-officers/:officer_id/dashboard': ({ params, query }) => {
    const period = periodOf(query);
    const o = findOfficer(params.officer_id);
    const admin = findAdmin(params.officer_id);

    // Not an officer: the BE returns officer: null with an empty dashboard,
    // so the page can keep its picker up.
    const recovery = officerRecovery(params.officer_id, period);
    const stats = o ?? { asset: noStats(), pro: noStats(), decisions: [] };

    const mine = o ? plans.filter((p) => p.officer === params.officer_id) : [];
    const filterKey = typeof query.filter === 'string' && FILTERS[query.filter] ? query.filter : 'in_book';
    const q = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';
    const matching = mine
      .filter(FILTERS[filterKey])
      .filter(
        (p) =>
          !q ||
          `${p.customer.first_name} ${p.customer.last_name}`.toLowerCase().includes(q) ||
          p.customer.email.toLowerCase().includes(q) ||
          p.asset.toLowerCase().includes(q)
      )
      // Most urgent first: nearest suspension, then nearest final due date.
      .sort((a, b) => (a.suspends_at ?? '9999').localeCompare(b.suspends_at ?? '9999') || a.final_due_date.localeCompare(b.final_due_date));

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);

    return {
      period,
      officer: o ? toAdminMin(admin) : null,
      approval_target_hours: APPROVAL_TARGET_HOURS,
      approvals: { asset: stats.asset, associate_pro: stats.pro },
      queue: QUEUE,
      recent_decisions: stats.decisions,
      recovery,
      performance_score: o
        ? officerScore(o, recovery)
        : { score: 0, asset_speed_component: 0, pro_speed_component: 0, recovery_component: 0 },
      plans: matching.slice((page - 1) * limit, page * limit).map(toRow),
      plans_total: matching.length,
      filter_counts: {
        in_book: mine.filter(FILTERS.in_book).length,
        due_soon: mine.filter(FILTERS.due_soon).length,
        overdue: mine.filter(FILTERS.overdue).length,
        suspending_soon: mine.filter(FILTERS.suspending_soon).length,
        cleared: mine.filter(FILTERS.cleared).length,
        suspended: mine.filter(FILTERS.suspended).length,
      },
    };
  },

  'GET /admin/financial-officers/recovery-plans/:plan_id': ({ params }) => {
    const p = plans.find((x) => x.plan_id === params.plan_id);
    if (!p) throw new MockHttpError(404, 'Recovery plan not found', 'NOT_FOUND');
    return toDetail(p);
  },

  'POST /admin/financial-officers/recovery-plans/:plan_id/reassign': ({ params, body: raw }) => {
    const p = plans.find((x) => x.plan_id === params.plan_id);
    if (!p) throw new MockHttpError(404, 'Recovery plan not found', 'NOT_FOUND');
    if (!isOpen(p)) throw new MockHttpError(400, 'Only plans still in a recovery book can be reassigned', 'Bad Request');
    const { officer_id } = body<{ officer_id?: string }>(raw);
    requireOfficer(officer_id ?? '');
    p.officer = officer_id as string;
    p.assigned_at = new Date().toISOString();
    p.auto = false;
    return toDetail(p);
  },
};
