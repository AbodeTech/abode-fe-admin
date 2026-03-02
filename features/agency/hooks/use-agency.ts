import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { agencyKeys } from './query-keys';
import { AgencyDetail, AgencyStatistics } from '../components/AgencyDetailView';
import { AgencyUserRow } from '../components/AgencyUsersTable';
import { AgencyTransactionRow } from '../components/AgencyTransactionsTable';

const GET_AGENCY_BY_ID = `
  query GetAgencyById($id: ID!) {
    getAgencyById(id: $id) {
      agency {
        _id
        agency_name
        agency_code
        email
        phoneNumber
        address
        city
        state
        country
        commission_percentage
        communication_preference
        status
        verified
        is_suspended
        suspension_reason
        withdrawn_commission
        available_commission_balance
        createdAt
        referrals {
          user {
            _id
            firstName
            lastName
            email
            phoneNumber
          }
        }
        transactions {
          amount
          commission_earned
          transaction_type
          transaction_date
          asset {
            asset_name
            asset_type
          }
          referral_user {
            firstName
            lastName
            email
          }
          transaction_id {
            _id
            status
            admin_status
          }
        }
      }
      statistics {
        total_referrals
        active_referrals
        purchases_on_behalf
        sub_realtors_count
        total_transactions
        total_commission_earned
        withdrawn_amount
        available_balance
      }
      success
      message
    }
  }
`;

interface AgencyByIdResponse {
  getAgencyById?: {
    agency?: AgencyDetail & {
      referrals?: Array<{
        user?: AgencyUserRow;
      }>;
      transactions?: AgencyTransactionRow[];
    };
    statistics?: AgencyStatistics;
    success?: boolean;
    message?: string;
  };
}

export const useAgency = (agencyId: string) => {
  return useQuery({
    queryKey: agencyKeys.detail(agencyId),
    queryFn: () => executeRaw<AgencyByIdResponse>(GET_AGENCY_BY_ID, { id: agencyId }),
    enabled: Boolean(agencyId),
    select: (data) => data.getAgencyById,
  });
};

export type AgencyDetailData = NonNullable<ReturnType<typeof useAgency>['data']>;
