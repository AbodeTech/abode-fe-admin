import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type {
  ManagerDashboardFilterInput,
  ProRosterSort,
} from "@/lib/gql/graphql";
import { ProRosterGroup, ProRosterSort as ProRosterSortEnum } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const ADMIN_PROS_GROUP_QUERY = graphql(`
  query AdminDashboardProsGroup(
    $managerId: ID!
    $filter: ManagerDashboardFilterInput
  ) {
    adminGetManagerDashboard(managerId: $managerId, filter: $filter) {
      associateProsGroupTotal
      period {
        periodType
        month
        year
        start
        end
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

const SELF_PROS_GROUP_QUERY = graphql(`
  query SelfDashboardProsGroup($filter: ManagerDashboardFilterInput) {
    managerDashboard(filter: $filter) {
      associateProsGroupTotal
      period {
        periodType
        month
        year
        start
        end
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

const ALL_MANAGERS_PROS_GROUP_QUERY = graphql(`
  query AllManagersDashboardProsGroup(
    $filter: ManagerDashboardFilterInput
    $page: Int
    $limit: Int
  ) {
    getAllManagersDashboard(filter: $filter, page: $page, limit: $limit) {
      associateProsGroupTotal
      period {
        periodType
        month
        year
        start
        end
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

const SYSTEM_PROS_GROUP_QUERY = graphql(`
  query SystemDashboardProsGroup(
    $filter: ManagerDashboardFilterInput
    $page: Int
    $limit: Int
  ) {
    getSystemAssociatesDashboard(filter: $filter, page: $page, limit: $limit) {
      associateProsGroupTotal
      period {
        periodType
        month
        year
        start
        end
      }
      associatePros {
        id
        firstName
        lastName
        email
        phoneNumber
        status
        dateRecruited
        totalSales
        revenueGenerated
        lastLogin
        onboardedAt
      }
    }
  }
`);

export type DashboardProsViewMode =
  | "self"
  | "admin"
  | "all-managers"
  | "system-associates";

export const DRAWER_PAGE_SIZE = 25;

export interface UseDashboardProsGroupParams {
  viewMode: DashboardProsViewMode;
  managerId: string | null;
  periodFilter: ManagerDashboardFilterInput;
  group: ProRosterGroup;
  sort?: ProRosterSort | null;
  page?: number;
  enabled?: boolean;
}

function defaultSortForGroup(group: ProRosterGroup): ProRosterSort | undefined {
  switch (group) {
    // Executive lens: rank each drawer by MOST RECENT activity in the axis
    // that defines the group. Cold rosters sink to the bottom, live ones rise.
    // For recruited/upgraded lists this means "who's actively recruiting right
    // now" over "who joined my roster most recently" — the latter is available
    // via the manual sort control.
    case ProRosterGroup.RecruitedInPeriod:
    case ProRosterGroup.UpgradedInPeriod:
    case ProRosterGroup.RecruitedNotOnboarded:
      return ProRosterSortEnum.LastRecruitDesc;
    case ProRosterGroup.SellingInPeriod:
      return ProRosterSortEnum.LastSaleDesc;
    default:
      return undefined;
  }
}

function buildGroupFilter(
  periodFilter: ManagerDashboardFilterInput,
  group: ProRosterGroup,
  sort?: ProRosterSort | null
): ManagerDashboardFilterInput {
  const proSort = sort ?? defaultSortForGroup(group);
  return {
    ...periodFilter,
    proGroup: group,
    ...(proSort ? { proSort } : {}),
  };
}

export const useDashboardProsGroup = ({
  viewMode,
  managerId,
  periodFilter,
  group,
  sort,
  page = 1,
  enabled = true,
}: UseDashboardProsGroupParams) => {
  const filter = buildGroupFilter(periodFilter, group, sort);
  const needsServerPagination =
    viewMode === "all-managers" || viewMode === "system-associates";

  return useQuery({
    queryKey: managerKeys.prosGroup(
      viewMode,
      managerId,
      filter,
      needsServerPagination ? page : null,
      needsServerPagination ? DRAWER_PAGE_SIZE : null
    ),
    queryFn: async () => {
      if (viewMode === "admin") {
        if (!managerId) throw new Error("Manager id is required");
        const data = await execute(ADMIN_PROS_GROUP_QUERY, {
          managerId,
          filter,
        });
        return data.adminGetManagerDashboard;
      }
      if (viewMode === "self") {
        const data = await execute(SELF_PROS_GROUP_QUERY, { filter });
        return data.managerDashboard;
      }
      if (viewMode === "all-managers") {
        const data = await execute(ALL_MANAGERS_PROS_GROUP_QUERY, {
          filter,
          page,
          limit: DRAWER_PAGE_SIZE,
        });
        return data.getAllManagersDashboard;
      }
      const data = await execute(SYSTEM_PROS_GROUP_QUERY, {
        filter,
        page,
        limit: DRAWER_PAGE_SIZE,
      });
      return data.getSystemAssociatesDashboard;
    },
    enabled: enabled && (viewMode !== "admin" || !!managerId),
    placeholderData: keepPreviousData,
    select: (data) => {
      if (!needsServerPagination) {
        const allRows = data.associatePros ?? [];
        const start = (page - 1) * DRAWER_PAGE_SIZE;
        return {
          ...data,
          associatePros: allRows.slice(start, start + DRAWER_PAGE_SIZE),
          associateProsGroupTotal: data.associateProsGroupTotal ?? allRows.length,
        };
      }
      return data;
    },
  });
};
