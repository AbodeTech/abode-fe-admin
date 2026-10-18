import {
  PRO_GROUPS,
  PRO_SORTS,
  type ManagerDashboardParams,
  type ProGroup,
  type ProSort,
} from '../schemas/manager-dashboard.schema';

/**
 * Builds the FLAT query params every dashboard and roster-export route takes.
 *
 * There is no nested `filter` object any more, and `forbidNonWhitelisted` means
 * an unrecognised key is a 400 — so nothing is passed through blind: an
 * unknown group or sort is DROPPED rather than forwarded.
 */

export interface DashboardUrlFilterParams {
  startDate?: string | null;
  endDate?: string | null;
  /**
   * Explicit month/year — the "Last month" control and any arbitrary month
   * picker. Sent as period_type MONTH so the BE resolves both the data window
   * AND the target lookup key to that specific month; the canonical vocabulary
   * (`this_month` / `last_month`) cannot express an arbitrary one.
   */
  month?: string | null;
  year?: string | null;
  proGroup?: string | null;
  proSort?: string | null;
}

const PRO_GROUP_VALUES = new Set<string>(PRO_GROUPS);
const PRO_SORT_VALUES = new Set<string>(PRO_SORTS);

const parseIntOrNull = (raw?: string | null): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** Lagos is UTC+1 all year. */
const LAGOS_OFFSET = '+01:00';
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A custom range's yyyy-MM-dd ends as whole Lagos days. The BE reads them with
 * `new Date(value)` and compares `<= end`, so a bare "2026-10-12" would mean
 * midnight UTC at the START of the 12th and drop the end date entirely (and a
 * one-day range would count nothing).
 */
const dayStart = (day: string) => (DAY_ONLY.test(day) ? `${day}T00:00:00.000${LAGOS_OFFSET}` : day);
const dayEnd = (day: string) => (DAY_ONLY.test(day) ? `${day}T23:59:59.999${LAGOS_OFFSET}` : day);

const buildPeriodParams = ({
  startDate = null,
  endDate = null,
  month = null,
  year = null,
}: Pick<
  DashboardUrlFilterParams,
  'startDate' | 'endDate' | 'month' | 'year'
>): ManagerDashboardParams => {
  if (startDate && endDate) {
    return { period_type: 'CUSTOM', start_date: dayStart(startDate), end_date: dayEnd(endDate) };
  }

  const m = parseIntOrNull(month);
  const y = parseIntOrNull(year);
  if (m && y && m >= 1 && m <= 12 && y > 1970) {
    return { period_type: 'MONTH', month: m, year: y };
  }

  // No month in the URL: the current month (the BE's MONTH default). WEEK and
  // YEAR are not offered — the BE scores them against the current month's
  // targets, so the score would be wrong for both.
  return { period_type: 'MONTH' };
};

/** Period / date only — drives the KPI sections, not the roster table. */
export const buildManagerDashboardPeriodFilter = (
  params: Pick<DashboardUrlFilterParams, 'startDate' | 'endDate' | 'month' | 'year'>
): ManagerDashboardParams => buildPeriodParams(params);

/** Full params including roster group/sort — for the tables and CSV exports. */
export const buildManagerDashboardFilter = ({
  startDate = null,
  endDate = null,
  month = null,
  year = null,
  proGroup = null,
  proSort = null,
}: DashboardUrlFilterParams): ManagerDashboardParams => {
  const params = buildPeriodParams({ startDate, endDate, month, year });

  if (proGroup && PRO_GROUP_VALUES.has(proGroup)) {
    params.pro_group = proGroup as ProGroup;
  }
  if (proSort && PRO_SORT_VALUES.has(proSort)) {
    params.pro_sort = proSort as ProSort;
  }

  return params;
};
