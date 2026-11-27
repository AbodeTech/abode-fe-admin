/**
 * Roles & permissions — live contract check against the REAL backend.
 * Run: ABODE_ADMIN_EMAIL=you@abode.ng ABODE_ADMIN_PASSWORD=… npx tsx scripts/rbac-live-contract-check.ts
 *
 * Everything else in this repo's roles work was verified against mocks. This signs in to a real
 * staging admin account and checks what the mocks can only assume:
 *
 *   1. Session  — the login and /auth/admin/me responses carry every field the app reads
 *                 (additional_roles, role_permissions, extra_permissions, start_page, …), not
 *                 just fields our Zod defaults would quietly fill in; values are coherent.
 *   2. Schemas  — roles, permissions, admins, audit logs, purchase confirmations and the three
 *                 "am I a manager / officer?" lookups parse with the exact schemas the app uses.
 *   3. Pool     — GET /admin/permissions equals lib/rbac/permissions.ts, key for key.
 *   4. Pages    — for every page in the registry that has a main read endpoint, the app's
 *                 prediction ("this admin may open it") is compared with the server's real answer
 *                 (403 or not). A page the app would show but the server refuses is a page of
 *                 failed requests; a page the app hides but the server allows is a missing menu entry.
 *
 * READ-ONLY by construction: one POST (login) and GETs. It never writes, approves or deletes.
 * It does not print the password or the token.
 *
 * Environment (never put credentials in chat or in the repo):
 *   ABODE_ADMIN_EMAIL, ABODE_ADMIN_PASSWORD   an admin account on the target backend
 *   ABODE_API_BASE      default: NEXT_PUBLIC_API_BASE_URL, else the staging URL below
 *   ABODE_ALLOW_NON_STAGING=1   required to run against any host that does not contain "staging"
 *
 * Exit code: 0 all good, 1 any failure or mismatch, 2 not configured.
 */
import { z } from 'zod';

import { AdminAuthResultSchema, AdminSchema } from '../features/auth/schemas/auth.schema';
import {
  AdminAccountSchema,
  PermissionOptionSchema,
  RoleSchema,
  joinAdminRole,
} from '../features/roles-permissions/schemas/role.schema';
import { AdminLogSchema } from '../features/admin-logs/schemas/admin-log.schema';
import {
  AdminConfirmationRowSchema,
  ConfirmationCountsSchema,
} from '../features/purchase-confirmations/schemas/purchase-confirmation.schema';
import { ManagerProfileSchema } from '../features/associate-managers/schemas/associate-manager.schema';
import { ManagerDashboardSchema } from '../features/associate-managers/schemas/manager-dashboard.schema';
import { ADMIN_PERMISSIONS } from '../lib/rbac/permissions';
import { LANDING_PAGES } from '../lib/rbac/landing';
import { PAGE_REGISTRY, getPage } from '../lib/rbac/registry';
import { canAccess, type AccessRecord } from '../lib/rbac/access';
import { subjectFromAdmin } from '../lib/rbac/subject';

const STAGING_DEFAULT = 'https://api-v2-staging.abodeflex.ng/api/v1';
const BASE = (process.env.ABODE_API_BASE ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? STAGING_DEFAULT).replace(/\/$/, '');
const EMAIL = process.env.ABODE_ADMIN_EMAIL;
const PASSWORD = process.env.ABODE_ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    'Not configured. Set ABODE_ADMIN_EMAIL and ABODE_ADMIN_PASSWORD (an admin on the target backend) in YOUR shell,\n' +
      'then run: npx tsx scripts/rbac-live-contract-check.ts\n' +
      `Target would be: ${BASE}`,
  );
  process.exit(2);
}
if (!/staging|localhost|127\.0\.0\.1/.test(BASE) && process.env.ABODE_ALLOW_NON_STAGING !== '1') {
  console.error(`Refusing to run against ${BASE}: it does not look like staging. Set ABODE_ALLOW_NON_STAGING=1 to override.`);
  process.exit(2);
}

/* ---------- tiny reporter ---------- */

type Row = { ok: boolean; name: string; detail?: string };
const rows: Row[] = [];
const pass = (name: string, detail?: string) => { rows.push({ ok: true, name, detail }); console.log(`PASS ${name}${detail ? ' — ' + detail : ''}`); };
const fail = (name: string, detail?: string) => { rows.push({ ok: false, name, detail }); console.log(`FAIL ${name}${detail ? ' — ' + detail : ''}`); };
const note = (text: string) => console.log(`     ${text}`);

/* ---------- http ---------- */

type Http = { status: number; body: unknown };
let token = '';

async function call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Http> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let parsed: unknown = null;
    try { parsed = await res.json(); } catch { /* empty body */ }
    return { status: res.status, body: parsed };
  } catch (e) {
    return { status: 0, body: { network_error: (e as Error).message } };
  }
}

/** The BE wraps every success in `{ success, data, message, meta }`; unwrap it like lib/api-client does. */
const data = (body: unknown): unknown =>
  body && typeof body === 'object' && 'data' in (body as Record<string, unknown>) ? (body as { data: unknown }).data : body;
const meta = (body: unknown): Record<string, unknown> | undefined =>
  body && typeof body === 'object' ? ((body as { meta?: Record<string, unknown> }).meta) : undefined;

function parseWith<T extends z.ZodTypeAny>(name: string, schema: T, value: unknown): z.infer<T> | null {
  const r = schema.safeParse(value);
  if (r.success) return r.data;
  const first = r.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
  fail(`${name}: parses with the app's schema`, first);
  return null;
}

/* ---------- 1. session ---------- */

const SESSION_FIELDS = ['additional_roles', 'role_permissions', 'extra_permissions', 'start_page', 'start_page_choice'] as const;

async function main(): Promise<void> {
  console.log(`Target: ${BASE}\n`);

  const login = await call('POST', '/auth/admin/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200 && login.status !== 201) {
    fail('login', `HTTP ${login.status}. Check the email, password and that this is an admin account.`);
    return finish();
  }
  const loginData = data(login.body) as { accessToken?: string; admin?: Record<string, unknown> };
  token = loginData.accessToken ?? '';
  const parsedLogin = parseWith('login response', AdminAuthResultSchema, loginData);
  if (parsedLogin) pass('login response parses', `signed in as ${parsedLogin.admin.email}`);
  if (parsedLogin?.admin.must_change_password) {
    fail('account state', 'this admin must change its password first; every other route returns 403 until it does. Use another account.');
    return finish();
  }

  // The schemas default every new field, so a backend that does NOT send them would still parse.
  // Look at the raw response instead.
  const rawLoginAdmin = loginData.admin ?? {};
  const missing = SESSION_FIELDS.filter((f) => !(f in rawLoginAdmin));
  if (missing.length === 0) pass('login carries every roles field the app reads');
  else fail('login is missing roles fields (the app would silently default them)', missing.join(', '));

  const me = await call('GET', '/auth/admin/me');
  const rawMe = (data(me.body) ?? {}) as Record<string, unknown>;
  if (me.status !== 200) { fail('GET /auth/admin/me', `HTTP ${me.status}`); return finish(); }
  const admin = parseWith('/auth/admin/me', AdminSchema, rawMe);
  const meMissing = SESSION_FIELDS.filter((f) => !(f in rawMe));
  meMissing.length === 0 ? pass('/auth/admin/me carries every roles field') : fail('/auth/admin/me is missing roles fields', meMissing.join(', '));
  if (!admin) return finish();

  /* ---------- coherence ---------- */
  const known = new Set<string>(ADMIN_PERMISSIONS);
  const unknownKeys = admin.permissions.filter((p) => !known.has(p));
  unknownKeys.length === 0
    ? pass('every permission the server granted is in the app\'s list')
    : fail('the server granted keys the app does not know (lib/rbac/permissions.ts is stale)', unknownKeys.join(', '));

  const landings = [admin.role, ...admin.additional_roles].filter(Boolean).map((r) => r!.default_landing_page);
  const badLanding = landings.filter((l) => !(LANDING_PAGES as readonly string[]).includes(l));
  badLanding.length === 0
    ? pass('every held role has a landing page the app knows', [...new Set(landings)].join(', '))
    : fail('a held role has a landing page the app does not know (it would fall back to the dashboard)', badLanding.join(', '));
  (LANDING_PAGES as readonly string[]).includes(admin.start_page)
    ? pass('start_page is a known landing page', `${admin.start_page}${admin.start_page_choice ? ' (your own choice)' : ' (role default)'}`)
    : fail('start_page is not a landing page the app knows', admin.start_page);

  const union = new Set([...admin.role_permissions, ...admin.extra_permissions]);
  // Sets, not lengths: a role may list a key twice; the server de-duplicates what it returns.
  const granted = new Set(admin.permissions);
  const sameUnion = granted.size === union.size && [...granted].every((p) => union.has(p));
  sameUnion
    ? pass('permissions equals role_permissions plus extra_permissions')
    : fail('permissions is not role_permissions plus extra_permissions', `permissions=${granted.size} union=${union.size}`);

  /* ---------- 2/3. roles, pool, admins ---------- */
  const perms = await call('GET', '/admin/permissions');
  if (perms.status === 200) {
    const list = parseWith('/admin/permissions', z.array(PermissionOptionSchema), data(perms.body));
    if (list) {
      const names = list.map((p) => p.name);
      const onlyServer = names.filter((n) => !known.has(n));
      const onlyApp = [...known].filter((k) => !names.includes(k));
      onlyServer.length === 0 && onlyApp.length === 0
        ? pass('permission pool equals lib/rbac/permissions.ts', `${names.length} keys`)
        : fail('permission pool differs from lib/rbac/permissions.ts', `server-only: ${onlyServer.join(', ') || '—'} | app-only: ${onlyApp.join(', ') || '—'}`);
    }
  } else note(`/admin/permissions: HTTP ${perms.status} (needs view_admin) — pool check skipped`);

  const rolesRes = await call('GET', '/admin/roles');
  let rolesList: z.infer<typeof RoleSchema>[] = [];
  if (rolesRes.status === 200) {
    const r = parseWith('/admin/roles', z.array(RoleSchema), data(rolesRes.body));
    if (r) {
      rolesList = r;
      pass('/admin/roles parses', `${r.length} roles`);
      const bad = r.filter((x) => !(LANDING_PAGES as readonly string[]).includes(x.default_landing_page));
      bad.length === 0 ? pass('every role\'s landing page is known to the app') : fail('roles with a landing page the app does not know', bad.map((x) => `${x.name}:${x.default_landing_page}`).join(', '));
      const dept = ['sales_member', 'sales_team_lead', 'support_lead', 'finance_member', 'finance_lead', 'recruitment_member', 'recruitment_lead', 'developer'];
      const absent = dept.filter((n) => !r.some((x) => x.name === n));
      absent.length === 0 ? pass('every department role exists (the seed and migration reached this database)') : fail('department roles missing from this database (run migrate:role-permissions / seed)', absent.join(', '));
    }
  } else note(`/admin/roles: HTTP ${rolesRes.status} (needs view_admin) — skipped`);

  const adminsRes = await call('GET', '/admin/admins');
  if (adminsRes.status === 200) {
    const raw = data(adminsRes.body);
    const list = parseWith('/admin/admins', z.array(AdminAccountSchema), raw);
    if (list) {
      pass('/admin/admins parses', `${list.length} admins`);
      const populated = list.filter((a) => typeof a.role !== 'string').length;
      note(`role is ${populated === list.length ? 'a populated role document' : populated === 0 ? 'a bare id' : 'mixed'} on this backend (the app accepts both)`);
      const joined = list.map((a) => joinAdminRole(a, rolesList));
      const noName = joined.filter((j) => j.role_name === j.role_id);
      noName.length === 0 ? pass('every admin resolves to a role name') : fail('admins whose role name could not be resolved', noName.map((j) => j.email).join(', '));
    }
  } else note(`/admin/admins: HTTP ${adminsRes.status} (needs view_admin) — skipped`);

  /* ---------- schemas of the other things the roles work touches ---------- */
  // The dashboards the landing pages sit on. A target nobody has set arrives as null here, which a schema
  // written from the mocks rejected: only a real response shows that, so every page that landing leads to
  // is parsed with the schema it uses.
  const dashboards: Array<[string, string]> = [
    ['/admin/managers/dashboard/system', '/admin/managers/dashboard/system?limit=1&period_type=MONTH'],
    ['/admin/managers/dashboard', '/admin/managers/dashboard?limit=1&period_type=MONTH'],
  ];
  for (const [label, path] of dashboards) {
    const res = await call('GET', path);
    if (res.status === 200) {
      const parsed = parseWith(label, ManagerDashboardSchema, data(res.body));
      if (parsed) pass(`${label} parses`);
    } else note(`${label}: HTTP ${res.status} for this admin — skipped`);
  }

  const logs = await call('GET', '/admin/audit-logs?page=1&limit=5');
  if (logs.status === 200) {
    const items = data(logs.body);
    const list = parseWith('/admin/audit-logs', z.array(AdminLogSchema), items);
    if (list) {
      pass('/admin/audit-logs parses', `${list.length} rows, total ${(meta(logs.body)?.total as number | undefined) ?? 'unknown'}`);
      const first = (items as Record<string, unknown>[])[0];
      if (first) {
        // The documented snake_case shape (backend B3); the old camelCase fields may still ride along as deprecated aliases.
        const documented = ['id', 'admin_id', 'admin_email', 'timestamp'].every((key) => key in first);
        documented ? pass('log rows use id / admin_id / admin_email (what the table reads)') : fail('log rows are not in the documented snake_case shape', Object.keys(first).join(','));
      }
    }
  } else note(`/admin/audit-logs: HTTP ${logs.status} (needs view_audit_logs) — skipped`);

  const pcl = await call('GET', '/admin/purchase-confirmations?page=1&limit=3');
  if (pcl.status === 200) {
    const list = parseWith('/admin/purchase-confirmations', z.array(AdminConfirmationRowSchema), data(pcl.body));
    if (list) pass('/admin/purchase-confirmations parses', `${list.length} rows`);
    const counts = await call('GET', '/admin/purchase-confirmations/counts');
    if (counts.status === 200) parseWith('purchase confirmation counts', ConfirmationCountsSchema, data(counts.body)) && pass('purchase confirmation counts parse');
  } else note(`/admin/purchase-confirmations: HTTP ${pcl.status} — skipped`);

  /* ---------- records the app asks "am I a …?" ---------- */
  const records: Partial<Record<AccessRecord, boolean>> = {};
  const mgr = await call('GET', '/admin/managers/me');
  if (mgr.status === 200) {
    const p = parseWith('/admin/managers/me', ManagerProfileSchema, data(mgr.body));
    if (p) { records.associate_manager = p.is_manager; pass('/admin/managers/me parses', p.is_manager ? 'you are an associate manager' : 'not a manager'); }
  } else fail('/admin/managers/me', `HTTP ${mgr.status}`);
  const cs = await call('GET', '/admin/cs-managers/me');
  if (cs.status === 200) {
    const p = parseWith('/admin/cs-managers/me', z.looseObject({ is_cs_manager: z.boolean() }), data(cs.body));
    if (p) { records.cs_manager = p.is_cs_manager; pass('/admin/cs-managers/me parses', p.is_cs_manager ? 'you are a CS manager' : 'not a CS manager'); }
  } else fail('/admin/cs-managers/me', `HTTP ${cs.status}`);
  const fo = await call('GET', '/admin/financial-officers/me');
  if (fo.status === 200) {
    records.financial_officer = !!(data(fo.body) as { officer?: unknown } | null)?.officer;
    pass('/admin/financial-officers/me answers', records.financial_officer ? 'you are a financial officer' : 'not an officer');
  } else fail('/admin/financial-officers/me', `HTTP ${fo.status}`);

  /* ---------- 4. the registry against the server's real answers ---------- */
  console.log('\nPage access: the app\'s prediction against the server\'s real answer for THIS admin');
  const subject = subjectFromAdmin(admin, records);

  // The main read endpoint of each page. Pages whose access is a manager/officer RECORD are skipped:
  // their data routes use the record, not a key, so a list GET says nothing about them.
  const PROBES: Record<string, string> = {
    dashboard: '/admin/dashboard/kpis', assets: '/admin/assets', 'payment-plans': '/admin/payment-plans', agency: '/admin/agencies',
    allocation: '/admin/allocation/eligible-clients', marketplace: '/admin/marketplace/listings', sales: '/admin/sales',
    'flex-leads': '/admin/flex-leads', meetings: '/admin/meetings', recruitment: '/admin/academy/programmes',
    'company-events': '/admin/company-events', users: '/admin/users', 'user-detail': '', standing: '/admin/standing/members',
    upgrades: '/admin/referrals/upgrades', 'top-associates': '/admin/associates/top', 'associate-performance': '/admin/managers/dashboard/system',
    division: '/admin/division/members', courses: '/admin/courses', learners: '/admin/learners',
    'purchase-confirmations': '/admin/purchase-confirmations', requests: '/admin/requests', amaris: '/admin/amaris/queries',
    whatsapp: '/admin/whatsapp/contacts', 'finance-automation': '/admin/finance/expense-runs', coupons: '/admin/coupons',
    'field-performance': '/admin/field-performance/summary', 'field-review-queue': '/admin/field-submissions',
    'tx-withdrawal': '/admin/withdrawals', 'tx-topup': '/admin/wallets', 'tx-assets': '/admin/transactions',
    'tx-document': '/admin/transactions/documents', 'tx-commission': '/admin/commission/transactions',
    'commission-rates': '/admin/commission/config', campaigns: '/admin/campaigns', 'admin-logs': '/admin/audit-logs', roles: '/admin/roles',
    tickets: '/admin/tickets', issues: '/admin/issues',
  };

  let compared = 0;
  const tooPermissive: string[] = [];
  const tooStrict: string[] = [];
  const inconclusive: string[] = [];
  for (const [id, path] of Object.entries(PROBES)) {
    const entry = getPage(id);
    if (!entry || !path) continue;
    const predicted = canAccess({ ...subject, records: {} }, entry.access);
    const r = await call('GET', `${path}${path.includes('?') ? '&' : '?'}page=1&limit=1`);
    if (r.status === 0 || r.status >= 500) { inconclusive.push(`${id} (HTTP ${r.status})`); continue; }
    // 401/403: refused. Anything else (200, or a 400/404 AFTER the guard passed): the guard let us through.
    const actual = r.status !== 401 && r.status !== 403;
    compared += 1;
    if (predicted && !actual) tooPermissive.push(`${id} → app shows it, server says ${r.status}`);
    if (!predicted && actual) tooStrict.push(`${id} → app hides it, server says ${r.status}`);
  }
  tooPermissive.length === 0
    ? pass('no page is shown that the server refuses', `${compared} pages compared`)
    : fail('pages the app would show but the server refuses (a page of failed requests)', '\n       ' + tooPermissive.join('\n       '));
  tooStrict.length === 0
    ? pass('no page is hidden that the server allows')
    : fail('pages the app hides but the server allows (a missing menu entry)', '\n       ' + tooStrict.join('\n       '));
  if (inconclusive.length) note(`inconclusive (server error or network): ${inconclusive.join(', ')}`);

  finish();
}

function finish(): void {
  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
