import { ADMIN_PERMISSIONS } from '@/lib/rbac/permissions';
import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';
import { MOCK_SEEDED_ROLES } from './rbac-roles.generated';

/* ============================================================
 * Auth mock routes — "METHOD /path", handlers return the inner payload only.
 *
 * Models the two BE behaviours that shape the UI:
 *  - `must_change_password` locks the account until it is cleared
 *  - refresh tokens ROTATE: redeeming one invalidates it
 *
 * Testing affordances:
 *  - sign in as `newadmin@abode.ng` to get the forced-password-change flow
 *  - any password shorter than 8 characters returns a 401
 *  - sign in as `as-<role>@abode.ng` to be a seeded backend role instead of a
 *    super admin, e.g. `as-sales_member@abode.ng`. Join roles with `+` for a
 *    person who holds several: `as-sales_team_lead+recruitment_member@abode.ng`.
 *    The roles come from rbac-roles.generated.ts (a copy of the backend seed).
 *    A role whose landing page is scoped by a manager / officer record is taken
 *    to hold that record, so the landing page can actually be opened.
 * ============================================================ */

const ALL_PERMISSIONS = [
  'view_user', 'view_users', 'view_user_analytics', 'edit_user', 'edit_user_profile', 'edit_user_email', 'delete_user', 'suspend_user', 'unsuspend_user',
  'force_password_reset', 'edit_user_tin', 'adjust_wallet', 'suspend_wallet', 'unsuspend_wallet',
  'modify_tier', 'reassign_referrer',
  'create_user_plan', 'create_developer_plot', 'delete_user_plan',
  'edit_user_asset_question', 'adjust_plan_balance', 'override_next_payment_date',
  'update_plan_spec', 'suspend_plan', 'unsuspend_plan', 'close_plan',
  'edit_plan_commission_config', 'edit_plan_commission_recipients', 'send_user_email',
  'view_admin', 'manage_admins', 'manage_roles',
  'view_assets', 'manage_assets', 'delete_assets', 'buy_asset', 'delete_user_asset',
  'view_estate_updates', 'manage_estate_updates',
  'update_asset_question', 'send_contract',
  'asset_transactions', 'approve_payments', 'withdrawals', 'manage_commission',
  'update_payment_plan',
  'add_referral', 'remove_referral', 'modify_referral_status',
  'view_kyc', 'view_user_bank_details', 'approve_kyc',
  'view_marketplace', 'manage_marketplace',
  'view_agencies', 'manage_agencies', 'export_agencies',
  'manage_promotions',
  'view_requests', 'manage_requests',
  'view_reports', 'generate_reports', 'view_audit_logs',
  'view_meetings', 'manage_meetings',
  'view_amaris_queries', 'view_whatsapp_inbox',
  'view_campaigns', 'manage_campaigns', 'export_campaigns', 'view_sales',
  'view_payment_plans', 'export_payment_plans',
  'view_academy', 'manage_academy', 'export_academy',
  'view_allocations', 'allocate_land', 'deallocate_land',
];

/** Email that exercises the temporary-password lock. */
const TEMP_PASSWORD_EMAIL = 'newadmin@abode.ng';

type MockRole = { id: string; name: string; is_super_admin: boolean; default_landing_page?: string };

type MockRecords = { associate_manager: boolean; cs_manager: boolean; financial_officer: boolean };

type MockAdmin = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: MockRole;
  additional_roles?: MockRole[];
  permissions: string[];
  role_permissions?: string[];
  extra_permissions?: string[];
  start_page?: string;
  start_page_choice?: string | null;
  must_change_password: boolean;
  /** Mock-only (the response schema strips it): which manager / officer records this test login holds. */
  mock_records?: MockRecords;
};

/* ---------- `as-<role>` test logins ---------- */

/** Pairs the BE treats as implied, so a role saved before a key was split keeps its access. */
const IMPLIED: Array<[string, string]> = [
  ['manage_promotions', 'view_promotions'],
  ['withdrawals', 'view_withdrawals'],
  ['manage_manager_tracker', 'reassign_manager'],
  ['manage_company_events', 'view_company_events'],
  ['view_user', 'view_users'],
  ['adjust_wallet', 'view_wallets'],
];

const RECORD_BY_LANDING: Record<string, keyof MockRecords> = {
  manager_performance: 'associate_manager',
  cs_manager_performance: 'cs_manager',
  financial_officer_performance: 'financial_officer',
};

function roleLabel(name: string): string {
  return name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function landingsOf(admin: Pick<MockAdmin, 'role' | 'additional_roles'>): string[] {
  return [admin.role, ...(admin.additional_roles ?? [])].map((r) => r.default_landing_page ?? 'dashboard');
}

/** The server's rule: the person's own choice if a held role offers it, else the primary role's page. */
function resolveStart(admin: Pick<MockAdmin, 'role' | 'additional_roles' | 'start_page_choice'>): string {
  const available = landingsOf(admin);
  const choice = admin.start_page_choice ?? null;
  return choice && available.includes(choice) ? choice : available[0];
}

/** `as-sales_member+recruitment_member@abode.ng` → that session, or null for any other email. */
function roleLoginFor(email: string): MockAdmin | null {
  const match = email.toLowerCase().match(/^as-([a-z_+]+)@/);
  if (!match) return null;
  const names = match[1].split('+');
  if (!names.every((n) => MOCK_SEEDED_ROLES[n])) return null;

  const roles: MockRole[] = names.map((n) => ({
    id: `mock-role-${n}`,
    name: n,
    is_super_admin: MOCK_SEEDED_ROLES[n].is_super_admin,
    default_landing_page: MOCK_SEEDED_ROLES[n].default_landing_page,
  }));

  const fromRoles = roles.some((r) => r.is_super_admin)
    ? [...ADMIN_PERMISSIONS]
    : [...new Set(names.flatMap((n) => MOCK_SEEDED_ROLES[n].permissions))];
  const held = new Set(fromRoles);
  for (const [broad, narrow] of IMPLIED) if (held.has(broad)) held.add(narrow);

  const records: MockRecords = { associate_manager: false, cs_manager: false, financial_officer: false };
  for (const landing of roles.map((r) => r.default_landing_page ?? 'dashboard')) {
    const record = RECORD_BY_LANDING[landing];
    if (record) records[record] = true;
  }

  const admin: MockAdmin = {
    id: '665f1c0a9b2e4d0012a3b457',
    firstName: roleLabel(names[0]).split(' ')[0],
    lastName: 'Tester',
    userName: `as.${names.join('.')}`,
    email,
    role: roles[0],
    additional_roles: roles.slice(1),
    permissions: [...held],
    role_permissions: [...held],
    extra_permissions: [],
    start_page_choice: null,
    must_change_password: false,
    mock_records: records,
  };
  admin.start_page = resolveStart(admin);
  return admin;
}

/** Does the signed-in test login hold this manager / officer record? Real logins hold none. */
export function mockHoldsRecord(kind: keyof MockRecords): boolean {
  return loadSession()?.admin.mock_records?.[kind] === true;
}

type MockSession = { admin: MockAdmin; refreshToken: string };

/**
 * Mirrored into sessionStorage so a page reload (or a dev hot reload, which
 * resets module state) doesn't force signing in again. Cleared by logout.
 */
const SESSION_KEY = 'mock-admin-session';

let session: MockSession | null = null;
let hydrated = false;

function loadSession(): MockSession | null {
  if (!hydrated) {
    hydrated = true;
    if (typeof window !== 'undefined') {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      session = raw ? (JSON.parse(raw) as MockSession) : null;
    }
  }
  return session;
}

function saveSession(next: MockSession | null): void {
  session = next;
  hydrated = true;
  if (typeof window === 'undefined') return;

  if (next) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  else window.sessionStorage.removeItem(SESSION_KEY);
}

let tokenCounter = 0;
const nextToken = (prefix: string) => `mock-${prefix}-${Date.now()}-${++tokenCounter}`;

function issueSession(admin: MockAdmin) {
  const refreshToken = nextToken('refresh');
  saveSession({ admin, refreshToken });

  return { accessToken: nextToken('access'), refreshToken, admin };
}

export function requireSession(): MockAdmin {
  const current = loadSession();
  if (!current) {
    throw new MockHttpError(401, 'Missing, invalid, or non-admin token');
  }
  return current.admin;
}

/** The signed-in admin, or null: for routes that read fine without a session and only attribute writes to one. */
export function mockSessionAdmin(): MockAdmin | null {
  return loadSession()?.admin ?? null;
}

/** Does the signed-in test login hold this permission? A super admin holds every one. */
export function mockCan(permission: string): boolean {
  return mockIsSuperAdmin() || requireSession().permissions.includes(permission);
}

/** Super admin on any held role, as the BE decides "own notes only, unless super admin". */
export function mockIsSuperAdmin(): boolean {
  const admin = requireSession();
  return admin.role.is_super_admin || (admin.additional_roles ?? []).some((r) => r.is_super_admin);
}

/** The BE's guard: 403 with the reason when the login lacks the permission. */
export function requireMockPermission(permission: string, message: string, code = 'FORBIDDEN'): void {
  if (!mockCan(permission)) throw new MockHttpError(403, message, code);
}

export const authRoutes: MockRoutes = {
  'POST /auth/admin/login': ({ body: raw }) => {
    const { email, password } = body<{ email?: string; password?: string }>(raw);

    if (!email || !password || password.length < 8) {
      throw new MockHttpError(401, 'Invalid email or password');
    }

    const roleLogin = roleLoginFor(email);
    if (roleLogin) return issueSession(roleLogin);

    const isTempPassword = email.toLowerCase() === TEMP_PASSWORD_EMAIL;

    return issueSession({
      id: '665f1c0a9b2e4d0012a3b456',
      firstName: isTempPassword ? 'New' : 'Ada',
      lastName: isTempPassword ? 'Admin' : 'Okafor',
      userName: isTempPassword ? 'new.admin' : 'ada.okafor',
      email,
      role: { id: 'mock-role-admin', name: 'admin', is_super_admin: true },
      permissions: ALL_PERMISSIONS,
      must_change_password: isTempPassword,
    });
  },

  'GET /auth/admin/me': () => requireSession(),

  // PATCH /admin/me/start-page: the value must be the landing page of a held role.
  'PATCH /admin/me/start-page': ({ body: raw }) => {
    const admin = requireSession();
    const { start_page } = body<{ start_page?: string | null }>(raw);
    if (start_page === undefined) throw new MockHttpError(400, 'start_page must be one of the allowed values');

    const available = landingsOf(admin);
    if (start_page !== null && !available.includes(start_page)) {
      throw new MockHttpError(
        400,
        "The start page must be the landing page of one of the person's roles",
        'START_PAGE_NOT_AVAILABLE',
      );
    }

    const next: MockAdmin = { ...admin, start_page_choice: start_page };
    next.start_page = resolveStart(next);
    const current = loadSession();
    if (current) saveSession({ ...current, admin: next });
    return { admin_id: admin.id, start_page_choice: next.start_page_choice ?? null, start_page: next.start_page };
  },

  // GET /admin/managers/me lives in associate-managers.ts, next to the rosters it answers for.

  'POST /auth/admin/change-password': ({ body: raw }) => {
    const admin = requireSession();
    const { currentPassword, newPassword } = body<{
      currentPassword?: string;
      newPassword?: string;
    }>(raw);

    if (!currentPassword) {
      throw new MockHttpError(400, 'Current password is incorrect');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new MockHttpError(400, 'newPassword must be longer than or equal to 8 characters');
    }
    if (currentPassword === newPassword) {
      throw new MockHttpError(400, 'New password must be different from the current one');
    }

    // The BE revokes every session and issues a fresh pair.
    return issueSession({ ...admin, must_change_password: false });
  },

  'POST /auth/refresh': ({ body: raw }) => {
    const { refreshToken } = body<{ refreshToken?: string }>(raw);
    const current = loadSession();

    if (!current || !refreshToken || refreshToken !== current.refreshToken) {
      throw new MockHttpError(401, 'Invalid or expired session');
    }

    // Rotation: the presented token is burned here.
    return issueSession(current.admin);
  },

  'POST /auth/logout': () => {
    saveSession(null);
    return { message: 'Logged out' };
  },

  'POST /auth/admin/logout-all': () => {
    saveSession(null);
    return { message: 'Logged out of all devices' };
  },

  /* ---- provisional: no BE equivalent yet, see docs/BACKEND-REQUESTS.md ---- */

  'POST /auth/admin/forgot-password': ({ body: raw }) => {
    const { email } = body<{ email?: string }>(raw);
    if (!email) throw new MockHttpError(400, 'email must be an email');

    // Enumeration-safe, like the user endpoint: always 200, always a token.
    return {
      resetToken: nextToken('reset'),
      message: 'If that email is registered, a reset code has been sent. It expires in 15 minutes.',
    };
  },

  'POST /auth/admin/verify-otp': ({ body: raw }) => {
    const { otp } = body<{ otp?: string }>(raw);

    // Any 6-digit code except 000000 is accepted, so the failure path is testable.
    if (!otp || !/^\d{6}$/.test(otp) || otp === '000000') {
      throw new MockHttpError(400, 'Invalid or expired OTP');
    }

    return { resetGrantToken: nextToken('grant'), message: 'OTP accepted' };
  },

  'POST /auth/admin/reset-password': ({ body: raw }) => {
    const { newPassword } = body<{ newPassword?: string }>(raw);

    if (!newPassword || newPassword.length < 8) {
      throw new MockHttpError(400, 'newPassword must be longer than or equal to 8 characters');
    }

    return { message: 'Password reset successfully. Please log in again.' };
  },
};
