import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';
import { findPerson } from './people';

/* ============================================================
 * CS Managers mocks — role management, targets, unassigned customers, the
 * admin picker (`GET /admin/admins`, claimed here narrowly — no other
 * feature has migrated off GraphQL for it yet; extend rather than
 * re-register when roles-permissions migrates), the performance dashboard,
 * and per-plan onboarding-call / deed-delivery actions.
 *
 * The dashboard mock is a simplified stand-in for `csm-dashboard.derive.ts`
 * (CSM-21) — same filter/backlog/portfolio semantics, computed over a fixed
 * plan fixture set per manager rather than a real aggregation.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

type MockAdmin = {
  _id: string;
  userName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'admin' | 'subadmin' | 'moderator' | 'viewer';
};

const ADMINS: MockAdmin[] = [
  { _id: '665fadmn00000000000000d1', userName: 'ngozi.eze', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.eze@abodeflex.com', role: 'admin' },
  { _id: '665fadmn00000000000000d2', userName: 'chuka.obi', firstName: 'Chuka', lastName: 'Obi', email: 'chuka.obi@abodeflex.com', role: 'subadmin' },
  { _id: '665fadmn00000000000000d3', userName: 'amina.bello', firstName: 'Amina', lastName: 'Bello', email: 'amina.bello@abodeflex.com', role: 'subadmin' },
  { _id: '665fadmn00000000000000d4', userName: 'tolu.adeyemi', firstName: 'Tolu', lastName: 'Adeyemi', email: 'tolu.adeyemi@abodeflex.com', role: 'moderator' },
  { _id: '665fadmn00000000000000d5', userName: 'femi.oke', firstName: 'Femi', lastName: 'Oke', email: 'femi.oke@abodeflex.com', role: 'subadmin' },
];

const findAdmin = (id: string) => ADMINS.find((a) => a._id === id);

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
  deeds_delivered_target: number;
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
    deeds_delivered_target: 12,
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
  deeds_delivered_target: t.deeds_delivered_target,
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
  product: 'flex' | 'full_ownership';
  purchase_date: string;
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
    product: 'flex',
    purchase_date: daysAgo(3),
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
    product: 'full_ownership',
    purchase_date: daysAgo(90),
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
    product: 'full_ownership',
    purchase_date: daysAgo(45),
    payment_status: 'completed',
    payment_label: 'Fully paid',
    onboarding: 'confirmed',
    allocation: 'allocated',
    allocation_label: 'Allocated',
    doa: 'not_sent',
    doa_label: null,
    last_activity_at: daysAgo(10),
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

const PLAN_FILTERS: Record<string, (p: MockPlan) => boolean> = {
  due_allocation: (p) => p.allocation === 'awaiting',
  onboarding_pending: (p) => p.onboarding === 'call_pending' || p.onboarding === 'disputed',
  due_doa: (p) => p.doa === 'not_sent',
  defaulting_soon: (p) => p.payment_status === 'close_to_default',
  completed_payment: (p) => p.payment_status === 'completed',
};

function derive(managerPlans: MockPlan[]) {
  const now = new Date();

  const allocationBacklog = emptyAgeSplit();
  const doaBacklog = emptyAgeSplit();
  let onboardingCallPending = 0;
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
    if (p.onboarding === 'call_pending') onboardingCallPending += 1;
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
    filter_counts: {
      all: managerPlans.length,
      due_allocation: managerPlans.filter(PLAN_FILTERS.due_allocation).length,
      onboarding_pending: managerPlans.filter(PLAN_FILTERS.onboarding_pending).length,
      due_doa: managerPlans.filter(PLAN_FILTERS.due_doa).length,
      defaulting_soon: managerPlans.filter(PLAN_FILTERS.defaulting_soon).length,
      completed_payment: managerPlans.filter(PLAN_FILTERS.completed_payment).length,
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
    },
    prior_plans_count: p.prior_plans_count,
    asset: p.asset,
    product: p.product,
    purchase_date: p.purchase_date,
    payment_status: p.payment_status,
    payment_label: p.payment_label,
    onboarding: p.onboarding,
    allocation: p.allocation,
    allocation_label: p.allocation_label,
    doa: p.doa,
    doa_label: p.doa_label,
    last_activity_at: p.last_activity_at,
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
      deeds_delivered_target: number;
    }>(raw);
    const year = Number(params.year);
    const month = Number(params.month);
    let target = targets.find((t) => t.manager === params.manager_id && t.year === year && t.month === month);
    const now = new Date().toISOString();
    if (target) {
      target.customers_allocated_target = dto.customers_allocated_target;
      target.customers_onboarded_target = dto.customers_onboarded_target;
      target.deeds_delivered_target = dto.deeds_delivered_target;
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

  'GET /admin/cs-managers/:manager_id/dashboard': ({ params, query }) => {
    const admin = findAdmin(params.manager_id);
    const now = new Date();
    const year = Number(query.year ?? now.getUTCFullYear());
    const month = Number(query.month ?? now.getUTCMonth() + 1);
    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();

    const managerPlans = plans.filter((p) => p.manager === params.manager_id);
    const { backlogs, portfolio, filter_counts } = derive(managerPlans);

    const target = targets.find((t) => t.manager === params.manager_id && t.year === year && t.month === month);
    const targetsOut = {
      allocated_target: target?.customers_allocated_target ?? 0,
      allocated_so_far: managerPlans.filter((p) => p.allocation === 'allocated').length,
      onboarded_target: target?.customers_onboarded_target ?? 0,
      onboarded_so_far: managerPlans.filter((p) => p.onboarding === 'confirmed').length,
      deeds_delivered_target: target?.deeds_delivered_target ?? 0,
      deeds_delivered_so_far: managerPlans.filter((p) => p.doa === 'sent').length,
    };

    const ratio = (actual: number, tgt: number) => (tgt > 0 ? Math.min(actual / tgt, 1) * 100 : 0);
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const allocatedComponent = round1(ratio(targetsOut.allocated_so_far, targetsOut.allocated_target) * 0.4);
    const onboardedComponent = round1(ratio(targetsOut.onboarded_so_far, targetsOut.onboarded_target) * 0.3);
    const deedsComponent = round1(ratio(targetsOut.deeds_delivered_so_far, targetsOut.deeds_delivered_target) * 0.3);

    let filtered = managerPlans;
    const filterKey = String(query.filter ?? 'all');
    if (filterKey !== 'all' && PLAN_FILTERS[filterKey]) {
      filtered = filtered.filter(PLAN_FILTERS[filterKey]);
    }
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((p) => {
        const person = findPerson(p.customer_id);
        const name = person ? `${person.firstName} ${person.lastName}`.toLowerCase() : '';
        return name.includes(search) || (person?.email.toLowerCase().includes(search) ?? false);
      });
    }
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );

    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.max(1, Number(query.limit ?? 20) || 20);
    const start_idx = (page - 1) * limit;
    const pageRows = sorted.slice(start_idx, start_idx + limit).map(toPlanRow);

    return {
      period: { period_type: 'MONTH', month, year, start, end },
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
        score: round1(allocatedComponent + onboardedComponent + deedsComponent),
        allocated_component: allocatedComponent,
        onboarded_component: onboardedComponent,
        deeds_component: deedsComponent,
      },
      obligation: { paid_not_allocated_this_period: filter_counts.due_allocation },
      backlogs,
      portfolio,
      plans: pageRows,
      plans_total: filtered.length,
      filter_counts,
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
    const now = new Date().toISOString();
    const attempt: MockOnboardingAttempt = {
      _id: `665fcsat${Date.now().toString(16).slice(-16)}`,
      plan_id: plan.plan_id,
      customer_id: plan.customer_id,
      outcome: dto.outcome,
      land_choice_reason: dto.land_choice_reason ?? null,
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

  'POST /admin/payment-plans/:plan_id/mark-deed-delivered': ({ params }) => {
    const plan = findPlan(params.plan_id);
    const now = new Date().toISOString();
    if (plan.doa === 'sent') {
      return {
        plan_id: plan.plan_id,
        deed_delivered_at: plan.last_activity_at,
        deed_delivered_by: plan.manager,
        was_already_delivered: true,
      };
    }
    if (plan.doa === 'not_applicable') {
      throw new MockHttpError(400, 'This plan is not eligible for a Deed of Assignment yet', 'PLAN_NOT_ELIGIBLE_FOR_DOA');
    }
    plan.doa = 'sent';
    plan.doa_label = 'Delivered';
    plan.last_activity_at = now;
    return {
      plan_id: plan.plan_id,
      deed_delivered_at: now,
      deed_delivered_by: plan.manager,
      was_already_delivered: false,
    };
  },
};
