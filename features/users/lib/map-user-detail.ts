import type { UserAsset } from '@/lib/api/admin/user-assets.types';
import type { TransactionListResponse } from '@/lib/api/admin/transactions.types';
import type { UserReferralResponse } from '@/lib/api/admin/referrals.types';

import type { UserDetail } from '../types/user.types';
import type { AdminUserCore, AdminUserStats } from '../schemas/user-detail.schema';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object' && '$oid' in value) {
    return String((value as { $oid: unknown }).$oid ?? '');
  }
  const nested = asRecord(value);
  if (nested?._id != null && nested._id !== value) return asString(nested._id);
  if (nested?.id != null && nested.id !== value) return asString(nested.id);
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

function asDateString(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return asString(value);
}

function joinName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ').trim();
}

export function toUserDetail(core: AdminUserCore, stats?: AdminUserStats | null): UserDetail {
  const levelOne = core.referrer_chain?.[0];
  return {
    Networth: stats?.networth ?? 0,
    virtual_networth: stats?.networth ?? 0,
    virtual_subscriptions: stats?.subscriptions ?? 0,
    _id: core.id,
    address: core.address ?? '',
    amount_paid: stats?.total_paid ?? 0,
    amount_payable: stats?.total_payable ?? 0,
    balance_payable: stats?.balance ?? 0,
    referral_status: core.tier ?? '',
    country: core.country ?? '',
    date_of_birth: asDateString(core.date_of_birth),
    email: core.email ?? '',
    last_login: '',
    default_status: '',
    employment_status: core.employment_status ?? '',
    firstName: core.first_name ?? '',
    gender: core.gender ?? '',
    lastName: core.last_name ?? '',
    marital_status: core.marital_status ?? '',
    occupation: core.occupation ?? '',
    phoneNumber: core.phone_number ?? '',
    is_suspended: Boolean(core.is_suspended),
    profile_pic: core.profile_pic ?? '',
    referral: levelOne
      ? {
          firstName: levelOne.first_name ?? '',
          lastName: levelOne.last_name ?? '',
          email: levelOne.email ?? '',
        }
      : null,
    kyc: { tin: core.tin_masked ?? '' },
    associate_manager: null,
    subscriptions: stats?.subscriptions ?? 0,
    transaction: [],
    wallet: { balance: stats?.wallet.balance ?? 0 },
    units_purchased: stats?.total_units ?? 0,
    userName: core.user_name ?? '',
    next_date_of_payment: asDateString(stats?.next_payment),
    created_at: asDateString(core.created_at),
    unsigned_contracts: stats?.unsigned_contracts ?? 0,
    verified: Boolean(core.verified),
    state: core.state ?? '',
    lga: core.lga ?? '',
    education_level: core.education_level ?? '',
    experience_level: core.experience_level ?? '',
    acquisition_source: core.acquisition_source ?? '',
    referrer_chain: core.referrer_chain ?? [],
    wallet_available: stats?.wallet.available_balance ?? 0,
  };
}

export function toUserAsset(raw: Record<string, unknown>): UserAsset {
  const asset = asRecord(raw.asset) ?? {};
  const documentPlan = asRecord(raw.document_plan);
  const acquisition = asRecord(raw.acquisition);
  const uniqueId = asString(raw.unique_asset_id || acquisition?.unique_asset_id);
  const status = asString(raw.status);
  const assetType = asString(raw.asset_type || asset.asset_type || asset.type);

  return {
    _id: asString(raw._id || raw.id),
    asset_name: asString(asset.name || asset.asset_name || raw.asset_name_denormalized),
    asset_size: asString(raw.size),
    asset_type: assetType,
    asset_unit: asString(raw.no_of_units),
    payment_details: {
      amount_paid: asNumber(raw.amount_paid),
      balance: asNumber(raw.balance),
      month_subscription: asNumber(raw.month_subscription),
      month_remaining: asNumber(raw.month_remaining),
      default_amount: asNumber(raw.default_amount),
      next_date_of_payment: asDateString(raw.next_date_of_payment),
      asset_price: asNumber(raw.asset_price),
      months_covered: asNumber(raw.months_covered),
      is_suspended: status === 'suspended',
      unique_asset_id: uniqueId,
      size: asNumber(raw.size),
      start_date: asDateString(raw.start_date),
      amount_payable: asNumber(raw.amount_payable),
      fullownerhsip_landprice: asNumber(raw.land_price),
      fullownerhsip_documentprice: asNumber(raw.document_price),
      asset_type: assetType,
      no_of_units: asNumber(raw.no_of_units),
    },
    document_plan: documentPlan
      ? {
          amount_paid: asNumber(documentPlan.amount_paid),
          balance: asNumber(documentPlan.balance),
          asset_price: asNumber(documentPlan.asset_price),
        }
      : undefined,
    asset_questions: acquisition
      ? [
          {
            name_of_property: asString(acquisition.name_of_property),
            address: asString(acquisition.address),
            unique_asset_id: uniqueId || asString(acquisition.unique_asset_id),
          },
        ]
      : [],
  };
}

export function toUserTransaction(raw: Record<string, unknown>): TransactionListResponse {
  const file = asRecord(raw.transfer_file);
  return {
    _id: asString(raw._id || raw.id),
    time_of_transaction: asDateString(
      raw.time_of_transaction ?? raw.createdAt ?? raw.created_at
    ),
    amount: asNumber(raw.net_commission ?? raw.amount),
    type: asString(raw.type),
    status: asString(raw.status),
    description: asString(raw.description),
    transaction_type: asString(raw.transaction_type || raw.type),
    paystack_reference: asString(raw.paystack_reference) || undefined,
    transfer_reference: asString(raw.transfer_reference) || undefined,
    transfer_file: file ? { file: asString(file.file) } : null,
  };
}

export function toUserReferral(raw: Record<string, unknown>): UserReferralResponse {
  const referee = asRecord(raw.referee) ?? {};
  const first = asString(referee.firstName ?? referee.first_name);
  const last = asString(referee.lastName ?? referee.last_name);
  return {
    _id: asString(raw._id || raw.id),
    commission: asNumber(raw.commission_earned ?? raw.commission),
    createdAt: asDateString(raw.createdAt ?? raw.created_at),
    userReferralStatus: asString(referee.referral_status),
    email: asString(referee.email),
    name: joinName(first, last) || asString(referee.email) || '—',
    phoneNumber: asString(referee.phoneNumber ?? referee.phone_number),
    status: asString(raw.status) || 'active',
  };
}

export function displayNameFromCore(user: {
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string | null {
  const name = joinName(
    user.first_name ?? user.firstName,
    user.last_name ?? user.lastName
  );
  return name || user.email || null;
}
