import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { PeriodType, ProRosterGroup, ProRosterSort } from "@/lib/gql/graphql";

const PRO_GROUP_VALUES = new Set<string>(Object.values(ProRosterGroup));
const PRO_SORT_VALUES = new Set<string>(Object.values(ProRosterSort));

export interface DashboardUrlFilterParams {
  period?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Explicit month/year — used by "Last month" and any future arbitrary
   * month picker. When present, translates to periodType: MONTH so BE
   * targets are looked up for that specific month. */
  month?: string | null;
  year?: string | null;
  proGroup?: string | null;
  proSort?: string | null;
}

const parseIntOrNull = (raw?: string | null): number | null => {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const buildPeriodFilter = ({
  period = null,
  startDate = null,
  endDate = null,
  month = null,
  year = null,
}: Pick<
  DashboardUrlFilterParams,
  "period" | "startDate" | "endDate" | "month" | "year"
>): ManagerDashboardFilterInput => {
  if (startDate && endDate) {
    return { periodType: PeriodType.Custom, startDate, endDate };
  }

  const m = parseIntOrNull(month);
  const y = parseIntOrNull(year);
  if (m && y && m >= 1 && m <= 12 && y > 1970) {
    // Specific month picked. periodType MONTH + month/year gives the BE
    // both the correct data window AND the correct target lookup key.
    return { periodType: PeriodType.Month, month: m, year: y };
  }

  return {
    periodType:
      period === "week"
        ? PeriodType.Week
        : period === "year"
          ? PeriodType.Year
          : PeriodType.Month,
  };
};

/** Period / date only — drives KPI sections (not roster group or sort). */
export const buildManagerDashboardPeriodFilter = (
  params: Pick<
    DashboardUrlFilterParams,
    "period" | "startDate" | "endDate" | "month" | "year"
  >
): ManagerDashboardFilterInput => buildPeriodFilter(params);

/** Full filter including roster group/sort — for tables and CSV export. */
export const buildManagerDashboardFilter = ({
  period = null,
  startDate = null,
  endDate = null,
  month = null,
  year = null,
  proGroup = null,
  proSort = null,
}: DashboardUrlFilterParams): ManagerDashboardFilterInput => {
  const filter = buildPeriodFilter({ period, startDate, endDate, month, year });

  if (proGroup && PRO_GROUP_VALUES.has(proGroup)) {
    filter.proGroup = proGroup as ProRosterGroup;
  }
  if (proSort && PRO_SORT_VALUES.has(proSort)) {
    filter.proSort = proSort as ProRosterSort;
  }

  return filter;
};
