import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { dashboardKeys } from './query-keys';


const GET_ADMIN_DASHBOARD_QUERY = graphql(`
  query GetAdminDashboardDetails($startDate: String, $endDate: String) {
    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {
      ...DashboardQuickOverview_data
      top_associates {
        ...TopAssociates_data
      }
      top_selling_prop {
        ...TopSellingProducts_data
      }
    }
  }
`);

interface UseAdminDashboardParams {
  startDate?: string | null;
  endDate?: string | null;
}

export const useAdminDashboard = (params?: UseAdminDashboardParams) => {
  return useQuery({
    queryKey: dashboardKeys.detail(params),
    queryFn: () =>
      execute(GET_ADMIN_DASHBOARD_QUERY, {
        startDate: params?.startDate,
        endDate: params?.endDate,
      }),
    select: (data) => data.getAdminDashboardDetails,
  });
};

export type DashboardData = NonNullable<
  ReturnType<typeof useAdminDashboard>['data']
>;
