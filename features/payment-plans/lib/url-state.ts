import { COLUMNS, DEFAULT_SORT, DEFAULT_VISIBLE_COLUMNS } from '../constants/columns';
import {
  DEFAULT_CONDITION_VALUES,
  type FilterFormValues,
} from '../schemas/payment-plans-filter.schema';
import {
  PAYMENT_PLAN_ASSET_TYPES,
  PAYMENT_PLAN_STATUSES,
  PLAN_SORT_FIELDS,
  type PaymentPlanAssetType,
  type PaymentPlanStatus,
} from '../schemas/payment-plan-row.schema';

const STATUS_SET = new Set<string>(PAYMENT_PLAN_STATUSES);
const ASSET_TYPE_SET = new Set<string>(PAYMENT_PLAN_ASSET_TYPES);
const CONDITION_SET = new Set<string>(DEFAULT_CONDITION_VALUES);
const SORT_FIELD_SET = new Set<string>(PLAN_SORT_FIELDS);

/** Bookmarked FE keys → `PLAN_SORT_FIELDS`. Anything else falls back to default. */
const SORT_ALIASES: Record<string, string> = {
  created: 'createdAt',
  outstanding: 'balance',
  next_payment: 'next_date_of_payment',
  next_payment_due: 'next_date_of_payment',
};

export function sanitizeSort(sort?: string | null): string {
  const raw = sort || DEFAULT_SORT;
  const desc = raw.startsWith('-');
  const token = desc ? raw.slice(1) : raw;
  const mapped = SORT_ALIASES[token] ?? token;
  if (!SORT_FIELD_SET.has(mapped)) return DEFAULT_SORT;
  return desc ? `-${mapped}` : mapped;
}

function csv(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw.split(',').map((part) => part.trim()).filter(Boolean);
}

function optionalBool(sp: URLSearchParams, key: string): boolean | undefined {
  const raw = sp.get(key);
  if (raw == null || raw === '') return undefined;
  return raw === 'true';
}

function optionalNumber(sp: URLSearchParams, key: string): number | undefined {
  const raw = sp.get(key);
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseFilter(sp: URLSearchParams): FilterFormValues {
  const status = csv(sp, 'status').filter((value): value is PaymentPlanStatus =>
    STATUS_SET.has(value)
  );
  const asset_type = csv(sp, 'asset_type').filter((value): value is PaymentPlanAssetType =>
    ASSET_TYPE_SET.has(value)
  );
  const conditionRaw = sp.get('default_condition');
  const default_condition =
    conditionRaw && CONDITION_SET.has(conditionRaw)
      ? (conditionRaw as FilterFormValues['default_condition'])
      : 'currently_owing';

  return {
    status,
    asset_type,
    has_defaults: optionalBool(sp, 'has_defaults'),
    default_condition,
    has_referrer: optionalBool(sp, 'has_referrer'),
    start_date: sp.get('start_date') ?? undefined,
    end_date: sp.get('end_date') ?? undefined,
    next_payment_due_before: sp.get('next_payment_due_before') ?? undefined,
    next_payment_due_after: sp.get('next_payment_due_after') ?? undefined,
    min_outstanding: optionalNumber(sp, 'min_outstanding'),
    max_outstanding: optionalNumber(sp, 'max_outstanding'),
    search: sp.get('search') ?? undefined,
    sort: sanitizeSort(sp.get('sort')),
  };
}

export function parseColumns(sp: URLSearchParams): string[] {
  const raw = sp.get('columns');
  if (raw) {
    const allowed = new Set(COLUMNS.map((c) => c.key));
    const keys = raw.split(',').map((part) => part.trim()).filter((key) => allowed.has(key));
    return keys.length ? keys : DEFAULT_VISIBLE_COLUMNS;
  }
  return DEFAULT_VISIBLE_COLUMNS;
}

export function serializeFilterToParams(
  values: FilterFormValues,
  extras?: { columns?: string | null; sort?: string | null }
): URLSearchParams {
  const params = new URLSearchParams();
  if (values.status?.length) params.set('status', values.status.join(','));
  if (values.asset_type?.length) params.set('asset_type', values.asset_type.join(','));
  if (values.has_defaults != null) params.set('has_defaults', String(values.has_defaults));
  if (values.has_defaults && values.default_condition) {
    params.set('default_condition', values.default_condition);
  }
  if (values.has_referrer != null) params.set('has_referrer', String(values.has_referrer));
  if (values.start_date) params.set('start_date', values.start_date);
  if (values.end_date) params.set('end_date', values.end_date);
  if (values.next_payment_due_before) {
    params.set('next_payment_due_before', values.next_payment_due_before);
  }
  if (values.next_payment_due_after) {
    params.set('next_payment_due_after', values.next_payment_due_after);
  }
  if (values.min_outstanding != null) params.set('min_outstanding', String(values.min_outstanding));
  if (values.max_outstanding != null) params.set('max_outstanding', String(values.max_outstanding));
  if (values.search) params.set('search', values.search);

  const sort = sanitizeSort(extras?.sort ?? values.sort);
  if (sort && sort !== DEFAULT_SORT) params.set('sort', sort);
  else if (sort === DEFAULT_SORT) {
    // omit default sort from the URL
  } else if (sort) {
    params.set('sort', sort);
  }

  if (extras?.columns) params.set('columns', extras.columns);
  params.set('page', '1');
  return params;
}

export function buildPaymentPlansQueryParams(
  filter: FilterFormValues,
  page: number,
  limit: number
): Record<string, unknown> {
  return {
    page,
    limit,
    status: filter.status?.length ? filter.status.join(',') : undefined,
    asset_type: filter.asset_type?.length ? filter.asset_type.join(',') : undefined,
    has_defaults: filter.has_defaults ?? undefined,
    default_condition:
      filter.has_defaults && filter.default_condition ? filter.default_condition : undefined,
    has_referrer: filter.has_referrer ?? undefined,
    start_date: filter.start_date || undefined,
    end_date: filter.end_date || undefined,
    next_payment_due_before: filter.next_payment_due_before || undefined,
    next_payment_due_after: filter.next_payment_due_after || undefined,
    min_outstanding: filter.min_outstanding ?? undefined,
    max_outstanding: filter.max_outstanding ?? undefined,
    search: filter.search || undefined,
    sort: sanitizeSort(filter.sort),
  };
}
