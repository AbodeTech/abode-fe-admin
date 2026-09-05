import type { MockRoutes } from '../router';
import { MockHttpError } from '../router';
import { MOCK_ASSET_NAMES, MOCK_USERS, formatMockDate } from '../shared';
import { paged } from './util';

import type { PaymentPlanRow } from '@/features/payment-plans/schemas/payment-plan-row.schema';
import {
  PAYMENT_PLAN_ASSET_TYPES,
  type PaymentPlanAssetType,
} from '@/features/payment-plans/schemas/payment-plan-row.schema';
import type { PaymentPlansSummary } from '@/features/payment-plans/schemas/payment-plans-summary.schema';
import { buyerLabel, hasReferrer } from '@/features/payment-plans/lib/display';

const STATUSES = ['active', 'overdue', 'suspended', 'cancelled', 'completed', 'closed'] as const;

function csv(value: unknown): string[] {
  if (value == null || value === '') return [];
  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function boolish(value: unknown): boolean | undefined {
  if (value == null || value === '') return undefined;
  return String(value) === 'true';
}

const rows: PaymentPlanRow[] = Array.from({ length: 40 }, (_, i) => {
  const user = MOCK_USERS[i % MOCK_USERS.length];
  const referrerUser = i % 3 === 0 ? MOCK_USERS[(i + 1) % MOCK_USERS.length] : null;
  const status = STATUSES[i % STATUSES.length];
  const assetType = PAYMENT_PLAN_ASSET_TYPES[i % PAYMENT_PLAN_ASSET_TYPES.length];
  const size = [300, 450, 500, 600][i % 4];
  const units = 1 + (i % 3);
  const amountPayable = size * units * 45_000;
  const isClosed = status === 'completed' || status === 'cancelled' || status === 'closed';
  const amountPaid = isClosed ? amountPayable : Math.round(amountPayable * (0.2 + (i % 5) * 0.15));
  const balance = isClosed ? 0 : amountPayable - amountPaid;
  const hasDefaults = status === 'overdue' || i % 7 === 0;
  const nextPayment =
    status === 'active' || status === 'overdue'
      ? formatMockDate(i % 2 === 0 ? -3 : 10)
      : null;

  return {
    id: `plan-${String(i + 1).padStart(3, '0')}`,
    user: {
      user_id: user._id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone_number: user.phoneNumber,
      referral_status: null,
      org_id: null,
    },
    referrer: referrerUser
      ? {
          referrer_id: referrerUser._id,
          referrer_first_name: referrerUser.firstName,
          referrer_last_name: referrerUser.lastName,
          referrer_email: referrerUser.email,
        }
      : {
          referrer_id: null,
          referrer_first_name: null,
          referrer_last_name: null,
          referrer_email: null,
        },
    asset: {
      asset_id: `asset-${(i % MOCK_ASSET_NAMES.length) + 1}`,
      asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
      asset_location: 'Lekki',
      asset_type: assetType,
    },
    no_of_units: units,
    size,
    unique_asset_id: `UA-${1000 + i}`,
    block: `B${1 + (i % 4)}`,
    plot: `P${1 + (i % 12)}`,
    amount_payable: amountPayable,
    amount_paid: amountPaid,
    balance,
    initial_payment: Math.round(amountPayable * 0.1),
    month_subscription: Math.round(amountPayable / 24),
    asset_price: amountPayable,
    land_price: amountPayable,
    document_price: 0,
    months_covered: isClosed ? 24 : 4 + (i % 12),
    month_remaining: isClosed ? 0 : 20 - (i % 12),
    months_overdue: status === 'overdue' ? 1 + (i % 6) : 0,
    default_amount: hasDefaults ? Math.round(balance * 0.05) : 0,
    default_count: hasDefaults ? 1 + (i % 4) : 0,
    next_date_of_payment: nextPayment,
    start_date: formatMockDate(90 + i),
    plan_completed_at: status === 'completed' ? formatMockDate(5) : null,
    suspended_at: status === 'suspended' ? formatMockDate(12) : null,
    cancelled_at: status === 'cancelled' ? formatMockDate(20) : null,
    closed_at: status === 'closed' ? formatMockDate(20) : null,
    createdAt: formatMockDate(100 + i),
    updatedAt: formatMockDate(i),
    status,
    suspension_reason: status === 'suspended' ? 'Ops termination' : null,
    cancellation_reason: status === 'cancelled' ? 'Client request' : null,
    closure_reason: status === 'closed' ? 'Plan closed by operations' : null,
    contract_signed: i % 2 === 0,
    first_statement_sent: false,
    final_statement_sent: false,
    contract_of_sales_sent: i % 2 === 0,
    certificate_of_subscription_sent: false,
    completion_certificate_sent: status === 'completed',
    allocation_document_sent: false,
    congratulations_sent: false,
    terms_sent: true,
    purchase_confirmation_email_sent: true,
  };
});

function sortValue(row: PaymentPlanRow, field: string): string | number | null {
  switch (field) {
    case 'createdAt':
      return row.createdAt;
    case 'next_date_of_payment':
      return row.next_date_of_payment;
    case 'balance':
      return row.balance;
    case 'default_amount':
      return row.default_amount;
    case 'months_overdue':
      return row.months_overdue;
    case 'amount_paid':
      return row.amount_paid;
    case 'amount_payable':
      return row.amount_payable;
    default:
      return null;
  }
}

function sortRows(filtered: PaymentPlanRow[], sortRaw: unknown): PaymentPlanRow[] {
  const raw = String(sortRaw || '-createdAt');
  const desc = raw.startsWith('-');
  const token = desc ? raw.slice(1) : raw;

  return [...filtered].sort((a, b) => {
    const left = sortValue(a, token);
    const right = sortValue(b, token);
    const cmp = String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true });
    return desc ? -cmp : cmp;
  });
}

function applyFilters(query: Record<string, unknown>): PaymentPlanRow[] {
  const statuses = csv(query.status);
  const assetTypes = csv(query.asset_type);
  const hasDefaults = boolish(query.has_defaults);
  const hasReferrerFilter = boolish(query.has_referrer);
  const search = String(query.search ?? '').trim().toLowerCase();
  const minOutstanding = query.min_outstanding != null ? Number(query.min_outstanding) : undefined;
  const maxOutstanding = query.max_outstanding != null ? Number(query.max_outstanding) : undefined;
  const dueBefore = query.next_payment_due_before
    ? new Date(String(query.next_payment_due_before)).getTime()
    : undefined;
  const dueAfter = query.next_payment_due_after
    ? new Date(String(query.next_payment_due_after)).getTime()
    : undefined;
  const startDate = query.start_date ? new Date(String(query.start_date)).getTime() : undefined;
  const endDate = query.end_date ? new Date(String(query.end_date)).getTime() : undefined;
  const defaultCondition = String(query.default_condition ?? 'currently_owing');

  const filtered = rows.filter((row) => {
    if (statuses.length && !statuses.includes(row.status)) return false;
    if (assetTypes.length && (!row.asset.asset_type || !assetTypes.includes(row.asset.asset_type))) {
      return false;
    }
    const defaulted = row.default_count > 0;
    if (hasDefaults === true) {
      if (!defaulted) return false;
      if (defaultCondition === 'currently_owing' && row.balance <= 0) return false;
    }
    if (hasDefaults === false && defaulted) return false;
    if (hasReferrerFilter === true && !hasReferrer(row.referrer)) return false;
    if (hasReferrerFilter === false && hasReferrer(row.referrer)) return false;
    if (search) {
      const hay = `${buyerLabel(row.user)} ${row.user.email ?? ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (minOutstanding != null && Number.isFinite(minOutstanding) && row.balance < minOutstanding) {
      return false;
    }
    if (maxOutstanding != null && Number.isFinite(maxOutstanding) && row.balance > maxOutstanding) {
      return false;
    }
    if (dueBefore != null && Number.isFinite(dueBefore)) {
      if (!row.next_date_of_payment || new Date(row.next_date_of_payment).getTime() > dueBefore) {
        return false;
      }
    }
    if (dueAfter != null && Number.isFinite(dueAfter)) {
      if (!row.next_date_of_payment || new Date(row.next_date_of_payment).getTime() < dueAfter) {
        return false;
      }
    }
    if (startDate != null && Number.isFinite(startDate) && row.createdAt) {
      if (new Date(row.createdAt).getTime() < startDate) return false;
    }
    if (endDate != null && Number.isFinite(endDate) && row.createdAt) {
      if (new Date(row.createdAt).getTime() > endDate) return false;
    }
    return true;
  });

  return sortRows(filtered, query.sort);
}

function summarize(filtered: PaymentPlanRow[]): PaymentPlansSummary {
  const byType = PAYMENT_PLAN_ASSET_TYPES.map((asset_type: PaymentPlanAssetType) => {
    const ofType = filtered.filter((row) => row.asset.asset_type === asset_type);
    return {
      asset_type,
      count: ofType.length,
      total_outstanding: ofType.reduce((sum, row) => sum + row.balance, 0),
    };
  });

  return {
    total_plans: filtered.length,
    total_units: filtered.reduce((sum, row) => sum + row.no_of_units, 0),
    total_plan_value: filtered.reduce((sum, row) => sum + row.amount_payable, 0),
    total_amount_payable: filtered.reduce((sum, row) => sum + row.amount_payable, 0),
    total_amount_paid: filtered.reduce((sum, row) => sum + row.amount_paid, 0),
    total_outstanding: filtered.reduce((sum, row) => sum + row.balance, 0),
    total_default_amount: filtered.reduce((sum, row) => sum + row.default_amount, 0),
    active_count: filtered.filter((row) => row.status === 'active').length,
    overdue_count: filtered.filter((row) => row.status === 'overdue').length,
    suspended_count: filtered.filter((row) => row.status === 'suspended').length,
    completed_count: filtered.filter((row) => row.status === 'completed').length,
    cancelled_count: filtered.filter((row) => row.status === 'cancelled').length,
    closed_count: filtered.filter((row) => row.status === 'closed').length,
    by_asset_type: byType,
    with_referrer_count: filtered.filter((row) => hasReferrer(row.referrer)).length,
    without_referrer_count: filtered.filter((row) => !hasReferrer(row.referrer)).length,
    defaulted_count: filtered.filter((row) => row.default_count > 0).length,
  };
}

function toCsv(filtered: PaymentPlanRow[]): string {
  const header = [
    'id',
    'user',
    'email',
    'asset',
    'asset_type',
    'status',
    'amount_paid',
    'balance',
    'next_date_of_payment',
    'createdAt',
  ];
  const lines = filtered.map((row) =>
    [
      row.id,
      buyerLabel(row.user),
      row.user.email,
      row.asset.asset_name,
      row.asset.asset_type,
      row.status,
      row.amount_paid,
      row.balance,
      row.next_date_of_payment,
      row.createdAt,
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

export const paymentPlanRoutes: MockRoutes = {
  'GET /admin/payment-plans': ({ query }) => paged(applyFilters(query), query, 25),
  'GET /admin/payment-plans/summary': ({ query }) => summarize(applyFilters(query)),
  'GET /admin/payment-plans/export': ({ query }) => {
    const filtered = applyFilters(query);
    if (filtered.length > 50_000) {
      throw new MockHttpError(
        413,
        `Export would include ${filtered.length} rows; narrow your filter to under 50,000.`,
        'EXPORT_TOO_LARGE'
      );
    }
    return toCsv(filtered);
  },
};
