import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { agencyKeys } from './query-keys';
import { TopPerformingAgency, TopSellingLand } from '../components/AgencyDashboardPanels';

const GET_AGENCY_DASHBOARD = `
  query GetAgencyDashboard {
    getAgencyDashboard {
      data {
        total_agencies
        total_clients_recruited
        total_land_value_sold
        outstanding_balance
        top_performing_agencies {
          _id
          agency_name
          clients
          email
          phoneNumber
          sales_volume
        }
        top_selling_lands {
          asset_name
          location
          units_sold
          value
        }
      }
      success
    }
  }
`;

interface AgencyDashboardResponse {
  getAgencyDashboard?: {
    data?: {
      total_agencies?: number;
      total_clients_recruited?: number;
      total_land_value_sold?: number;
      outstanding_balance?: number;
      top_performing_agencies?: TopPerformingAgency[];
      top_selling_lands?: TopSellingLand[];
    };
  };
}

export const useAgencyDashboard = () => {
  return useQuery({
    queryKey: agencyKeys.dashboard(),
    queryFn: () => executeRaw<AgencyDashboardResponse>(GET_AGENCY_DASHBOARD),
    select: (data) => data.getAgencyDashboard?.data,
  });
};

export type AgencyDashboardData = NonNullable<ReturnType<typeof useAgencyDashboard>['data']>;
