import type { SalesPlanStatus } from '../schemas/sales.schema';

/**
 * `plan_status` replaces the old FE-derived Paid/Still Paying/Unpaid
 * heuristic — the BE now computes this server-side (S-12 in the Sales
 * Module v2 doc), precedence closed > completed > suspended > defaulted >
 * active, so the FE just labels the real value instead of re-deriving it
 * from amount_paid/balance/price.
 */
export const PLAN_STATUS_LABELS: Record<SalesPlanStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  defaulted: 'Defaulted',
  closed: 'Closed',
  completed: 'Completed',
};

export const PLAN_STATUS_BADGE_CLASSES: Record<SalesPlanStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  suspended: 'bg-gray-200 text-gray-700',
  defaulted: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
  completed: 'bg-green-100 text-green-800',
};

/** admin_creation_subtype values excluded from every dashboard/analytics total (S-1e). */
const NON_REVENUE_ADMIN_SUBTYPES = new Set(['gift', 'migration', 'compensation', 'relocation_target']);

/**
 * True when a row is visible in the list but excluded from every dashboard
 * card and analytics total — either it's a developer plot (S-1b,
 * unconditional) or an admin-created plan with a non-monetary subtype
 * (S-1e). Used to render the "excluded from totals" badge the doc's §10
 * asks for.
 */
export function isExcludedFromTotals(row: {
  asset: { type: string | null };
  created_by_admin: boolean;
  admin_creation_subtype?: string | null;
}): boolean {
  if (row.asset.type === 'developer_plot') return true;
  if (!row.created_by_admin) return false;
  if (!row.admin_creation_subtype) return false;
  return NON_REVENUE_ADMIN_SUBTYPES.has(row.admin_creation_subtype);
}

export function excludedFromTotalsReason(row: {
  asset: { type: string | null };
  created_by_admin: boolean;
  admin_creation_subtype?: string | null;
}): string | null {
  if (row.asset.type === 'developer_plot') return 'Developer plot — admin-priced, excluded from totals';
  if (row.created_by_admin && row.admin_creation_subtype && NON_REVENUE_ADMIN_SUBTYPES.has(row.admin_creation_subtype)) {
    return `Admin-created (${row.admin_creation_subtype}) — no money changed hands, excluded from totals`;
  }
  return null;
}
