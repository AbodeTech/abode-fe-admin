import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { SalesRecordFilters } from "@/lib/gql/graphql";
// Cross-feature: TeamSalesSection reuses the canonical sales row UI + fragment
// rather than duplicating 200+ lines. Sales table imports stay scoped to this
// hook + the section component.
import { SalesRowFragment } from "@/features/sales/components/SalesTable";
import { managerKeys } from "./query-keys";

// Keep the fragment referenced so codegen picks it up under our document.
void SalesRowFragment;

const GET_MANAGER_SALES_RECORD_QUERY = graphql(`
  query GetManagerSalesRecord(
    $filters: SalesRecordFilters
    $limit: Int!
    $page: Int!
  ) {
    getManagerSalesRecord(filters: $filters, limit: $limit, page: $page) {
      data {
        ...SalesRowFragment
      }
      count
    }
  }
`);

const ADMIN_GET_MANAGER_SALES_RECORD_QUERY = graphql(`
  query AdminGetManagerSalesRecord(
    $managerId: ID!
    $filters: SalesRecordFilters
    $limit: Int!
    $page: Int!
  ) {
    adminGetManagerSalesRecord(
      managerId: $managerId
      filters: $filters
      limit: $limit
      page: $page
    ) {
      data {
        ...SalesRowFragment
      }
      count
    }
  }
`);

export interface UseTeamSalesParams {
  page?: number;
  limit?: number;
  filters?: SalesRecordFilters | null;
  enabled?: boolean;
}

export const DEFAULT_TEAM_SALES_LIMIT = 25;

/** Logged-in manager's view of their team's sales. */
export const useManagerTeamSales = (params: UseTeamSalesParams = {}) => {
  const { page = 1, limit = DEFAULT_TEAM_SALES_LIMIT, filters = null, enabled = true } = params;
  return useQuery({
    queryKey: managerKeys.teamSalesSelf({ page, limit, filters }),
    queryFn: () =>
      execute(GET_MANAGER_SALES_RECORD_QUERY, { page, limit, filters }),
    enabled,
    select: (data) => data.getManagerSalesRecord,
  });
};

/** Super-admin view of any manager's team sales. */
export const useAdminManagerTeamSales = (
  managerId: string | null,
  params: UseTeamSalesParams = {}
) => {
  const { page = 1, limit = DEFAULT_TEAM_SALES_LIMIT, filters = null, enabled = true } = params;
  return useQuery({
    queryKey: managerKeys.teamSalesAdmin(managerId ?? "", { page, limit, filters }),
    queryFn: () =>
      execute(ADMIN_GET_MANAGER_SALES_RECORD_QUERY, {
        managerId: managerId as string,
        page,
        limit,
        filters,
      }),
    enabled: enabled && Boolean(managerId),
    select: (data) => data.adminGetManagerSalesRecord,
  });
};
