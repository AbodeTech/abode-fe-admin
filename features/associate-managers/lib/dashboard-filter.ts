import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { PeriodType, ProRosterGroup, ProRosterSort } from "@/lib/gql/graphql";

const PRO_GROUP_VALUES = new Set<string>(Object.values(ProRosterGroup));
const PRO_SORT_VALUES = new Set<string>(Object.values(ProRosterSort));

export interface DashboardUrlFilterParams {
  period?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  proGroup?: string | null;
  proSort?: string | null;
}

const buildPeriodFilter = ({
  period = null,
  startDate = null,
  endDate = null,
}: Pick<
  DashboardUrlFilterParams,
  "period" | "startDate" | "endDate"
>): ManagerDashboardFilterInput =>
  startDate && endDate
    ? { periodType: PeriodType.Custom, startDate, endDate }
    : {
        periodType:
          period === "week"
            ? PeriodType.Week
            : period === "year"
              ? PeriodType.Year
              : PeriodType.Month,
      };

/** Period / date only — drives KPI sections (not roster group or sort). */
export const buildManagerDashboardPeriodFilter = (
  params: Pick<DashboardUrlFilterParams, "period" | "startDate" | "endDate">
): ManagerDashboardFilterInput => buildPeriodFilter(params);

/** Full filter including roster group/sort — for tables and CSV export. */
export const buildManagerDashboardFilter = ({
  period = null,
  startDate = null,
  endDate = null,
  proGroup = null,
  proSort = null,
}: DashboardUrlFilterParams): ManagerDashboardFilterInput => {
  const filter = buildPeriodFilter({ period, startDate, endDate });

  if (proGroup && PRO_GROUP_VALUES.has(proGroup)) {
    filter.proGroup = proGroup as ProRosterGroup;
  }
  if (proSort && PRO_SORT_VALUES.has(proSort)) {
    filter.proSort = proSort as ProRosterSort;
  }

  return filter;
};
