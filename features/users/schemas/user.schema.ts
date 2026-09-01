import { z } from 'zod';

import {
  LifetimeKpiSchema,
  PeriodScopedKpiSchema,
} from '@/features/dashboard/schemas/dashboard-kpi.schema';

/* ============================================================
 * Admin users — abode-be-v2 `admin-users` module (PR #52 / AU-*).
 *
 * Paths (base /api/v1):
 *   GET /admin/users              list + ?export=csv  (view_users)
 *   GET /admin/users/:id          profile document    (view_user)
 *   GET /admin/users/overview     14 KPI tiles        (view_users)
 *   GET /admin/users/analytics    demographics        (view_user_analytics)
 *
 * List, overview, and analytics use the standard envelope `{ success, data, message, meta? }`.
 * CSV export is a raw stream (not enveloped).
 *
 * Transcribed from origin/staging:
 *   dto/admin-users-response.dto.ts
 *   dto/admin-users-query.dto.ts
 * ============================================================ */

export const USER_TIERS = [
  'guest',
  'user',
  'associate',
  'associate-pro',
  'founder',
  'management',
  'premium',
  'agency',
] as const;

export const UserTierSchema = z.enum(USER_TIERS);
export type UserTier = z.infer<typeof UserTierSchema>;

export const USER_SORT_COLUMNS = [
  'name',
  'email',
  'created_at',
  'networth',
  'subscriptions',
  'tier',
] as const;

export const UserSortColumnSchema = z.enum(USER_SORT_COLUMNS);
export type UserSortColumn = z.infer<typeof UserSortColumnSchema>;

export const ReferrerSummarySchema = z.looseObject({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

export type ReferrerSummary = z.infer<typeof ReferrerSummarySchema>;

/**
 * Live staging returns raw Mongoose User docs. Field types are messy
 * (`referrer` / `referred_by` as ObjectId strings, extra nested docs).
 * Accept any object and normalize in `normalizeAdminUserRow` so a Zod
 * mismatch cannot empty the table while the network tab shows 200 + rows.
 */
export const AdminUserRowSchema = z.record(z.string(), z.unknown());

export type AdminUserListItem = z.infer<typeof AdminUserRowSchema>;

function asString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && '$oid' in value) {
    return String((value as { $oid: unknown }).$oid ?? '');
  }
  const asId = (value as { _id?: unknown; id?: unknown }).id
    ?? (value as { _id?: unknown })._id;
  if (asId != null && asId !== value) return asString(asId);
  return '';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function asBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  return false;
}

function asReferrer(value: unknown, referredBy: string): ReferrerSummary | null {
  if (typeof value === 'string' && value) {
    return { id: value };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const id = asString(obj.id ?? obj._id);
    if (id || obj.first_name || obj.firstName || obj.email) {
      return {
        id: id || referredBy,
        first_name: asString(obj.first_name ?? obj.firstName) || null,
        last_name: asString(obj.last_name ?? obj.lastName) || null,
        email: asString(obj.email) || null,
      };
    }
  }
  if (referredBy) return { id: referredBy };
  return null;
}

/** Normalized row the users table / picker consume. */
export type AdminUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  tier: string;
  verified: boolean;
  is_suspended: boolean;
  created_at: string;
  networth: number;
  subscriptions: number;
  has_asset: boolean;
  has_referral: boolean;
  how_you_heard: string;
  referrer: ReferrerSummary | null;
};

export function normalizeAdminUserRow(raw: AdminUserListItem): AdminUserRow {
  const referredBy = asString(raw.referred_by);
  const referrer = asReferrer(raw.referrer, referredBy);

  return {
    id: asString(raw.id || raw._id),
    first_name: asString(raw.first_name ?? raw.firstName),
    last_name: asString(raw.last_name ?? raw.lastName),
    email: asString(raw.email),
    phone_number: asString(raw.phone_number ?? raw.phoneNumber),
    tier: asString(raw.tier ?? raw.referral_status),
    verified: asBool(raw.verified),
    is_suspended: asBool(raw.is_suspended),
    created_at: asString(raw.created_at ?? raw.createdAt),
    networth: asNumber(raw.networth ?? raw.virtual_networth),
    subscriptions: asNumber(raw.subscriptions ?? raw.virtual_subscriptions),
    has_asset: asBool(raw.has_asset),
    has_referral: asBool(raw.has_referral) || Boolean(referredBy || referrer),
    how_you_heard: asString(
      raw.how_you_heard ?? raw.how_you_hear_about_us ?? raw.howYouHearAboutUs
    ),
    referrer,
  };
}

/** GET /admin/users/:id — raw Mongoose User with kyc / nextofKin / wallet populated. */
export const AdminUserDetailSchema = z.record(z.string(), z.unknown());

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asTin(kyc: unknown): string {
  const doc = asRecord(kyc);
  if (!doc) return '';
  const tin = doc.tin;
  if (typeof tin === 'string') return tin;
  const nested = asRecord(tin);
  return nested ? asString(nested.value) : '';
}

function asReferral(raw: AdminUserListItem) {
  const populated = asRecord(raw.referral) ?? asRecord(raw.referred_by);
  if (!populated) return null;
  const firstName = asString(populated.firstName ?? populated.first_name);
  const lastName = asString(populated.lastName ?? populated.last_name);
  const email = asString(populated.email);
  if (!firstName && !lastName && !email) return null;
  return { firstName, lastName, email };
}

function asManager(raw: unknown) {
  const doc = asRecord(raw);
  if (!doc) return null;
  const id = asString(doc._id ?? doc.id);
  if (!id && !doc.firstName && !doc.email) return null;
  return {
    _id: id,
    firstName: asString(doc.firstName ?? doc.first_name) || null,
    lastName: asString(doc.lastName ?? doc.last_name) || null,
    userName: asString(doc.userName ?? doc.user_name) || null,
    email: asString(doc.email) || null,
  };
}

function asTransactions(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, index) => {
    const item = asRecord(row) ?? {};
    const file = asRecord(item.transfer_file);
    return {
      _id: asString(item._id ?? item.id) || `tx-${index}`,
      time_of_transaction: asString(item.time_of_transaction ?? item.createdAt ?? item.created_at),
      amount: asNumber(item.amount),
      type: asString(item.type),
      status: asString(item.status),
      description: asString(item.description),
      transaction_type: asString(item.transaction_type),
      paystack_reference: asString(item.paystack_reference),
      transfer_reference: asString(item.transfer_reference),
      transfer_file: file ? { file: asString(file.file) } : null,
    };
  });
}

/** Shape the user-detail page already renders. */
export function normalizeAdminUserDetail(raw: AdminUserListItem) {
  const wallet = asRecord(raw.wallet);
  return {
    Networth: asNumber(raw.Networth ?? raw.networth),
    virtual_networth: asNumber(raw.virtual_networth ?? raw.networth),
    virtual_subscriptions: asNumber(raw.virtual_subscriptions ?? raw.subscriptions),
    _id: asString(raw.id || raw._id),
    address: asString(raw.address),
    amount_paid: asNumber(raw.amount_paid),
    amount_payable: asNumber(raw.amount_payable),
    balance_payable: asNumber(raw.balance_payable),
    referral_status: asString(raw.referral_status ?? raw.tier),
    country: asString(raw.country),
    date_of_birth: asString(raw.date_of_birth),
    email: asString(raw.email),
    last_login: asString(raw.last_login),
    default_status: asString(raw.default_status),
    employment_status: asString(raw.employment_status),
    firstName: asString(raw.firstName ?? raw.first_name),
    gender: asString(raw.gender),
    lastName: asString(raw.lastName ?? raw.last_name),
    marital_status: asString(raw.marital_status),
    occupation: asString(raw.occupation),
    phoneNumber: asString(raw.phoneNumber ?? raw.phone_number),
    is_suspended: asBool(raw.is_suspended),
    profile_pic: asString(raw.profile_pic),
    referral: asReferral(raw),
    associate_manager: asManager(raw.associate_manager),
    kyc: { tin: asTin(raw.kyc) },
    subscriptions: asNumber(raw.subscriptions ?? raw.virtual_subscriptions),
    transaction: asTransactions(raw.transaction),
    wallet: { balance: asNumber(wallet?.balance ?? wallet?.available_balance) },
    units_purchased: asNumber(raw.units_purchased),
    userName: asString(raw.userName ?? raw.user_name),
    next_date_of_payment: asString(raw.next_date_of_payment),
  };
}

/** GET /admin/users/overview — UserOverviewDto. */
export const UserOverviewSchema = z.looseObject({
  new_users: PeriodScopedKpiSchema,
  new_associates: PeriodScopedKpiSchema,
  new_associate_pros: PeriodScopedKpiSchema,
  total_users: LifetimeKpiSchema,
  total_associates: LifetimeKpiSchema,
  total_associate_pros: LifetimeKpiSchema,
  active_associates: LifetimeKpiSchema,
  active_associate_pros: LifetimeKpiSchema,
  suspended_users: LifetimeKpiSchema,
  users_with_assets: LifetimeKpiSchema,
  users_with_overdue_plans: LifetimeKpiSchema,
  default_users: LifetimeKpiSchema,
  founders: LifetimeKpiSchema,
  premium_users: LifetimeKpiSchema,
  overdueUsers: LifetimeKpiSchema.optional(),
});

export type UserOverview = z.infer<typeof UserOverviewSchema>;

export const LabelCountSchema = z.looseObject({
  label: z.string(),
  count: z.number(),
});

export type LabelCount = z.infer<typeof LabelCountSchema>;

export const SourceCountSchema = z.looseObject({
  source: z.string(),
  count: z.number(),
});

export const MonthCountSchema = z.looseObject({
  month: z.string(),
  count: z.number(),
});

/** GET /admin/users/analytics — UserAnalyticsDto. */
export const UserAnalyticsSchema = z.looseObject({
  totals: z.looseObject({
    total_users: z.number(),
    referred: z.number(),
    not_referred: z.number(),
    referred_percentage: z.number(),
    not_referred_percentage: z.number(),
  }),
  registration_trend: z.array(MonthCountSchema),
  acquisition: z.looseObject({
    sources: z.array(SourceCountSchema),
  }),
  demographics: z.looseObject({
    gender: z.array(LabelCountSchema),
    age_buckets: z.array(LabelCountSchema),
    marital_status: z.array(LabelCountSchema),
    location: z.array(LabelCountSchema),
    employment_status: z.array(LabelCountSchema),
    education_level: z.array(LabelCountSchema),
    experience_level: z.array(LabelCountSchema),
    occupations: z.array(LabelCountSchema),
  }),
});

export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>;

export function referrerDisplayName(referrer: ReferrerSummary | null | undefined): string {
  if (!referrer) return '';
  const name = [referrer.first_name, referrer.last_name].filter(Boolean).join(' ').trim();
  return name || referrer.email || (referrer.id ? 'Has referrer' : '');
}

export function userDisplayName(row: Pick<AdminUserRow, 'first_name' | 'last_name' | 'email' | 'id'>): string {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return name || row.email || row.id;
}
