import { ONBOARDING_OUTCOMES, BULK_ASSIGN_MAX } from '@/features/associate-managers/schemas/associate-manager.schema';
import {
  SINGLE_SCOPE_ONLY_GROUPS,
  PRO_GROUPS,
  PRO_SORTS,
} from '@/features/associate-managers/schemas/manager-dashboard.schema';
import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';
import { ADMINS, findAdmin } from './cs-managers';
import { findPerson } from './people';
import { applyListFilters } from './sales';
import { mockCan, mockHoldsRecord, requireMockPermission, requireSession } from './auth';

/* ============================================================
 * Associate Manager Tracker mocks — /admin/managers/* and
 * /admin/pros/:pro_id/onboarding-attempts.
 *
 * Mirrors `abode-be-v2/src/modules/associate-manager` as the FE schemas
 * transcribe it. Every `:manager_id` is the ADMIN id (`manager_id`), never the
 * AssociateManager document id.
 *
 * Who is a manager. The `as-<role>` test logins that hold the manager record
 * (mockHoldsRecord) are a manager themselves — their roster is the `SELF`
 * fixtures below, keyed to whichever admin id the session carries. Any other
 * login (the default super admin) is not a manager, so those same pros sit in
 * the unassigned pool and the Admin view has three other teams to pick from.
 *
 * Guards follow the BE: the list, other teams, the combined view and the
 * unassigned pool need `view_manager_tracker`; the system dashboard needs
 * `view_associate_performance`; writes need `manage_manager_tracker`, and moving
 * one pro `reassign_manager`. A manager always reaches their own team.
 *
 * Not mocked: the roster / sales-record CSV exports. The real routes stream
 * with @SkipTransform and the FE hooks refuse in mock mode themselves.
 *
 * Team sales is the sales mock's list re-pointed at the roster: each sale is
 * dealt to one of the fixture pros who sell, so a team's record is non-empty
 * without a second set of sales fixtures that could drift from sales.ts.
 * ============================================================ */

const DAY = 86_400_000;
const SELF = 'self';

/** `monthsBack` months ago on `day`, never in the future, so "this month" always has data. */
function at(monthsBack: number, day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1, 10, 0, 0);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return (d > now ? new Date(now.getTime() - 3_600_000) : d).toISOString();
}

const timeOf = (iso: string | null | undefined): number => (iso ? new Date(iso).getTime() : 0);
const docId = (n: number) => `665fa1${'0'.repeat(16)}${String(n).padStart(2, '0')}`;
const proId = (n: number) => `665fa0${'0'.repeat(14)}${String(n).padStart(4, '0')}`;

/* ------------------------------ managers ------------------------------ */

type MockManager = {
  id: string;
  manager_id: string;
  display_name: string | null;
  phone_number: string | null;
  whatsapp_group_link: string | null;
  createdAt: string;
  updatedAt: string;
};

const NGOZI = ADMINS[0]._id;
const TOLU = ADMINS[3]._id;
const FEMI = ADMINS[4]._id;

const BASE_MANAGERS: MockManager[] = [
  { id: docId(1), manager_id: NGOZI, display_name: 'Ngozi Eze', phone_number: '+2348031112222', whatsapp_group_link: 'https://chat.whatsapp.com/ngozi-team', createdAt: at(9, 4), updatedAt: at(1, 3) },
  { id: docId(2), manager_id: TOLU, display_name: 'Tolu Adeyemi', phone_number: '+2348045556666', whatsapp_group_link: null, createdAt: at(6, 12), updatedAt: at(2, 8) },
  { id: docId(3), manager_id: FEMI, display_name: null, phone_number: null, whatsapp_group_link: null, createdAt: at(2, 20), updatedAt: at(2, 20) },
];

const added: MockManager[] = [];
const removed = new Set<string>();
const privateFlags = new Map<string, boolean>();

/** The signed-in test login's own manager id, or null when they hold no manager record. */
function selfManagerId(): string | null {
  return mockHoldsRecord('associate_manager') ? requireSession().id : null;
}

function selfManager(): MockManager | null {
  const id = selfManagerId();
  if (!id) return null;
  const admin = requireSession();
  return {
    id: docId(0),
    manager_id: id,
    display_name: `${admin.firstName} ${admin.lastName}`,
    phone_number: null,
    whatsapp_group_link: null,
    createdAt: at(6, 1),
    updatedAt: at(1, 1),
  };
}

function allManagers(): MockManager[] {
  const others = [...BASE_MANAGERS, ...added]
    .filter((m) => !removed.has(m.manager_id))
    .sort((a, b) => (a.display_name ?? 'zzz').localeCompare(b.display_name ?? 'zzz'));
  const self = selfManager();
  return self ? [self, ...others] : others;
}

function findManager(managerId: string): MockManager {
  const found = allManagers().find((m) => m.manager_id === managerId);
  if (!found) throw new MockHttpError(404, 'Associate manager not found', 'MANAGER_NOT_FOUND');
  return found;
}

/* -------------------------------- pros -------------------------------- */

type MockPro = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  recruited_at: string;
  upgraded_at: string | null;
  onboarded_at: string | null;
  last_login: string | null;
  sales: { at: string; amount: number; recurring: boolean }[];
  recruited_by: string | null;
};

type Ymd = [monthsBack: number, day: number];
type Sale = [monthsBack: number, day: number, amount: number, recurring?: boolean];
type Row = [
  n: number,
  who: string | [string, string],
  owner: string | null,
  recruited: Ymd,
  upgraded: Ymd | null,
  onboarded: Ymd | null,
  login: Ymd | null,
  sales: Sale[],
  recruitedBy: number | null,
];

/**
 * 22 pros spread over four teams plus an unassigned pool, with dates relative to
 * today so every period filter has something in it: recruited and onboarded this
 * month, a recurring seller, an inactive and two abandoned pros, one
 * recruiter-of-many, and a pro who upgraded without ever being onboarded.
 * `who` is a PEOPLE id (so the name matches the rest of the mocks) or a name.
 */
const ROWS: Row[] = [
  [1, '665fcccc00000000000000c1', SELF, [6, 10], [5, 3], [5, 12], [0, 20], [[3, 5, 4_500_000], [2, 8, 1_800_000, true], [1, 9, 1_800_000, true], [0, 2, 1_800_000, true]], null],
  [2, '665fcccc00000000000000c3', SELF, [4, 2], [3, 14], [3, 20], [0, 19], [[1, 15, 3_200_000], [0, 4, 3_200_000]], 1],
  [3, '665fcccc00000000000000c4', SELF, [2, 18], null, [2, 25], [0, 12], [], 1],
  [4, ['Hauwa', 'Garba'], SELF, [1, 5], [0, 1], [1, 9], [0, 18], [[0, 3, 2_400_000]], 2],
  [5, '665fcccc00000000000000c6', SELF, [0, 2], null, null, [0, 2], [], 1],
  [6, ['Rotimi', 'Ojo'], SELF, [0, 1], null, [0, 2], [0, 3], [], null],
  [7, ['Bukola', 'Ajayi'], NGOZI, [7, 4], [6, 2], [6, 10], [0, 10], [[5, 3, 6_000_000], [4, 10, 2_100_000, true], [3, 10, 2_100_000, true], [2, 10, 2_100_000, true], [1, 10, 2_100_000, true], [0, 5, 2_100_000, true]], null],
  [8, ['Emeka', 'Nwafor'], NGOZI, [5, 9], [4, 20], [4, 28], [1, 20], [[3, 2, 3_900_000]], 7],
  [9, ['Yetunde', 'Alabi'], NGOZI, [3, 12], null, [3, 18], [2, 8], [], 7],
  [10, ['Musa', 'Danjuma'], NGOZI, [1, 22], null, null, [1, 22], [], null],
  [11, ['Chiamaka', 'Eze'], NGOZI, [0, 3], [0, 4], [0, 5], [0, 6], [[0, 6, 5_000_000]], 7],
  [12, ['Damilola', 'Fashola'], TOLU, [8, 1], [7, 5], [7, 9], [0, 15], [[6, 3, 7_500_000], [3, 18, 2_700_000], [0, 7, 2_700_000]], null],
  [13, ['Obinna', 'Mba'], TOLU, [6, 15], null, [6, 20], [4, 2], [], 12],
  [14, ['Zainab', 'Lawal'], TOLU, [2, 7], [1, 6], [1, 10], [0, 11], [[1, 12, 1_500_000], [0, 8, 1_500_000, true]], 12],
  [15, ['Tobenna', 'Agu'], TOLU, [0, 4], null, null, [0, 4], [], 14],
  [16, ['Aisha', 'Mohammed'], TOLU, [10, 3], null, [10, 9], [6, 5], [], null],
  [17, ['Gbenga', 'Salako'], FEMI, [4, 8], [3, 2], [3, 9], [0, 14], [[2, 7, 4_100_000], [0, 9, 4_100_000]], null],
  [18, ['Nkechi', 'Umeh'], FEMI, [1, 3], null, [1, 6], [0, 16], [], 17],
  [19, ['Ayodele', 'Bamidele'], FEMI, [0, 1], null, null, [0, 1], [], 17],
  [20, ['Patience', 'Okon'], null, [1, 28], null, null, [0, 7], [], null],
  [21, ['Sadiq', 'Yusuf'], null, [0, 2], null, null, [0, 2], [], 7],
  [22, ['Folake', 'Adeniyi'], null, [7, 6], [6, 20], [6, 28], [3, 3], [[5, 5, 2_000_000]], null],
];

const ymd = ([m, d]: Ymd) => at(m, d);

/** A pro that is also a PEOPLE fixture keeps that id, so its name matches every other mock. */
const idOf = ([n, who]: Row): string => (typeof who === 'string' ? findPerson(who)?._id : undefined) ?? proId(n);

/** `recruitedBy` names another row by number, so the ids are fixed before any pro is built. */
const ID_BY_N = new Map(ROWS.map((row) => [row[0], idOf(row)]));

const PROS: MockPro[] = ROWS.map((row) => {
  const [n, who, , recruited, upgraded, onboarded, login, sales, by] = row;
  const person = typeof who === 'string' ? findPerson(who) : undefined;
  const [first, last] = person ? [person.firstName, person.lastName] : (who as [string, string]);
  return {
    id: idOf(row),
    first_name: first,
    last_name: last,
    email: person?.email ?? `${first}.${last}@example.com`.toLowerCase(),
    phone_number: person?.phoneNumber ?? `+23481000${String(n).padStart(5, '0')}`,
    recruited_at: ymd(recruited),
    upgraded_at: upgraded ? ymd(upgraded) : null,
    onboarded_at: onboarded ? ymd(onboarded) : null,
    last_login: login ? ymd(login) : null,
    sales: sales.map(([m, d, amount, recurring]) => ({ at: at(m, d), amount, recurring: recurring === true })),
    recruited_by: by === null ? null : (ID_BY_N.get(by) ?? null),
  };
});

const PRO_BY_ID = new Map(PROS.map((p) => [p.id, p]));

/** pro id → SELF | manager admin id | null. Mutated by reassign and bulk-assign. */
const owners = new Map<string, string | null>(ROWS.map((row) => [idOf(row), row[2]]));

function ownerOf(pro: MockPro): string | null {
  const key = owners.get(pro.id) ?? null;
  return key === SELF ? selfManagerId() : key;
}

/** Store the session's own id as SELF, so the roster follows whichever admin id signs in. */
function setOwner(pro: MockPro, managerId: string): void {
  owners.set(pro.id, managerId === selfManagerId() ? SELF : managerId);
}

const rosterOf = (managerId: string) => PROS.filter((p) => ownerOf(p) === managerId);

const proSummary = (p: MockPro) => ({
  pro_id: p.id,
  first_name: p.first_name,
  last_name: p.last_name,
  email: p.email,
  phone_number: p.phone_number,
});

function listItem(m: MockManager, full = false) {
  const roster = rosterOf(m.manager_id);
  return {
    id: m.id,
    manager_id: m.manager_id,
    display_name: m.display_name,
    phone_number: m.phone_number,
    whatsapp_group_link: m.whatsapp_group_link,
    is_private: privateFlags.get(m.manager_id) ?? false,
    roster_size: roster.length,
    associate_pros: (full ? roster : roster.slice(0, 5)).map(proSummary),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/* ------------------------------- guards ------------------------------- */

const has = mockCan;
const allow = requireMockPermission;

function requireSelfManager(): string {
  const id = selfManagerId();
  if (!id) throw new MockHttpError(403, 'You are not an associate manager', 'NOT_A_MANAGER');
  return id;
}

/** Reading a team: your own on any role, anyone else's with `view_manager_tracker`. */
function viewTeam(managerId: string): MockManager {
  if (managerId !== selfManagerId() && !has('view_manager_tracker')) {
    throw new MockHttpError(403, "This is not your team, and you don't have the manager tracker permission", 'NOT_YOUR_TEAM');
  }
  return findManager(managerId);
}

/* ------------------------------ targets ------------------------------ */

type StoredTarget = {
  key: string;
  month: number;
  year: number;
  recruited?: number;
  selling?: number;
  revenue?: number;
  score?: number;
  updatedAt: string;
};

const nowMonth = () => new Date().getMonth() + 1;
const nowYear = () => new Date().getFullYear();
const prevMonth = () => (nowMonth() === 1 ? { month: 12, year: nowYear() - 1 } : { month: nowMonth() - 1, year: nowYear() });

/** Femi's current month has no revenue target: a goal nobody set arrives as null, not 0. */
const targets: StoredTarget[] = [
  { key: SELF, month: nowMonth(), year: nowYear(), recruited: 6, selling: 4, revenue: 12_000_000, score: 80, updatedAt: at(0, 1) },
  { key: SELF, ...prevMonth(), recruited: 5, selling: 4, revenue: 10_000_000, score: 75, updatedAt: at(1, 1) },
  { key: NGOZI, month: nowMonth(), year: nowYear(), recruited: 4, selling: 4, revenue: 14_000_000, score: 80, updatedAt: at(0, 1) },
  { key: TOLU, month: nowMonth(), year: nowYear(), recruited: 5, selling: 3, revenue: 8_000_000, score: 70, updatedAt: at(0, 2) },
  { key: FEMI, month: nowMonth(), year: nowYear(), recruited: 3, selling: 2, updatedAt: at(0, 2) },
];

const keyOf = (managerId: string) => (managerId === selfManagerId() ? SELF : managerId);
const findTarget = (managerId: string, month: number, year: number) =>
  targets.find((t) => t.key === keyOf(managerId) && t.month === month && t.year === year);

const targetBody = (managerId: string, t: StoredTarget) => ({
  manager_id: managerId,
  month: t.month,
  year: t.year,
  associate_pro_recruited_target: t.recruited ?? 0,
  selling_associate_pro_target: t.selling ?? 0,
  revenue_target: t.revenue ?? 0,
  performance_score_target: t.score ?? 0,
  updatedAt: t.updatedAt,
});

/* ------------------------------ ratings ------------------------------ */

/** Peer ratings out of 5 (the UI prints "/ 5.00"); `count: 0` months are unrated, not scored zero. */
function ratingFor(managerId: string, monthsBack: number): { average: number; count: number } {
  let h = 0;
  for (const c of managerId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if ((h + monthsBack) % 4 === 0) return { average: 0, count: 0 };
  return { average: 3.2 + (((h >> 5) + monthsBack * 7) % 17) / 10, count: 2 + (((h >> 3) + monthsBack) % 5) };
}

/* ----------------------------- dashboards ----------------------------- */

type Win = { period_type: string; month: number | null; year: number | null; start: Date; end: Date };

/** `period_type` takes the BE's own words and the v1 spellings the FE sends. */
function windowOf(query: Record<string, unknown>): Win {
  const raw = String(query.period_type ?? 'MONTH');
  const type = raw.toUpperCase();
  const now = new Date();
  const month = (y: number, m: number): Win => ({
    period_type: raw,
    month: m,
    year: y,
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  });

  if (type === 'CUSTOM' && query.start_date && query.end_date) {
    return { period_type: raw, month: null, year: null, start: new Date(String(query.start_date)), end: new Date(String(query.end_date)) };
  }
  if (type === 'WEEK') return { period_type: raw, month: null, year: null, start: new Date(now.getTime() - 7 * DAY), end: now };
  if (type === 'YEAR' || type === 'THIS_YEAR' || type === 'LAST_YEAR') {
    const y = type === 'LAST_YEAR' ? nowYear() - 1 : Number(query.year) || nowYear();
    return { period_type: raw, month: null, year: y, start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) };
  }
  if (type === 'LAST_MONTH') {
    const { month: m, year: y } = prevMonth();
    return month(y, m);
  }
  const m = Number(query.month);
  const y = Number(query.year);
  if (type === 'MONTH' && m >= 1 && m <= 12 && y > 1970) return month(y, m);
  return month(nowYear(), nowMonth());
}

type Scope = { kind: 'manager'; managerId: string } | { kind: 'all' } | { kind: 'system' };

function scopePros(scope: Scope): MockPro[] {
  if (scope.kind === 'manager') return rosterOf(scope.managerId);
  if (scope.kind === 'all') return PROS.filter((p) => ownerOf(p) !== null);
  return PROS;
}

const statusOf = (p: MockPro): 'active' | 'inactive' | 'abandoned' => {
  const last = Math.max(timeOf(p.last_login), ...p.sales.map((s) => timeOf(s.at)));
  const days = (Date.now() - last) / DAY;
  return days <= 30 ? 'active' : days <= 90 ? 'inactive' : 'abandoned';
};

const totalRevenue = (p: MockPro) => p.sales.reduce((sum, s) => sum + s.amount, 0);
const recruitsOf = (p: MockPro) => PROS.filter((x) => x.recruited_by === p.id);
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 10 : 0);

const rosterRow = (p: MockPro) => ({
  id: p.id,
  first_name: p.first_name,
  last_name: p.last_name,
  email: p.email,
  phone_number: p.phone_number,
  status: statusOf(p),
  date_recruited: p.recruited_at,
  total_sales: p.sales.length,
  revenue_generated: totalRevenue(p),
  last_login: p.last_login,
  onboarded_at: p.onboarded_at,
});

const fullName = (p: MockPro) => `${p.first_name} ${p.last_name}`.toLowerCase();
const latest = (dates: (string | null)[]) => Math.max(0, ...dates.map(timeOf));

const SORTS: Record<string, (a: MockPro, b: MockPro) => number> = {
  name_asc: (a, b) => fullName(a).localeCompare(fullName(b)),
  name_desc: (a, b) => fullName(b).localeCompare(fullName(a)),
  sales_desc: (a, b) => b.sales.length - a.sales.length,
  revenue_desc: (a, b) => totalRevenue(b) - totalRevenue(a),
  recruited_desc: (a, b) => timeOf(b.recruited_at) - timeOf(a.recruited_at),
  last_login_desc: (a, b) => timeOf(b.last_login) - timeOf(a.last_login),
  onboarded_at_desc: (a, b) => timeOf(b.onboarded_at) - timeOf(a.onboarded_at),
  last_recruit_desc: (a, b) => latest(recruitsOf(b).map((r) => r.recruited_at)) - latest(recruitsOf(a).map((r) => r.recruited_at)),
  last_sale_desc: (a, b) => latest(b.sales.map((s) => s.at)) - latest(a.sales.map((s) => s.at)),
};

function targetsFor(scope: Scope, win: Win) {
  const month = win.month ?? nowMonth();
  const year = win.year ?? nowYear();
  const pick = (t: StoredTarget | undefined) => ({
    recruited: t?.recruited || null,
    selling: t?.selling || null,
    revenue: t?.revenue || null,
    score: t?.score || null,
  });
  if (scope.kind === 'manager') return pick(findTarget(scope.managerId, month, year));
  if (scope.kind === 'system') return pick(undefined);

  const rows = targets.filter((t) => t.month === month && t.year === year);
  const sum = (field: 'recruited' | 'selling' | 'revenue') => {
    const values = rows.map((t) => t[field]).filter((v): v is number => !!v);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  return { recruited: sum('recruited'), selling: sum('selling'), revenue: sum('revenue'), score: null };
}

function dashboard(scope: Scope, query: Record<string, unknown>) {
  const win = windowOf(query);
  const inWin = (iso: string | null | undefined) => !!iso && timeOf(iso) >= win.start.getTime() && timeOf(iso) <= win.end.getTime();
  const single = scope.kind === 'manager';
  const pros = scopePros(scope);
  const target = targetsFor(scope, win);

  const signups = pros.filter((p) => inWin(p.recruited_at));
  const upgrades = pros.filter((p) => inWin(p.upgraded_at));
  const onboarded = pros.filter((p) => inWin(p.onboarded_at));
  const fresh = onboarded.filter((p) => inWin(p.recruited_at));

  // §6.2: one manager's book credits individual pros; the org-wide scopes get
  // channels instead. The side that does not apply arrives zeroed, not absent.
  const noSource = { managed: 0, unassigned: 0, users: 0, associate: 0 };
  const signupSource = (list: MockPro[]) => {
    const out = { ...noSource };
    for (const p of list) {
      const recruiter = p.recruited_by ? PRO_BY_ID.get(p.recruited_by) : undefined;
      if (!recruiter) out.users += 1;
      else if (ownerOf(recruiter)) out.managed += 1;
      else out.unassigned += 1;
    }
    return out;
  };
  const contributors = (list: MockPro[]) => {
    const counts = new Map<string, number>();
    for (const p of list) if (p.recruited_by) counts.set(p.recruited_by, (counts.get(p.recruited_by) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, count]) => {
      const r = PRO_BY_ID.get(id)!;
      return { pro_id: r.id, first_name: r.first_name, last_name: r.last_name, email: r.email, count };
    });
    return { top, others: list.length - top.reduce((sum, c) => sum + c.count, 0) };
  };
  const signupCredit = contributors(signups);
  const upgradeCredit = contributors(upgrades);

  const salesIn = pros.flatMap((p) => p.sales.filter((s) => inWin(s.at)).map((s) => ({ pro: p, ...s })));
  const sellers = pros.filter((p) => p.sales.some((s) => inWin(s.at)));
  const revenue = salesIn.reduce((sum, s) => sum + s.amount, 0);
  const recurring = salesIn.filter((s) => s.recurring).reduce((sum, s) => sum + s.amount, 0);

  const byPro = new Map<string, number>();
  for (const s of salesIn) byPro.set(s.pro.id, (byPro.get(s.pro.id) ?? 0) + s.amount);
  const topSellers = [...byPro].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, amount]) => {
    const r = PRO_BY_ID.get(id)!;
    return { pro_id: r.id, first_name: r.first_name, last_name: r.last_name, email: r.email, amount };
  });

  const saleSource = (amountOf: (s: (typeof salesIn)[number]) => number) => {
    const out = { ...noSource };
    for (const s of salesIn) out[ownerOf(s.pro) ? 'managed' : 'unassigned'] += amountOf(s);
    return out;
  };

  const activeCount = pros.filter((p) => statusOf(p) === 'active').length;
  const inactiveCount = pros.filter((p) => statusOf(p) === 'inactive').length;
  const abandonedCount = pros.filter((p) => statusOf(p) === 'abandoned').length;
  const recent = (iso: string | null | undefined) => Date.now() - timeOf(iso) <= 30 * DAY;

  const firstSale = (p: MockPro) => Math.min(...p.sales.map((s) => timeOf(s.at)));
  const everSold = pros.filter((p) => p.sales.length > 0);
  const early = everSold.filter((p) => firstSale(p) - timeOf(p.onboarded_at ?? p.recruited_at) <= 30 * DAY).length;

  // The 50-30-20 score. An unset target contributes nothing rather than counting as met.
  const ratio = (so: number, goal: number | null) => (goal ? Math.min(so / goal, 1) : 0);
  const sellingComponent = Math.round(ratio(sellers.length, target.selling) * 50);
  const revenueComponent = Math.round(ratio(revenue, target.revenue) * 30);
  const recruitmentComponent = Math.round(ratio(signups.length, target.recruited) * 20);
  const score = sellingComponent + revenueComponent + recruitmentComponent;

  let rating = { average: 0, count: 0 };
  if (scope.kind === 'manager') {
    const end = win.end.getTime() > Date.now() ? new Date() : win.end;
    const back = (nowYear() - end.getFullYear()) * 12 + (nowMonth() - (end.getMonth() + 1));
    rating = ratingFor(scope.managerId, Math.max(0, back));
  }

  const group = String(query.pro_group ?? 'all');
  const sort = String(query.pro_sort ?? 'name_asc');
  const validGroup = (PRO_GROUPS as readonly string[]).includes(group) ? group : 'all';
  const groupFilters: Record<string, (p: MockPro) => boolean> = {
    all: () => true,
    active: (p) => statusOf(p) === 'active',
    inactive: (p) => statusOf(p) === 'inactive',
    abandoned: (p) => statusOf(p) === 'abandoned',
    recruited_in_period: (p) => inWin(p.recruited_at),
    upgraded_in_period: (p) => inWin(p.upgraded_at),
    onboarded_in_period: (p) => inWin(p.onboarded_at),
    selling_in_period: (p) => p.sales.some((s) => inWin(s.at)),
    selling: (p) => p.sales.some((s) => inWin(s.at)),
    recruited_not_onboarded: (p) => inWin(p.recruited_at) && !p.onboarded_at,
    active_recruiter: (p) => recruitsOf(p).some((r) => inWin(r.recruited_at)),
    recruiting: (p) => recruitsOf(p).some((r) => inWin(r.recruited_at)),
    active_promoter: (p) => recruitsOf(p).some((r) => inWin(r.upgraded_at)),
    active_revenue_generator: (p) => p.sales.some((s) => inWin(s.at)),
  };
  // "Who drove this" means nothing across dozens of managers: the BE answers an empty roster.
  const orgWideEmpty = !single && (SINGLE_SCOPE_ONLY_GROUPS as readonly string[]).includes(validGroup);
  const grouped = orgWideEmpty ? [] : pros.filter(groupFilters[validGroup]);
  const sorted = [...grouped].sort((SORTS[(PRO_SORTS as readonly string[]).includes(sort) ? sort : 'name_asc']));
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.max(1, Number(query.limit ?? 20) || 20);

  return {
    period: { period_type: win.period_type, month: win.month, year: win.year, start: win.start.toISOString(), end: win.end.toISOString() },
    target: {
      recruited_target: target.recruited,
      recruited_so_far: signups.length,
      selling_target: target.selling,
      selling_so_far: sellers.length,
      revenue_target: target.revenue,
      revenue_so_far: revenue,
      performance_score_target: target.score,
      performance_score_so_far: score,
    },
    recruitment: {
      new_signups_in_period: signups.length,
      upgrades_in_period: upgrades.length,
      onboarded_in_period: onboarded.length,
      onboarded_fresh_in_period: fresh.length,
      onboarded_carryover_in_period: onboarded.length - fresh.length,
      total_assigned: pros.length,
      onboarding_queue_count: pros.filter((p) => !p.onboarded_at).length,
      new_signups_by_source: single ? noSource : signupSource(signups),
      upgrades_by_source: single ? noSource : signupSource(upgrades),
      top_new_signups_contributors: single ? signupCredit.top : [],
      top_upgrades_contributors: single ? upgradeCredit.top : [],
      others_new_signups_count: single ? signupCredit.others : 0,
      others_upgrades_count: single ? upgradeCredit.others : 0,
      active_recruiting_pros_count: pros.filter(groupFilters.active_recruiter).length,
      active_promoting_pros_count: pros.filter(groupFilters.active_promoter).length,
    },
    sales_and_revenue: {
      selling_pros: sellers.length,
      selling_pros_target: target.selling,
      total_revenue: revenue,
      initial_sales_revenue: revenue - recurring,
      recurring_revenue: recurring,
      revenue_per_selling_pro: sellers.length ? Math.round(revenue / sellers.length) : 0,
      contract_size: salesIn.length ? Math.round(revenue / salesIn.length) : 0,
      sales_count_by_source: single ? noSource : saleSource(() => 1),
      revenue_by_source: single ? noSource : saleSource((s) => s.amount),
      top_selling_contributors: single ? topSellers : [],
      others_selling_revenue: single ? revenue - topSellers.reduce((sum, c) => sum + c.amount, 0) : 0,
      active_revenue_generating_pros_count: sellers.length,
    },
    activity: {
      active_count: activeCount,
      active_pct: pct(activeCount, pros.length),
      recent_login_count: pros.filter((p) => recent(p.last_login)).length,
      recent_sale_count: pros.filter((p) => p.sales.some((s) => recent(s.at))).length,
      recent_recruit_count: pros.filter((p) => recruitsOf(p).some((r) => recent(r.recruited_at))).length,
      inactive_count: inactiveCount,
      inactive_pct: pct(inactiveCount, pros.length),
      abandoned_count: abandonedCount,
      abandoned_pct: pct(abandonedCount, pros.length),
    },
    milestones: { early_sellers: early, late_first_sellers: everSold.length - early },
    performance_score: {
      score,
      selling_component: sellingComponent,
      revenue_component: revenueComponent,
      recruitment_component: recruitmentComponent,
      target: target.score,
      actual: rating.average,
      rating_count: rating.count,
    },
    associate_pros: sorted.slice((page - 1) * limit, page * limit).map(rosterRow),
    associate_pros_group_total: grouped.length,
  };
}

/* ---------------------------- team sales ---------------------------- */

const SELLERS = PROS.filter((p) => p.sales.length > 0);

function teamSales(roster: MockPro[], query: Record<string, unknown>) {
  const activeOnly = query.active_pros_only === true || query.active_pros_only === 'true';
  const ids = new Set(roster.filter((p) => !activeOnly || statusOf(p) !== 'abandoned').map((p) => p.id));
  const rows = applyListFilters(query).flatMap((row) => {
    let h = 0;
    for (const c of row.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const seller = SELLERS[h % SELLERS.length];
    if (!ids.has(seller.id)) return [];
    return [{ ...row, referrer: { id: seller.id, name: `${seller.first_name} ${seller.last_name}`, email: seller.email } }];
  });
  return paged(rows, query, 25);
}

/* ------------------------ onboarding attempts ------------------------ */

type Attempt = {
  _id: string;
  pro_id: string;
  admin: { _id: string; userName: string | null; firstName: string | null; lastName: string | null; email: string; role: string };
  outcome: (typeof ONBOARDING_OUTCOMES)[number];
  fields: Record<string, unknown>;
  createdAt: string;
};

const attempts = new Map<string, Attempt[]>();
let attemptCounter = 0;

const adminRef = (a: { _id: string; userName: string | null; firstName: string | null; lastName: string | null; email: string; role: string }) => ({
  _id: a._id,
  userName: a.userName,
  firstName: a.firstName,
  lastName: a.lastName,
  email: a.email,
  role: a.role,
});

function pushAttempt(proIdValue: string, attempt: Omit<Attempt, '_id' | 'pro_id'>): Attempt {
  const full: Attempt = { _id: `665fa2${'0'.repeat(14)}${String(++attemptCounter).padStart(4, '0')}`, pro_id: proIdValue, ...attempt };
  attempts.set(proIdValue, [...(attempts.get(proIdValue) ?? []), full]);
  return full;
}

// Two not-yet-onboarded pros already have history: one overdue reschedule, one not reached.
pushAttempt(proId(10), { admin: ADMINS[0], outcome: 'not_available', fields: { motivation: null }, createdAt: at(1, 24) });
pushAttempt(proId(10), {
  admin: ADMINS[0],
  outcome: 'rescheduled',
  fields: { reschedule_date: at(1, 27), reschedule_time_of_day: 'evening', reschedule_note: 'Asked for a call after work.' },
  createdAt: at(1, 25),
});
pushAttempt(proId(15), { admin: ADMINS[3], outcome: 'not_available', fields: {}, createdAt: at(0, 5) });

const attemptBody = (a: Attempt, index: number, all: Attempt[]) => {
  const latestOne = index === all.length - 1;
  const rescheduleDate = a.fields.reschedule_date as string | undefined;
  return {
    _id: a._id,
    pro_id: a.pro_id,
    admin_id: adminRef(a.admin),
    outcome: a.outcome,
    attempt_number: index + 1,
    is_overdue: latestOne && a.outcome === 'rescheduled' && !!rescheduleDate && timeOf(rescheduleDate) < Date.now(),
    ...a.fields,
    createdAt: a.createdAt,
  };
};

/* ------------------------------- routes ------------------------------- */

const findPro = (id: string): MockPro => {
  const pro = PRO_BY_ID.get(id);
  if (!pro) throw new MockHttpError(404, 'Associate pro not found', 'PRO_NOT_FOUND');
  return pro;
};

export const associateManagerRoutes: MockRoutes = {
  // A body, not a 403, for a non-manager.
  'GET /admin/managers/me': () => {
    requireSession();
    const self = selfManager();
    return self ? { is_manager: true, manager: listItem(self, true) } : { is_manager: false, manager: null };
  },

  'GET /admin/managers': ({ query }) => {
    allow('view_manager_tracker', 'You need the manager tracker permission to list managers');
    const q = query.q ? String(query.q).trim().toLowerCase() : '';
    const rows = allManagers()
      .filter((m) => !q || (m.display_name ?? '').toLowerCase().includes(q))
      .map((m) => listItem(m));
    return paged(rows, query, 20);
  },

  'POST /admin/managers': ({ body: raw }) => {
    allow('manage_manager_tracker', 'You need permission to manage the manager tracker');
    const { admin_id, display_name, phone_number, whatsapp_group_link } = body<{
      admin_id?: string;
      display_name?: string;
      phone_number?: string;
      whatsapp_group_link?: string;
    }>(raw);
    const admin = admin_id ? findAdmin(admin_id) : undefined;
    if (!admin) throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
    if (allManagers().some((m) => m.manager_id === admin._id)) {
      throw new MockHttpError(409, 'This admin is already an associate manager', 'ALREADY_A_MANAGER');
    }
    if (phone_number && !/^\+[1-9]\d{7,14}$/.test(phone_number)) {
      throw new MockHttpError(400, 'phone_number must be a valid E.164 phone number');
    }
    const manager: MockManager = {
      id: docId(10 + added.length),
      manager_id: admin._id,
      display_name: display_name?.trim() || `${admin.firstName} ${admin.lastName}`,
      phone_number: phone_number ?? null,
      whatsapp_group_link: whatsapp_group_link ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    added.push(manager);
    return listItem(manager);
  },

  'GET /admin/managers/unassigned-pros': ({ query }) => {
    allow('view_manager_tracker', 'You need the manager tracker permission to see unassigned pros');
    const q = query.q ? String(query.q).trim().toLowerCase() : '';
    const rows = PROS.filter((p) => ownerOf(p) === null)
      .filter((p) => !q || `${fullName(p)} ${p.email}`.includes(q))
      .map(proSummary);
    return paged(rows, query, 20);
  },

  'GET /admin/managers/dashboard': ({ query }) => dashboard({ kind: 'manager', managerId: requireSelfManager() }, query),

  'GET /admin/managers/dashboard/all': ({ query }) => {
    allow('view_manager_tracker', 'You need the manager tracker permission for the combined view');
    return dashboard({ kind: 'all' }, query);
  },

  'GET /admin/managers/dashboard/system': ({ query }) => {
    allow('view_associate_performance', 'You need the associate performance permission for the system dashboard');
    return dashboard({ kind: 'system' }, query);
  },

  'GET /admin/managers/sales-record': ({ query }) => teamSales(rosterOf(requireSelfManager()), query),

  'GET /admin/managers/:manager_id': ({ params }) => {
    allow('view_manager_tracker', 'You need the manager tracker permission to open a manager');
    return listItem(findManager(params.manager_id), true);
  },

  'DELETE /admin/managers/:manager_id': ({ params }) => {
    allow('manage_manager_tracker', 'You need permission to manage the manager tracker');
    const manager = findManager(params.manager_id);
    if (manager.manager_id === selfManagerId()) {
      throw new MockHttpError(400, 'This test login is a manager through its mock record. Sign in as someone else to change that.', 'MOCK_SELF');
    }
    const roster = rosterOf(manager.manager_id);
    if (roster.length > 0) {
      throw new MockHttpError(400, 'This manager still has associate pros. Reassign them first.', 'MANAGER_HAS_ROSTER', {
        manager_id: manager.manager_id,
        pros_to_reassign: roster.map(proSummary),
      });
    }
    removed.add(manager.manager_id);
    return { success: true, message: 'Associate manager removed', results: [] };
  },

  'PATCH /admin/managers/:manager_id/private': ({ params, body: raw }) => {
    allow('manage_manager_tracker', 'You need permission to manage the manager tracker');
    const manager = findManager(params.manager_id);
    const { is_private } = body<{ is_private?: unknown }>(raw);
    if (typeof is_private !== 'boolean') throw new MockHttpError(400, 'is_private must be a boolean value');
    privateFlags.set(manager.manager_id, is_private);
    return listItem(manager);
  },

  'GET /admin/managers/:manager_id/dashboard': ({ params, query }) => {
    const manager = viewTeam(params.manager_id);
    return dashboard({ kind: 'manager', managerId: manager.manager_id }, query);
  },

  'GET /admin/managers/:manager_id/sales-record': ({ params, query }) => {
    const manager = viewTeam(params.manager_id);
    return teamSales(rosterOf(manager.manager_id), query);
  },

  // There is no self route: a manager names their own id, which the BE accepts on any role.
  'GET /admin/managers/:manager_id/rating-series': ({ params, query }) => {
    const manager = viewTeam(params.manager_id);
    const monthsBack = Math.min(24, Math.max(1, Number(query.months_back ?? 6) || 6));
    return Array.from({ length: monthsBack }, (_, i) => {
      const back = monthsBack - 1 - i;
      const d = new Date(nowYear(), nowMonth() - 1 - back, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear(), ...ratingFor(manager.manager_id, back) };
    });
  },

  'GET /admin/managers/:manager_id/targets': ({ params }) => {
    const manager = viewTeam(params.manager_id);
    return targets
      .filter((t) => t.key === keyOf(manager.manager_id))
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month))
      .map((t) => targetBody(manager.manager_id, t));
  },

  // null, not a zeroed target, for a month nobody set.
  'GET /admin/managers/:manager_id/targets/:year/:month': ({ params }) => {
    const manager = viewTeam(params.manager_id);
    const found = findTarget(manager.manager_id, Number(params.month), Number(params.year));
    return found ? targetBody(manager.manager_id, found) : null;
  },

  'PUT /admin/managers/:manager_id/targets/:year/:month': ({ params, body: raw }) => {
    allow('manage_manager_tracker', 'You need permission to manage the manager tracker');
    const manager = findManager(params.manager_id);
    const month = Number(params.month);
    const year = Number(params.year);
    if (!(month >= 1 && month <= 12) || !(year > 1970)) throw new MockHttpError(400, 'month must be 1-12 and year a valid year');

    const values = body<Record<string, unknown>>(raw);
    const fields: Record<string, 'recruited' | 'selling' | 'revenue' | 'score'> = {
      associate_pro_recruited_target: 'recruited',
      selling_associate_pro_target: 'selling',
      revenue_target: 'revenue',
      performance_score_target: 'score',
    };
    for (const key of Object.keys(values)) {
      if (!fields[key]) throw new MockHttpError(400, `property ${key} should not exist`);
      if (typeof values[key] !== 'number' || (values[key] as number) < 0) {
        throw new MockHttpError(400, `${key} must be a number not less than 0`);
      }
    }

    // An omitted field is left alone, not reset.
    let stored = findTarget(manager.manager_id, month, year);
    if (!stored) {
      stored = { key: keyOf(manager.manager_id), month, year, updatedAt: new Date().toISOString() };
      targets.push(stored);
    }
    for (const [key, field] of Object.entries(fields)) {
      if (values[key] !== undefined) stored[field] = values[key] as number;
    }
    stored.updatedAt = new Date().toISOString();
    return targetBody(manager.manager_id, stored);
  },

  'POST /admin/managers/:manager_id/pros': ({ params, body: raw }) => {
    allow('manage_manager_tracker', 'You need permission to manage the manager tracker');
    const manager = findManager(params.manager_id);
    const { pro_ids } = body<{ pro_ids?: string[] }>(raw);
    if (!Array.isArray(pro_ids) || pro_ids.length === 0) throw new MockHttpError(400, 'pro_ids must contain at least 1 element');
    if (pro_ids.length > BULK_ASSIGN_MAX) throw new MockHttpError(400, `pro_ids must contain no more than ${BULK_ASSIGN_MAX} elements`);

    const moving = pro_ids.map(findPro);
    const from = new Set<string>();
    let moved = 0;
    for (const pro of moving) {
      const current = ownerOf(pro);
      if (current === manager.manager_id) continue;
      if (current) from.add(current);
      setOwner(pro, manager.manager_id);
      moved += 1;
    }
    return { manager: listItem(manager), reassigned_count: moved, from_managers: [...from], to_manager: manager.manager_id };
  },

  // Moving a pro to the manager who already holds them is a no-op.
  'POST /admin/managers/pros/:pro_id/reassign': ({ params, body: raw }) => {
    allow('reassign_manager', 'You need permission to reassign associate pros');
    const pro = findPro(params.pro_id);
    const { to_manager_id } = body<{ to_manager_id?: string }>(raw);
    if (!to_manager_id) throw new MockHttpError(400, 'to_manager_id should not be empty');
    const target = findManager(to_manager_id);
    if (ownerOf(pro) !== target.manager_id) setOwner(pro, target.manager_id);
    return listItem(target);
  },

  'GET /admin/pros/:pro_id/onboarding-attempts': ({ params }) => {
    requireSession();
    findPro(params.pro_id);
    const list = attempts.get(params.pro_id) ?? [];
    return list.map(attemptBody).reverse();
  },

  'POST /admin/pros/:pro_id/onboarding-attempts': ({ params, body: raw }) => {
    const admin = requireSession();
    const pro = findPro(params.pro_id);
    const own = ownerOf(pro) !== null && ownerOf(pro) === selfManagerId();
    if (!own && !has('manage_manager_tracker')) {
      throw new MockHttpError(403, 'Only the pro\'s manager can log an onboarding call', 'NOT_YOUR_TEAM');
    }

    const values = body<Record<string, unknown>>(raw);
    const outcome = values.outcome as Attempt['outcome'];
    if (!ONBOARDING_OUTCOMES.includes(outcome)) {
      throw new MockHttpError(400, `outcome must be one of the following values: ${ONBOARDING_OUTCOMES.join(', ')}`);
    }
    const history = attempts.get(pro.id) ?? [];
    if (pro.onboarded_at || history.some((a) => a.outcome === 'picked')) {
      throw new MockHttpError(400, 'This pro has already been onboarded', 'PRO_ALREADY_ONBOARDED');
    }
    if (outcome === 'rescheduled' && !values.reschedule_date) {
      throw new MockHttpError(400, 'reschedule_date is required when the outcome is rescheduled', 'RESCHEDULE_DATE_REQUIRED');
    }

    const fields = { ...values };
    delete fields.outcome;
    const created = pushAttempt(pro.id, {
      admin: {
        _id: admin.id,
        userName: admin.userName,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role.name,
      },
      outcome,
      fields,
      createdAt: new Date().toISOString(),
    });
    // A `picked` call is what stamps the pro as onboarded.
    if (outcome === 'picked') pro.onboarded_at = created.createdAt;

    const all = attempts.get(pro.id)!;
    return attemptBody(created, all.length - 1, all);
  },
};
