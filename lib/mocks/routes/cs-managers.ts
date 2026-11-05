import { LAND_CHOICE_REASONS } from '@/features/cs-managers/schemas/cs-manager.schema';
import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';
import { findPerson } from './people';
import { requireSession } from './auth';

/* ============================================================
 * CS Managers mocks — role management, targets, unassigned customers, the
 * admin picker (`GET /admin/admins`, claimed here narrowly — no other
 * feature has migrated off GraphQL for it yet; extend rather than
 * re-register when roles-permissions migrates), the performance dashboard
 * (one manager and `dashboard/all`), the auto-assign dry run, and per-plan
 * onboarding calls.
 *
 * The dashboard mock is a simplified stand-in for `csm-dashboard.derive.ts`
 * (CSM-21) — same estate/filter/search/backlog/portfolio semantics as
 * abode-be-v2 `port/v1-sep-oct`, computed over a fixed plan fixture set per
 * manager rather than a real aggregation.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/** `CS_MANAGER_AUTO_ASSIGN` — off by default on the BE. Flip to see the preview's "on" state. */
const AUTO_ASSIGN_ENABLED = false;

export type MockAdmin = {
  _id: string;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'admin' | 'subadmin' | 'moderator' | 'viewer';
};

export const ADMINS: MockAdmin[] = [
  { _id: '665fadmn00000000000000d1', userName: 'ngozi.eze', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@abodeflex.com', role: 'admin' },
  { _id: '665fadmn00000000000000d2', userName: 'chuka.obi', firstName: 'Chuka', lastName: 'Obi', email: 'chuka.obi@abodeflex.com', role: 'subadmin' },
  { _id: '665fadmn00000000000000d3', userName: 'amina.bello', firstName: 'Amina', lastName: 'Bello', email: 'amina.bello@abodeflex.com', role: 'subadmin' },
  { _id: '665fadmn00000000000000d4', userName: 'tolu.adeyemi', firstName: 'Tolu', lastName: 'Adeyemi', email: 'tolu.adeyemi@abodeflex.com', role: 'moderator' },
  { _id: '665fadmn00000000000000d5', userName: 'femi.oke', firstName: 'Femi', lastName: 'Oke', email: 'femi.oke@abodeflex.com', role: 'subadmin' },
];

export const findAdmin = (id: string) => ADMINS.find((a) => a._id === id);

type MockCSManager = {
  _id: string;
  managerId: string;
  assigned_from: string;
  assigned_to: string | null;
  created_by: string;
  createdAt: string;
  assigned_customers_count: number;
  assigned_plans_count: number;
  current_period_score: number | null;
};

const csManagers: MockCSManager[] = [
  {
    _id: '665fcsma00000000000000e1',
    managerId: '665fadmn00000000000000d2',
    assigned_from: daysAgo(120),
    assigned_to: null,
    created_by: '665fadmn00000000000000d1',
    createdAt: daysAgo(120),
    assigned_customers_count: 34,
    assigned_plans_count: 41,
    current_period_score: 78,
  },
  {
    _id: '665fcsma00000000000000e2',
    managerId: '665fadmn00000000000000d3',
    assigned_from: daysAgo(45),
    assigned_to: null,
    created_by: '665fadmn00000000000000d1',
    createdAt: daysAgo(45),
    assigned_customers_count: 19,
    assigned_plans_count: 22,
    current_period_score: 91,
  },
];

type MockTarget = {
  _id: string;
  manager: string;
  month: number;
  year: number;
  customers_allocated_target: number;
  customers_onboarded_target: number;
  /** A percentage (0-100). Replaced the deprecated deeds target. */
  tickets_resolved_target: number;
  createdAt: string;
  updatedAt: string;
};

const targets: MockTarget[] = [
  {
    _id: '665fcstg00000000000000f1',
    manager: '665fadmn00000000000000d2',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    customers_allocated_target: 40,
    customers_onboarded_target: 30,
    tickets_resolved_target: 80,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
];

type MockUnassigned = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  first_purchase_at: string;
  days_unassigned: number;
  plan_count: number;
};

const unassignedCustomers: MockUnassigned[] = [
  { _id: '665funcs00000000000000g1', firstName: 'Blessing', lastName: 'Nwachukwu', email: 'blessing.n@example.com', phone: '+2348022001100', first_purchase_at: daysAgo(11), days_unassigned: 11, plan_count: 1 },
  { _id: '665funcs00000000000000g2', firstName: 'Kayode', lastName: 'Salami', email: 'kayode.salami@example.com', phone: null, first_purchase_at: daysAgo(3), days_unassigned: 3, plan_count: 2 },
  { _id: '665funcs00000000000000g3', firstName: 'Ijeoma', lastName: 'Uche', email: 'ijeoma.uche@example.com', phone: '+2348133445566', first_purchase_at: daysAgo(21), days_unassigned: 21, plan_count: 1 },
];

const toSummary = (m: MockCSManager) => {
  const admin = findAdmin(m.managerId);
  return {
    id: m._id,
    manager: admin
      ? {
          id: admin._id,
          user_name: admin.userName,
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          role: admin.role,
        }
      : null,
    assigned_customers_count: m.assigned_customers_count,
    assigned_plans_count: m.assigned_plans_count,
    current_period_score: m.current_period_score,
    active_since: m.assigned_from,
  };
};

const toAssignment = (m: MockCSManager) => ({
  id: m._id,
  manager: m.managerId,
  assigned_from: m.assigned_from,
  assigned_to: m.assigned_to,
  created_by: m.created_by,
  createdAt: m.createdAt,
});

const toTarget = (t: MockTarget) => ({
  id: t._id,
  manager: t.manager,
  month: t.month,
  year: t.year,
  customers_allocated_target: t.customers_allocated_target,
  customers_onboarded_target: t.customers_onboarded_target,
  tickets_resolved_target: t.tickets_resolved_target,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

/* ============================================================
 * Dashboard fixtures — a simplified stand-in for the real book-wide
 * aggregation (CSM-21). Manager d2 (Chuka Obi) owns pl01-pl04, manager d3
 * (Amina Bello) owns pl05-pl06 — every filter chip and backlog bucket has
 * at least one matching row across the two books.
 * ============================================================ */

type MockPaymentStatus = 'in_plan' | 'completed' | 'close_to_default';
type MockOnboardingStatus = 'call_pending' | 'confirmed' | 'disputed' | 'not_applicable';
type MockAllocationStatus = 'awaiting' | 'allocated' | 'not_applicable';
type MockDoaStatus = 'not_sent' | 'sent' | 'not_applicable';

type MockPlan = {
  plan_id: string;
  manager: string;
  customer_id: string;
  prior_plans_count: number;
  asset: string;
  asset_id: string;
  location: string;
  size: number;
  units: number;
  allocation_status: string;
  product: 'flex' | 'full_ownership' | 'commercial';
  purchase_date: string;
  payment_completed_at?: string;
  payment_status: MockPaymentStatus;
  payment_label: string;
  onboarding: MockOnboardingStatus;
  allocation: MockAllocationStatus;
  allocation_label: string | null;
  doa: MockDoaStatus;
  doa_label: string | null;
  last_activity_at: string;
};

const plans: MockPlan[] = [
  {
    plan_id: '665fplan000000000000cm01',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c1',
    prior_plans_count: 0,
    asset: 'Aviation City',
    asset_id: '665fasst00000000000000a1',
    location: 'Epe, Lagos',
    size: 500,
    units: 1,
    allocation_status: 'allocated',
    product: 'flex',
    purchase_date: daysAgo(20),
    payment_status: 'in_plan',
    payment_label: '8 of 12 months paid',
    onboarding: 'confirmed',
    allocation: 'allocated',
    allocation_label: 'Allocated',
    doa: 'not_applicable',
    doa_label: null,
    last_activity_at: daysAgo(2),
  },
  {
    plan_id: '665fplan000000000000cm02',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c1',
    prior_plans_count: 1,
    asset: 'Aviation City',
    asset_id: '665fasst00000000000000a1',
    location: 'Epe, Lagos',
    size: 500,
    units: 2,
    allocation_status: 'pending',
    product: 'flex',
    purchase_date: daysAgo(3),
    payment_completed_at: daysAgo(2),
    payment_status: 'completed',
    payment_label: 'Fully paid',
    onboarding: 'call_pending',
    allocation: 'awaiting',
    allocation_label: null,
    doa: 'not_sent',
    doa_label: null,
    last_activity_at: daysAgo(3),
  },
  {
    plan_id: '665fplan000000000000cm03',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c2',
    prior_plans_count: 0,
    asset: 'Harmony Gardens',
    asset_id: '665fasst00000000000000a2',
    location: 'Ibeju-Lekki, Lagos',
    size: 600,
    units: 1,
    allocation_status: 'allocated',
    product: 'full_ownership',
    purchase_date: daysAgo(60),
    payment_status: 'close_to_default',
    payment_label: 'Next payment overdue soon',
    onboarding: 'disputed',
    allocation: 'allocated',
    allocation_label: 'Allocated',
    doa: 'not_sent',
    doa_label: null,
    last_activity_at: daysAgo(35),
  },
  {
    plan_id: '665fplan000000000000cm04',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c3',
    prior_plans_count: 0,
    asset: 'Harmony Gardens',
    asset_id: '665fasst00000000000000a2',
    location: 'Ibeju-Lekki, Lagos',
    size: 450,
    units: 1,
    allocation_status: 'allocated',
    product: 'full_ownership',
    purchase_date: daysAgo(90),
    payment_completed_at: daysAgo(50),
    payment_status: 'completed',
    payment_label: 'Fully paid',
    onboarding: 'confirmed',
    allocation: 'allocated',
    allocation_label: 'Allocated',
    doa: 'sent',
    doa_label: 'Delivered',
    last_activity_at: daysAgo(40),
  },
  {
    plan_id: '665fplan000000000000cm05',
    manager: '665fadmn00000000000000d3',
    customer_id: '665fcccc00000000000000c4',
    prior_plans_count: 0,
    asset: 'Aviation City',
    asset_id: '665fasst00000000000000a1',
    location: 'Epe, Lagos',
    size: 300,
    units: 1,
    allocation_status: 'pending',
    product: 'flex',
    purchase_date: daysAgo(1),
    payment_status: 'in_plan',
    payment_label: '1 of 6 months paid',
    onboarding: 'call_pending',
    allocation: 'awaiting',
    allocation_label: null,
    doa: 'not_applicable',
    doa_label: null,
    last_activity_at: daysAgo(1),
  },
  {
    plan_id: '665fplan000000000000cm06',
    manager: '665fadmn00000000000000d3',
    customer_id: '665fcccc00000000000000c5',
    prior_plans_count: 0,
    asset: 'Harmony Gardens',
    asset_id: '665fasst00000000000000a2',
    location: 'Ibeju-Lekki, Lagos',
    size: 600,
    units: 2,
    allocation_status: 'allocated',
    product: 'full_ownership',
    purchase_date: daysAgo(45),
    payment_completed_at: daysAgo(12),
    payment_status: 'completed',
    payment_label: 'Fully paid',
    onboarding: 'confirmed',
    allocation: 'allocated',
    allocation_label: 'Allocated',
    doa: 'not_sent',
    doa_label: null,
    last_activity_at: daysAgo(10),
  },
  // Three more of d2's buyers still waiting on onboarding, one per "what was
  // tried" chip: rung twice without an answer, a call booked, and never rung
  // since before this month (the carried-over half of the backlog split).
  {
    plan_id: '665fplan000000000000cm07',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c6',
    prior_plans_count: 0,
    asset: 'Aviation City',
    asset_id: '665fasst00000000000000a1',
    location: 'Epe, Lagos',
    size: 300,
    units: 3,
    allocation_status: 'pending',
    product: 'flex',
    purchase_date: daysAgo(50),
    payment_status: 'in_plan',
    payment_label: '2 of 12 months paid',
    onboarding: 'call_pending',
    allocation: 'not_applicable',
    allocation_label: null,
    doa: 'not_applicable',
    doa_label: null,
    last_activity_at: daysAgo(4),
  },
  {
    plan_id: '665fplan000000000000cm08',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c9',
    prior_plans_count: 0,
    asset: 'Harmony Gardens',
    asset_id: '665fasst00000000000000a2',
    location: 'Ibeju-Lekki, Lagos',
    size: 500,
    units: 1,
    allocation_status: 'pending',
    product: 'full_ownership',
    purchase_date: daysAgo(25),
    payment_status: 'in_plan',
    payment_label: 'Land 40% paid',
    onboarding: 'call_pending',
    allocation: 'not_applicable',
    allocation_label: null,
    doa: 'not_applicable',
    doa_label: null,
    last_activity_at: daysAgo(6),
  },
  {
    plan_id: '665fplan000000000000cm09',
    manager: '665fadmn00000000000000d2',
    customer_id: '665fcccc00000000000000c7',
    prior_plans_count: 0,
    asset: 'Harmony Gardens',
    asset_id: '665fasst00000000000000a2',
    location: 'Ibeju-Lekki, Lagos',
    size: 600,
    units: 1,
    allocation_status: 'pending',
    product: 'full_ownership',
    purchase_date: daysAgo(75),
    payment_status: 'in_plan',
    payment_label: 'Land 15% paid',
    onboarding: 'call_pending',
    allocation: 'not_applicable',
    allocation_label: null,
    doa: 'not_applicable',
    doa_label: null,
    last_activity_at: daysAgo(75),
  },
];

type MockOnboardingAttempt = {
  _id: string;
  plan_id: string;
  customer_id: string;
  outcome: 'done' | 'spoke' | 'no_answer' | 'rescheduled';
  land_choice_reason: string | null;
  notes: string | null;
  called_at: string;
  createdAt: string;
};

const onboardingAttempts: MockOnboardingAttempt[] = [
  {
    // Logged before the fixed list — free text, which the drawer shows as typed.
    _id: '665fcsat00000000000000j1',
    plan_id: '665fplan000000000000cm04',
    customer_id: '665fcccc00000000000000c3',
    outcome: 'done',
    land_choice_reason: 'Close to the new expressway interchange; buying for resale.',
    notes: 'Very responsive, no concerns.',
    called_at: daysAgo(88),
    createdAt: daysAgo(88),
  },
  {
    _id: '665fcsat00000000000000j3',
    plan_id: '665fplan000000000000cm01',
    customer_id: '665fcccc00000000000000c1',
    outcome: 'done',
    land_choice_reason: 'investment',
    notes: null,
    called_at: daysAgo(18),
    createdAt: daysAgo(18),
  },
  {
    _id: '665fcsat00000000000000j4',
    plan_id: '665fplan000000000000cm07',
    customer_id: '665fcccc00000000000000c6',
    outcome: 'no_answer',
    land_choice_reason: null,
    notes: null,
    called_at: daysAgo(9),
    createdAt: daysAgo(9),
  },
  {
    _id: '665fcsat00000000000000j5',
    plan_id: '665fplan000000000000cm07',
    customer_id: '665fcccc00000000000000c6',
    outcome: 'no_answer',
    land_choice_reason: null,
    notes: 'Straight to voicemail.',
    called_at: daysAgo(4),
    createdAt: daysAgo(4),
  },
  {
    _id: '665fcsat00000000000000j6',
    plan_id: '665fplan000000000000cm08',
    customer_id: '665fcccc00000000000000c9',
    outcome: 'rescheduled',
    land_choice_reason: null,
    notes: 'Asked for a call on Friday afternoon.',
    called_at: daysAgo(6),
    createdAt: daysAgo(6),
  },
  {
    _id: '665fcsat00000000000000j2',
    plan_id: '665fplan000000000000cm03',
    customer_id: '665fcccc00000000000000c2',
    outcome: 'spoke',
    land_choice_reason: null,
    notes: 'Raised a dispute about the receipt shortly after this call.',
    called_at: daysAgo(58),
    createdAt: daysAgo(58),
  },
];

const monthBucket = (iso: string, now: Date): 'this_month' | 'last_month' | 'older' => {
  const d = new Date(iso);
  if (d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()) {
    return 'this_month';
  }
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  if (d.getUTCFullYear() === lastMonth.getUTCFullYear() && d.getUTCMonth() === lastMonth.getUTCMonth()) {
    return 'last_month';
  }
  return 'older';
};

const emptyAgeSplit = () => ({ total: 0, this_month: 0, last_month: 0, older: 0 });

const attemptsFor = (planId: string) =>
  onboardingAttempts
    .filter((a) => a.plan_id === planId)
    .sort((a, b) => new Date(a.called_at).getTime() - new Date(b.called_at).getTime());

/** The newest call on a plan and how many there have been — the row's `last_attempt`. */
function lastAttemptOf(planId: string) {
  const attempts = attemptsFor(planId);
  const last = attempts.at(-1);
  return last ? { outcome: last.outcome, called_at: last.called_at, attempts: attempts.length } : null;
}

const PLAN_FILTERS: Record<string, (p: MockPlan) => boolean> = {
  due_allocation: (p) => p.allocation === 'awaiting',
  onboarding_pending: (p) => p.onboarding === 'call_pending' || p.onboarding === 'disputed',
  never_attempted: (p) => p.onboarding === 'call_pending' && !lastAttemptOf(p.plan_id),
  no_answer: (p) => p.onboarding === 'call_pending' && lastAttemptOf(p.plan_id)?.outcome === 'no_answer',
  rescheduled: (p) =>
    p.onboarding === 'call_pending' && lastAttemptOf(p.plan_id)?.outcome === 'rescheduled',
  due_doa: (p) => p.doa === 'not_sent',
  defaulting_soon: (p) => p.payment_status === 'close_to_default',
  completed_payment: (p) => p.payment_status === 'completed',
};

const filterCountsOf = (rows: MockPlan[]) => ({
  all: rows.length,
  ...Object.fromEntries(
    Object.entries(PLAN_FILTERS).map(([key, predicate]) => [key, rows.filter(predicate).length])
  ),
});

/** Estate names compare whole, ignoring case and stray spacing — `estateKey` on the BE. */
const estateKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

/** `estates[]`: counted over the whole book, before any estate, chip or search. */
function estatesOf(rows: MockPlan[]) {
  const byKey = new Map<string, { name: string; plans: number; due_allocation: number }>();
  for (const p of rows) {
    const key = estateKey(p.asset);
    if (!key) continue;
    const option = byKey.get(key) ?? { name: p.asset.trim(), plans: 0, due_allocation: 0 };
    option.plans += 1;
    if (PLAN_FILTERS.due_allocation(p)) option.due_allocation += 1;
    byKey.set(key, option);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function derive(managerPlans: MockPlan[], periodStart: Date, periodEnd: Date) {
  const now = new Date();

  const allocationBacklog = emptyAgeSplit();
  const doaBacklog = emptyAgeSplit();
  let onboardingCallPending = 0;
  let callPendingThisPeriod = 0;
  let callPendingCarriedOver = 0;
  const onboardingConfirmPending = 0;
  let onboardingDisputed = 0;

  for (const p of managerPlans) {
    if (p.allocation === 'awaiting') {
      allocationBacklog.total += 1;
      allocationBacklog[monthBucket(p.purchase_date, now)] += 1;
    }
    if (p.doa === 'not_sent') {
      doaBacklog.total += 1;
      doaBacklog[monthBucket(p.purchase_date, now)] += 1;
    }
    // As on the BE, "call pending" is a plan nobody has rung yet, split by
    // whether it was bought inside the selected period or before it.
    if (p.onboarding === 'call_pending' && !lastAttemptOf(p.plan_id)) {
      onboardingCallPending += 1;
      const bought = new Date(p.purchase_date);
      if (bought >= periodStart && bought <= periodEnd) callPendingThisPeriod += 1;
      else callPendingCarriedOver += 1;
    }
    if (p.onboarding === 'disputed') onboardingDisputed += 1;
    // "Called, confirmation pending" has no direct row-state in this
    // simplified mock (the real BE derives it from a 'spoke' attempt with
    // no purchase-confirmation yet) — left at 0 here.
  }

  return {
    backlogs: {
      allocation: allocationBacklog,
      onboarding: {
        total: onboardingCallPending + onboardingConfirmPending + onboardingDisputed,
        call_pending: onboardingCallPending,
        call_pending_this_period: callPendingThisPeriod,
        call_pending_carried_over: callPendingCarriedOver,
        confirm_pending: onboardingConfirmPending,
        disputed: onboardingDisputed,
      },
      doa: doaBacklog,
    },
    portfolio: {
      total_assigned: new Set(managerPlans.map((p) => p.customer_id)).size,
      completed_payment: managerPlans.filter((p) => p.payment_status === 'completed').length,
      within_payment_period: managerPlans.filter((p) => p.payment_status === 'in_plan').length,
      close_to_defaulting: managerPlans.filter((p) => p.payment_status === 'close_to_default').length,
    },
  };
}

function toPlanRow(p: MockPlan) {
  const person = findPerson(p.customer_id);
  return {
    plan_id: p.plan_id,
    customer: {
      id: p.customer_id,
      first_name: person?.firstName ?? 'Unknown',
      last_name: person?.lastName ?? 'Buyer',
      email: person?.email ?? '',
      phone: person?.phoneNumber ?? '',
    },
    prior_plans_count: p.prior_plans_count,
    asset: p.asset,
    asset_id: p.asset_id,
    location: p.location,
    size: p.size,
    units: p.units,
    allocation_status: p.allocation_status,
    product: p.product,
    purchase_date: p.purchase_date,
    payment_completed_at: p.payment_status === 'completed' ? (p.payment_completed_at ?? null) : null,
    payment_status: p.payment_status,
    payment_label: p.payment_label,
    onboarding: p.onboarding,
    allocation: p.allocation,
    allocation_label: p.allocation_label,
    doa: p.doa,
    doa_label: p.doa_label,
    last_activity_at: p.last_activity_at,
    last_attempt: lastAttemptOf(p.plan_id),
  };
}

/** Name, email or estate; or a phone number as 4+ digits, in any spacing — `applyPlanSearch`. */
function matchesSearch(p: MockPlan, raw: string): boolean {
  const needle = raw.trim().toLowerCase();
  if (!needle) return true;
  const person = findPerson(p.customer_id);
  const needleDigits = needle.replace(/\D/g, '');
  if (needleDigits.length >= 4 && (person?.phoneNumber ?? '').replace(/\D/g, '').includes(needleDigits)) {
    return true;
  }
  const name = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
  return (
    name.includes(needle) ||
    (person?.email.toLowerCase().includes(needle) ?? false) ||
    p.asset.toLowerCase().includes(needle)
  );
}

/**
 * Both dashboards: one manager's book, or every active manager's (`managerId`
 * null, as `dashboard/all`). The estate narrows the table and its chip counts
 * only; backlogs, portfolio and targets describe the whole book.
 */
function dashboardFor(managerId: string | null, query: Record<string, unknown>) {
  const admin = managerId ? findAdmin(managerId) : undefined;
  const now = new Date();
  const year = Number(query.year ?? now.getUTCFullYear());
  const month = Number(query.month ?? now.getUTCMonth() + 1);
  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const book = managerId
    ? plans.filter((p) => p.manager === managerId)
    : plans.filter((p) => csManagers.some((m) => m.managerId === p.manager));
  const { backlogs, portfolio } = derive(book, periodStart, periodEnd);

  const monthTargets = targets.filter(
    (t) => t.year === year && t.month === month && (!managerId || t.manager === managerId)
  );
  const sumOf = (pick: (t: MockTarget) => number) => monthTargets.reduce((n, t) => n + pick(t), 0);
  const targetsOut = {
    allocated_target: sumOf((t) => t.customers_allocated_target),
    allocated_so_far: book.filter((p) => p.allocation === 'allocated').length,
    onboarded_target: sumOf((t) => t.customers_onboarded_target),
    onboarded_so_far: book.filter((p) => p.onboarding === 'confirmed').length,
    // The third component is a RATE against a rate, not a count against a
    // count — see the note on the schema.
    tickets_resolved_target: monthTargets.length
      ? Math.round(sumOf((t) => t.tickets_resolved_target) / monthTargets.length)
      : 0,
    ticket_resolution_rate: 62,
    tickets_entered: 21,
    tickets_resolved: 13,
    ticket_flow: [],
  };

  const ratio = (actual: number, tgt: number) => (tgt > 0 ? Math.min(actual / tgt, 1) * 100 : 0);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const allocatedComponent = round1(ratio(targetsOut.allocated_so_far, targetsOut.allocated_target) * 0.4);
  const onboardedComponent = round1(ratio(targetsOut.onboarded_so_far, targetsOut.onboarded_target) * 0.3);
  const ticketsComponent = round1(
    ratio(targetsOut.ticket_resolution_rate ?? 0, targetsOut.tickets_resolved_target) * 0.3,
  );

  // Estate, then chip, then search — `planTable` on the BE.
  const estate = estateKey(String(query.estate ?? ''));
  const estateRows = estate ? book.filter((p) => estateKey(p.asset) === estate) : book;
  let filtered = estateRows;
  const filterKey = String(query.filter ?? 'all');
  if (filterKey !== 'all' && PLAN_FILTERS[filterKey]) {
    filtered = filtered.filter(PLAN_FILTERS[filterKey]);
  }
  const search = String(query.search ?? '');
  filtered = filtered.filter((p) => matchesSearch(p, search));
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
  );

  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.max(1, Number(query.limit ?? 20) || 20);
  const start_idx = (page - 1) * limit;
  const pageRows = sorted.slice(start_idx, start_idx + limit).map(toPlanRow);

  return {
    period: {
      period_type: 'MONTH',
      month,
      year,
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    manager: admin
      ? {
          id: admin._id,
          user_name: admin.userName,
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          role: admin.role,
        }
      : null,
    target: targetsOut,
    performance_score: {
      score: round1(allocatedComponent + onboardedComponent + ticketsComponent),
      allocated_component: allocatedComponent,
      onboarded_component: onboardedComponent,
      tickets_component: ticketsComponent,
    },
    obligation: { paid_not_allocated_this_period: book.filter(PLAN_FILTERS.due_allocation).length },
    backlogs,
    portfolio,
    plans: pageRows,
    plans_total: filtered.length,
    filter_counts: filterCountsOf(estateRows),
    estates: estatesOf(book),
  };
}

function findPlan(planId: string): MockPlan {
  const found = plans.find((p) => p.plan_id === planId);
  if (!found) throw new MockHttpError(404, 'Plan not found', 'PLAN_NOT_FOUND');
  return found;
}

export const csManagerRoutes: MockRoutes = {
  'GET /admin/admins': () => ADMINS,

  'GET /admin/cs-managers': () => csManagers.map(toSummary),

  // The caller's own book, if any.
  'GET /admin/cs-managers/me': () => {
    const admin = requireSession();
    const own = csManagers.find((m) => m.managerId === admin.id);
    return { is_cs_manager: !!own, manager: own ? toSummary(own) : null };
  },

  'POST /admin/cs-managers': ({ body: raw }) => {
    const dto = body<{ admin_id: string }>(raw);
    if (csManagers.some((m) => m.managerId === dto.admin_id)) {
      throw new MockHttpError(400, 'That admin is already an active customer success manager', 'ALREADY_A_CS_MANAGER');
    }
    if (!findAdmin(dto.admin_id)) {
      throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
    }
    const created: MockCSManager = {
      _id: `665fcsma${Date.now().toString(16).slice(-16)}`,
      managerId: dto.admin_id,
      assigned_from: new Date().toISOString(),
      assigned_to: null,
      created_by: '665fadmn00000000000000d1',
      createdAt: new Date().toISOString(),
      assigned_customers_count: 0,
      assigned_plans_count: 0,
      current_period_score: null,
    };
    csManagers.push(created);
    return toAssignment(created);
  },

  'DELETE /admin/cs-managers/:manager_id': ({ params }) => {
    const idx = csManagers.findIndex((m) => m.managerId === params.manager_id);
    if (idx === -1) {
      throw new MockHttpError(400, 'That admin is not currently a customer success manager', 'NOT_A_CS_MANAGER');
    }
    const [removed] = csManagers.splice(idx, 1);
    removed.assigned_to = new Date().toISOString();
    return toAssignment(removed);
  },

  'GET /admin/cs-managers/unassigned-customers': ({ query }) => {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.max(1, Number(query.limit ?? 20) || 20);
    const start = (page - 1) * limit;
    const results = unassignedCustomers.slice(start, start + limit).map((c) => ({
      id: c._id,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone,
      first_purchase_at: c.first_purchase_at,
      days_unassigned: c.days_unassigned,
      plan_count: c.plan_count,
    }));
    return { count: unassignedCustomers.length, results };
  },

  'POST /admin/cs-managers/:manager_id/assign-customers': ({ params, body: raw }) => {
    const manager = csManagers.find((m) => m.managerId === params.manager_id);
    if (!manager) throw new MockHttpError(404, 'Customer success manager not found', 'CS_MANAGER_NOT_FOUND');
    const dto = body<{ customer_ids: string[] }>(raw);
    const ids = new Set(dto.customer_ids);
    let assigned = 0;
    for (let i = unassignedCustomers.length - 1; i >= 0; i--) {
      if (ids.has(unassignedCustomers[i]._id)) {
        unassignedCustomers.splice(i, 1);
        assigned += 1;
      }
    }
    manager.assigned_customers_count += assigned;
    return { assigned_count: assigned, manager_id: params.manager_id };
  },

  'GET /admin/cs-managers/:manager_id/targets': ({ params }) =>
    targets.filter((t) => t.manager === params.manager_id).map(toTarget),

  'GET /admin/cs-managers/:manager_id/targets/:year/:month': ({ params }) => {
    const target = targets.find(
      (t) =>
        t.manager === params.manager_id &&
        t.year === Number(params.year) &&
        t.month === Number(params.month)
    );
    return target ? toTarget(target) : null;
  },

  'PUT /admin/cs-managers/:manager_id/targets/:year/:month': ({ params, body: raw }) => {
    const dto = body<{
      customers_allocated_target: number;
      customers_onboarded_target: number;
      tickets_resolved_target: number;
    }>(raw);
    const year = Number(params.year);
    const month = Number(params.month);
    let target = targets.find((t) => t.manager === params.manager_id && t.year === year && t.month === month);
    const now = new Date().toISOString();
    if (target) {
      target.customers_allocated_target = dto.customers_allocated_target;
      target.customers_onboarded_target = dto.customers_onboarded_target;
      target.tickets_resolved_target = dto.tickets_resolved_target;
      target.updatedAt = now;
    } else {
      target = {
        _id: `665fcstg${Date.now().toString(16).slice(-16)}`,
        manager: params.manager_id,
        year,
        month,
        ...dto,
        createdAt: now,
        updatedAt: now,
      };
      targets.push(target);
    }
    return toTarget(target);
  },

  'GET /admin/cs-managers/:manager_id/dashboard': ({ params, query }) =>
    dashboardFor(params.manager_id, query),

  'GET /admin/cs-managers/dashboard/all': ({ query }) => dashboardFor(null, query),

  // A dry run over the unassigned fixture, as the BE's: each waiting buyer goes
  // to the smallest book, recounted as it goes; ties to the longest-serving
  // manager. The mock has no orphaned assignments, so every one is eligible.
  'GET /admin/cs-managers/auto-assign/preview': () => {
    const pending = unassignedCustomers.length;
    if (pending > 0 && csManagers.length === 0) {
      return { status: 'no_managers', enabled: AUTO_ASSIGN_ENABLED, pending, assigned: 0, by_manager: [] };
    }
    const books = csManagers.map((m) => ({
      manager: m.managerId,
      customers: m.assigned_customers_count,
      from: new Date(m.assigned_from).getTime(),
    }));
    const byManager = new Map<string, number>();
    for (let i = 0; i < pending; i++) {
      const [book] = [...books].sort(
        (a, b) => a.customers - b.customers || a.from - b.from || a.manager.localeCompare(b.manager)
      );
      book.customers += 1;
      byManager.set(book.manager, (byManager.get(book.manager) ?? 0) + 1);
    }
    return {
      status: 'dry_run',
      enabled: AUTO_ASSIGN_ENABLED,
      pending,
      assigned: pending,
      by_manager: [...byManager].map(([manager_id, assigned]) => ({ manager_id, assigned })),
    };
  },

  'GET /admin/payment-plans/:plan_id/onboarding-attempts': ({ params }) =>
    onboardingAttempts
      .filter((a) => a.plan_id === params.plan_id)
      .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
      .map((a) => ({
        id: a._id,
        payment_plan: a.plan_id,
        customer: a.customer_id,
        csm: '665fadmn00000000000000d2',
        outcome: a.outcome,
        land_choice_reason: a.land_choice_reason,
        notes: a.notes,
        called_at: a.called_at,
        createdAt: a.createdAt,
      })),

  'POST /admin/payment-plans/:plan_id/onboarding-attempts': ({ params, body: raw }) => {
    const plan = findPlan(params.plan_id);
    const dto = body<{ outcome: 'done' | 'spoke' | 'no_answer' | 'rescheduled'; land_choice_reason?: string; notes?: string }>(raw);
    // LogOnboardingCallDto: an empty reason is no reason; anything else must be on the list.
    const reason = dto.land_choice_reason === '' ? undefined : dto.land_choice_reason;
    if (reason !== undefined && !(LAND_CHOICE_REASONS as readonly string[]).includes(reason)) {
      throw new MockHttpError(
        400,
        `land_choice_reason must be one of the following values: ${LAND_CHOICE_REASONS.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }
    const now = new Date().toISOString();
    const attempt: MockOnboardingAttempt = {
      _id: `665fcsat${Date.now().toString(16).slice(-16)}`,
      plan_id: plan.plan_id,
      customer_id: plan.customer_id,
      outcome: dto.outcome,
      land_choice_reason: reason ?? null,
      notes: dto.notes ?? null,
      called_at: now,
      createdAt: now,
    };
    onboardingAttempts.push(attempt);
    if (dto.outcome === 'done') plan.onboarding = 'confirmed';
    else if (plan.onboarding !== 'confirmed') plan.onboarding = 'call_pending';
    plan.last_activity_at = now;

    return {
      id: attempt._id,
      payment_plan: attempt.plan_id,
      customer: attempt.customer_id,
      csm: plan.manager,
      outcome: attempt.outcome,
      land_choice_reason: attempt.land_choice_reason,
      notes: attempt.notes,
      called_at: attempt.called_at,
      createdAt: attempt.createdAt,
    };
  },
};
