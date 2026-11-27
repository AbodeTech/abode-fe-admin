/**
 * Roles & permissions foundation (lib/rbac) — verification.
 * Run: npx tsx scripts/rbac-registry-qa.ts
 *
 * Proves the foundation before any page leans on it:
 *   1. The permission list is the backend's pool, key for key.
 *   2. The page registry is complete (every dashboard route resolves), unambiguous
 *      (longest match, literal beats [param]) and uses only known keys.
 *   3. Every landing value has exactly one page, and unknown values fall back.
 *   4. Rules evaluate correctly: super admin (on ANY held role), records, pending.
 *   5. The sidebar's pages are all in the registry, so wiring it in loses nothing.
 *   6. Each seeded department role can open its own landing page.
 *
 * Checks 1, 3 (list equality) and 6 read the backend source and are SKIPPED when
 * it is not on disk. Point at it with ABODE_BE_V2_PATH, or keep the default
 * sibling layout (../../Abode-Combine/Abode-Backend/abode-be-v2 from this repo).
 *
 * After the PASS/FAIL tally it prints a REPORT: which pages each seeded role can
 * reach against what the approved design shows it. The report never changes the
 * exit code — a gap there is a backend or design question, not a defect here.
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import { ADMIN_PERMISSIONS, SUPER_ADMIN_GRANT_ONLY_PERMISSIONS } from '../lib/rbac/permissions';
import { LANDING_PAGES } from '../lib/rbac/landing';
import {
  PAGE_REGISTRY,
  findPage,
  getPage,
  landingRoute,
  type PageEntry,
} from '../lib/rbac/registry';
import {
  canAccess,
  isAccessPending,
  type AccessRule,
  type AccessSubject,
  type AccessRecord,
} from '../lib/rbac/access';
import { subjectFromAdmin } from '../lib/rbac/subject';

type Result = { id: string; ok: boolean; skipped?: boolean; error?: string };

const results: Result[] = [];

function run(id: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${id}`);
    results.push({ id, ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    results.push({ id, ok: false, error: msg });
  }
}

function skip(id: string, why: string): void {
  console.log(`SKIP ${id}: ${why}`);
  results.push({ id, ok: true, skipped: true });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  assert(a === b, `${message}: expected ${b}, got ${a}`);
}

/* ---------- the backend source, if present ---------- */

const REPO = path.resolve(__dirname, '..');
const BE_ROOT = path.resolve(
  process.env.ABODE_BE_V2_PATH ?? path.join(REPO, '..', '..', 'Abode-Combine', 'Abode-Backend', 'abode-be-v2'),
  'src',
);
const HAS_BE = fs.existsSync(path.join(BE_ROOT, 'common', 'permissions.ts'));

function loadBackendModule<T>(file: string, permissionsModule?: unknown): T {
  const src = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} as Record<string, unknown> };
  new Function('module', 'exports', 'require', out)(mod, mod.exports, (id: string) => {
    if (id.endsWith('/permissions') && permissionsModule) return permissionsModule;
    throw new Error(`unexpected require("${id}") in ${file}`);
  });
  return mod.exports as T;
}

type BackendPermissions = { PERMISSIONS: string[]; LANDING_PAGES: string[]; SUPER_ADMIN_GRANT_ONLY_PERMISSIONS: Set<string>;
  permissionsFor: (role: { permissions?: string[]; is_super_admin?: boolean }) => string[];
};
type SeededRole = {
  name: string;
  permissions: string[];
  is_super_admin: boolean;
  default_landing_page?: string;
};

const backendPermissions = HAS_BE
  ? loadBackendModule<BackendPermissions>(path.join(BE_ROOT, 'common', 'permissions.ts'))
  : null;

/* ---------- 1. the permission vocabulary ---------- */

run('permissions: no duplicate keys', () => {
  const dupes = ADMIN_PERMISSIONS.filter((k, i) => ADMIN_PERMISSIONS.indexOf(k) !== i);
  assert(dupes.length === 0, `duplicates: ${dupes.join(', ')}`);
});

if (backendPermissions) {
  run('permissions: equal to the backend pool, key for key and in order', () => {
    eq([...ADMIN_PERMISSIONS], backendPermissions.PERMISSIONS, 'ADMIN_PERMISSIONS vs backend PERMISSIONS');
  });
  run('permissions: super-admin-only grant list equals the backend', () => {
    eq([...SUPER_ADMIN_GRANT_ONLY_PERMISSIONS].sort(), [...backendPermissions.SUPER_ADMIN_GRANT_ONLY_PERMISSIONS].sort(), 'SUPER_ADMIN_GRANT_ONLY_PERMISSIONS');
  });
} else {
  skip('permissions: equal to the backend pool', `backend source not found at ${BE_ROOT}`);
}

/* ---------- 2. the registry ---------- */

run('registry: ids and routes are unique', () => {
  const ids = PAGE_REGISTRY.map((p) => p.id);
  const routes = PAGE_REGISTRY.map((p) => p.route);
  assert(new Set(ids).size === ids.length, `duplicate ids: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`);
  assert(new Set(routes).size === routes.length, `duplicate routes: ${routes.filter((x, i) => routes.indexOf(x) !== i).join(', ')}`);
});

run('registry: every rule uses only known permission keys', () => {
  const known = new Set<string>(ADMIN_PERMISSIONS);
  const bad: string[] = [];
  for (const p of PAGE_REGISTRY) {
    const keys = 'any' in p.access ? p.access.any : 'all' in p.access ? p.access.all : [];
    for (const k of keys) if (!known.has(k)) bad.push(`${p.id}:${k}`);
  }
  assert(bad.length === 0, bad.join(', '));
});

function dashboardRoutes(): string[] {
  const root = path.join(REPO, 'app', '(dashboard)');
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === 'page.tsx') {
        const rel = path.relative(root, dir).split(path.sep).join('/');
        found.push('/' + rel);
      }
    }
  };
  walk(root);
  return found.sort();
}

run('registry: every dashboard page route resolves to an entry', () => {
  const routes = dashboardRoutes();
  assert(routes.length > 50, `found only ${routes.length} routes — is app/(dashboard) readable?`);
  const missing = routes.filter((r) => !findPage(r));
  assert(missing.length === 0, `unregistered (add an entry): ${missing.join(', ')}`);
});

run('registry: lookup picks the right entry', () => {
  const cases: Array<[string, string | undefined]> = [
    ['/', 'dashboard'],
    ['/users', 'users'],
    ['/users/abc123', 'user-detail'],
    ['/users/suspended', 'users-suspended'],
    ['/users/completed-asset-payments', 'users-completed-asset-payments'],
    ['/assets', 'assets'],
    ['/assets/create', 'asset-create'],
    ['/assets/abc/costs', 'asset-costs'],
    ['/assets/abc/updates/u1', 'asset-updates'],
    ['/associate-upgrade', 'upgrades'],
    ['/associate-upgrade/coupons', 'coupons'],
    ['/associates', 'top-associates'],
    ['/associates/managers', 'manager-performance'],
    ['/recruitment/p1/cohorts/c1/tests', 'recruitment'],
    ['/recruitment/new', 'recruitment-new'],
    ['/security/roles/r1', 'roles'],
    ['/customer-managers/m1', 'cs-performance'],
    ['/transactions/withdrawal', 'tx-withdrawal'],
    ['/users/?page=2', 'users'],
    ['/definitely-not-a-page', undefined],
  ];
  for (const [p, id] of cases) eq(findPage(p)?.id, id, `findPage("${p}")`);
});

/* ---------- 3. landing ---------- */

run('landing: each landing value has exactly one page, and opens it', () => {
  for (const value of LANDING_PAGES) {
    const owners = PAGE_REGISTRY.filter((p) => p.landing === value);
    assert(owners.length === 1, `"${value}" is claimed by ${owners.length} pages`);
    eq(landingRoute(value), owners[0].route, `landingRoute("${value}")`);
  }
  const stray = PAGE_REGISTRY.filter((p) => p.landing && !LANDING_PAGES.includes(p.landing));
  assert(stray.length === 0, `unknown landing value on: ${stray.map((p) => p.id).join(', ')}`);
});

run('landing: unknown, empty and missing values fall back to the dashboard', () => {
  for (const v of ['made_up_page', '', null, undefined]) eq(landingRoute(v as string | null | undefined), '/', `landingRoute(${String(v)})`);
});

if (backendPermissions) {
  run('landing: values equal the backend list', () => {
    eq([...LANDING_PAGES], backendPermissions.LANDING_PAGES, 'LANDING_PAGES vs backend LANDING_PAGES');
  });
} else {
  skip('landing: values equal the backend list', 'backend source not found');
}

/* ---------- 4. rule evaluation ---------- */

const subject = (over: Partial<AccessSubject> = {}): AccessSubject => ({
  isSuperAdmin: false,
  permissions: new Set<string>(),
  records: {},
  ...over,
});

run('rules: open admits everyone, even with no permissions', () => {
  assert(canAccess(subject(), { open: true }), 'open rule refused');
});

run('rules: any needs one key, all needs every key', () => {
  const s = subject({ permissions: new Set(['view_user']) });
  assert(canAccess(s, { any: ['view_users', 'view_user'] }), 'any should pass with one key');
  assert(!canAccess(s, { all: ['view_users', 'view_user'] }), 'all should fail with one of two');
  assert(!canAccess(s, { any: ['view_users'] }), 'view_user must not satisfy view_users');
});

run('rules: a super admin passes everything, including super-admin-only', () => {
  const s = subject({ isSuperAdmin: true });
  assert(canAccess(s, { superAdminOnly: true }), 'super admin refused superAdminOnly');
  assert(canAccess(s, { any: ['manage_roles'] }), 'super admin refused a keyed rule');
  assert(!canAccess(subject({ permissions: new Set(['manage_roles']) }), { superAdminOnly: true }), 'a key must not satisfy superAdminOnly');
});

run('rules: a record grants the page without a key', () => {
  const rule: AccessRule = { any: ['view_manager_tracker'], record: 'associate_manager' };
  assert(!canAccess(subject(), rule), 'no key, no record: should refuse');
  assert(canAccess(subject({ records: { associate_manager: true } }), rule), 'record should grant');
  assert(!canAccess(subject({ records: { cs_manager: true } }), rule), 'the wrong record must not grant');
});

run('rules: pending only while a record lookup could still grant', () => {
  const rule: AccessRule = { any: ['view_cs_manager_tracker'], record: 'cs_manager' };
  assert(isAccessPending(subject(), rule), 'unknown record should be pending');
  assert(!isAccessPending(subject({ records: { cs_manager: false } }), rule), 'known "no" is not pending');
  assert(!isAccessPending(subject({ permissions: new Set(['view_cs_manager_tracker']) }), rule), 'already allowed is not pending');
  assert(!isAccessPending(subject(), { any: ['view_users'] }), 'a rule with no record is never pending');
});

const session = (over: Record<string, unknown> = {}) =>
  ({
    id: 'a1',
    role: { id: 'r1', name: 'sales_member', is_super_admin: false, default_landing_page: 'manager_performance' },
    additional_roles: [],
    permissions: [],
    role_permissions: [],
    extra_permissions: [],
    start_page: 'manager_performance',
    start_page_choice: null,
    must_change_password: false,
    ...over,
  }) as Parameters<typeof subjectFromAdmin>[0];

run('session: super admin on ANY held role counts, not just the primary', () => {
  const extra = session({ additional_roles: [{ id: 'r9', name: 'founder_super_admin', is_super_admin: true, default_landing_page: 'dashboard' }] });
  assert(subjectFromAdmin(extra).isSuperAdmin, 'a super-admin additional role must count');
  assert(!subjectFromAdmin(session()).isSuperAdmin, 'a plain role must not');
});

run('session: a stored session from before multi-role still evaluates', () => {
  const stale = { id: 'a1', role: { id: 'r1', name: 'admin', is_super_admin: true }, permissions: ['view_user'], must_change_password: false } as unknown as Parameters<typeof subjectFromAdmin>[0];
  const s = subjectFromAdmin(stale);
  assert(s.isSuperAdmin, 'single-role super admin lost');
  assert(s.permissions.has('view_user'), 'permissions lost');
});

run('session: no admin means no access to anything but open pages', () => {
  const s = subjectFromAdmin(null);
  assert(!canAccess(s, { any: ['view_user'] }), 'signed-out subject got a key');
  assert(canAccess(s, { open: true }), 'open pages are open');
});

/* ---------- 5. the sidebar ---------- */

function sidebarItems(): Array<{ id: string; group: string }> {
  const src = fs.readFileSync(path.join(REPO, 'components', 'layout', 'Sidebar.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const nav = src.slice(src.indexOf('const rawNavGroups'), src.indexOf('const navGroups ='));
  const items: Array<{ id: string; group: string }> = [];
  let group = '';
  for (const line of nav.split('\n')) {
    const g = line.match(/^\s*title:\s*"([^"]+)"/);
    if (g) group = g[1];
    const i = line.match(/\{\s*id:\s*"([^"]+)"\s*,\s*icon:/);
    if (i) items.push({ id: i[1], group });
  }
  return items;
}

run('sidebar: names only registry pages, each under the group the registry gives it', () => {
  const items = sidebarItems();
  assert(items.length > 40, `parsed only ${items.length} sidebar items`);
  const bad: string[] = [];
  for (const { id, group } of items) {
    const entry = getPage(id);
    if (!entry) bad.push(`${id} (not in the registry)`);
    else if (entry.group !== group) bad.push(`${id} (sidebar "${group}", registry "${entry.group ?? 'none'}")`);
  }
  assert(bad.length === 0, bad.join('; '));
});

run('sidebar: every registry page that names a group appears in the sidebar', () => {
  const listed = new Set(sidebarItems().map((i) => i.id));
  const missing = PAGE_REGISTRY.filter((p) => p.group && !listed.has(p.id)).map((p) => p.id);
  assert(missing.length === 0, `in the registry with a group but not in the sidebar: ${missing.join(', ')}`);
});

run('sidebar: no page appears twice', () => {
  const ids = sidebarItems().map((i) => i.id);
  const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
  assert(dupes.length === 0, dupes.join(', '));
});

/* ---------- 6. seeded roles ---------- */

const DEPARTMENT_ROLES = [
  'developer', 'sales_member', 'sales_team_lead', 'cs_manager', 'support_lead',
  'finance_member', 'finance_lead', 'recruitment_member', 'recruitment_lead',
];

/** Pages the approved design shows each role. By registry id. Extras are allowed; a missing one is reported. */
const SALES_MEMBER = ['company-events', 'flex-leads', 'coupons', 'users', 'upgrades', 'top-associates', 'manager-performance', 'division', 'courses', 'learners', 'amaris', 'whatsapp', 'agency', 'purchase-confirmations', 'tx-withdrawal', 'tx-topup', 'tx-assets', 'tx-document', 'tx-commission'];
// support_member is retired on the backend: cs_manager is the support member persona now.
const SUPPORT = ['cs-performance', 'associate-performance', 'tickets', 'issues', 'requests', 'purchase-confirmations', 'users', 'assets', 'allocation'];
const FINANCE = ['fo-performance', 'coupons', 'tx-withdrawal', 'tx-topup', 'tx-assets', 'tx-document', 'tx-commission', 'users', 'upgrades', 'commission-rates', 'commission-overrides', 'campaigns', 'purchase-confirmations'];
const RECRUITMENT = ['recruitment', 'meetings', 'company-events', 'courses', 'upgrades', 'users'];
const DESIGN: Record<string, string[]> = {
  sales_member: SALES_MEMBER,
  sales_team_lead: [...SALES_MEMBER, 'campaigns'],
  cs_manager: SUPPORT,
  support_lead: SUPPORT,
  finance_member: FINANCE,
  finance_lead: FINANCE,
  recruitment_member: RECRUITMENT,
  recruitment_lead: RECRUITMENT,
};

/** The record each role's landing page is scoped by: assumed held for the simulation. */
const LANDING_RECORD: Record<string, AccessRecord> = {
  manager_performance: 'associate_manager',
  cs_manager_performance: 'cs_manager',
  financial_officer_performance: 'financial_officer',
};

function simulate(role: SeededRole): { subject: AccessSubject; assumed?: AccessRecord } {
  const record = LANDING_RECORD[role.default_landing_page ?? 'dashboard'];
  return {
    subject: {
      isSuperAdmin: role.is_super_admin,
      // The backend's own expansion (implied keys such as view_user -> view_users), as the session gets it.
      permissions: new Set(backendPermissions ? backendPermissions.permissionsFor(role) : role.permissions),
      records: record ? { [record]: true } : {},
    },
    assumed: record,
  };
}

let seeded: SeededRole[] = [];
if (backendPermissions) {
  const mod = loadBackendModule<{ DEFAULT_ROLES: SeededRole[] }>(path.join(BE_ROOT, 'modules', 'role', 'role.seed.ts'), backendPermissions);
  seeded = mod.DEFAULT_ROLES;

  run('seeded roles: every department role exists', () => {
    const have = new Set(seeded.map((r) => r.name));
    const missing = DEPARTMENT_ROLES.filter((n) => !have.has(n));
    assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  });

  run('seeded roles: each can open its own landing page (records assumed where the page is record-scoped)', () => {
    const stuck: string[] = [];
    for (const name of DEPARTMENT_ROLES) {
      const role = seeded.find((r) => r.name === name);
      if (!role) continue;
      const landing = role.default_landing_page ?? 'dashboard';
      const entry = PAGE_REGISTRY.find((p) => p.landing === landing);
      if (!entry) { stuck.push(`${name}: landing "${landing}" has no page`); continue; }
      const { subject: s } = simulate(role);
      if (!canAccess(s, entry.access)) stuck.push(`${name}: lands on ${entry.route} but cannot open it`);
    }
    assert(stuck.length === 0, stuck.join('; '));
  });

  run('seeded roles: a super-admin role opens every page', () => {
    const founder = seeded.find((r) => r.is_super_admin);
    assert(founder, 'no super-admin role in the seed');
    const blocked = PAGE_REGISTRY.filter((p) => !canAccess(simulate(founder).subject, p.access));
    assert(blocked.length === 0, blocked.map((p) => p.id).join(', '));
  });
} else {
  skip('seeded roles: landing pages are reachable', 'backend source not found');
}

/* ---------- tally ---------- */

const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skipped);
console.log(`\n${results.length - failed.length - skipped.length}/${results.length - skipped.length} passed${skipped.length ? `, ${skipped.length} skipped` : ''}`);

/* ---------- REPORT: the seeded roles against the design (never affects the exit code) ---------- */

if (seeded.length) {
  console.log('\nREPORT — pages the approved design shows each role, against what its seeded keys open');
  console.log('(record-scoped landing pages are assumed reachable: the role is taken to hold that manager/officer record)\n');
  const listed = (e: PageEntry) => !!e.group;
  for (const name of Object.keys(DESIGN)) {
    const role = seeded.find((r) => r.name === name);
    if (!role) continue;
    const { subject: s, assumed } = simulate(role);
    const reach = (id: string) => { const e = getPage(id); return !!e && canAccess(s, e.access); };
    const missing = DESIGN[name].filter((id) => !reach(id));
    const beyond = PAGE_REGISTRY.filter((e) => listed(e) && canAccess(s, e.access) && !DESIGN[name].includes(e.id)).map((e) => e.id);
    console.log(`${name}${assumed ? `  [assumes ${assumed} record]` : ''}`);
    console.log(`  design page the keys do NOT open : ${missing.length ? missing.map((id) => `${id} (needs ${describe(getPage(id)!.access)})`).join('; ') : 'none'}`);
    console.log(`  opens beyond the design          : ${beyond.length ? beyond.join(', ') : 'none'}`);
  }
}

function describe(rule: AccessRule): string {
  if ('open' in rule) return 'nothing';
  if ('superAdminOnly' in rule) return 'super admin';
  const keys = 'any' in rule ? rule.any.join(' or ') : rule.all.join(' and ');
  return rule.record ? `${keys}, or the ${rule.record} record` : keys;
}

process.exit(failed.length ? 1 : 0);
