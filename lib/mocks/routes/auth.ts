import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';

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
 * ============================================================ */

const ALL_PERMISSIONS = [
  'view_user', 'view_users', 'view_user_analytics', 'edit_user', 'delete_user', 'suspend_user', 'unsuspend_user',
  'view_admin', 'manage_admins', 'manage_roles',
  'view_assets', 'manage_assets', 'delete_assets', 'buy_asset', 'delete_user_asset',
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
  'view_campaigns', 'manage_campaigns', 'export_campaigns',
  'view_payment_plans', 'export_payment_plans',
];

/** Email that exercises the temporary-password lock. */
const TEMP_PASSWORD_EMAIL = 'newadmin@abode.ng';

type MockAdmin = {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
  permissions: string[];
  must_change_password: boolean;
};

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

function requireSession(): MockAdmin {
  const current = loadSession();
  if (!current) {
    throw new MockHttpError(401, 'Missing, invalid, or non-admin token');
  }
  return current.admin;
}

export const authRoutes: MockRoutes = {
  'POST /auth/admin/login': ({ body: raw }) => {
    const { email, password } = body<{ email?: string; password?: string }>(raw);

    if (!email || !password || password.length < 8) {
      throw new MockHttpError(401, 'Invalid email or password');
    }

    const isTempPassword = email.toLowerCase() === TEMP_PASSWORD_EMAIL;

    return issueSession({
      id: '665f1c0a9b2e4d0012a3b456',
      firstName: isTempPassword ? 'New' : 'Ada',
      lastName: isTempPassword ? 'Admin' : 'Okafor',
      userName: isTempPassword ? 'new.admin' : 'ada.okafor',
      email,
      role: 'admin',
      permissions: ALL_PERMISSIONS,
      must_change_password: isTempPassword,
    });
  },

  'GET /auth/admin/me': () => requireSession(),

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
