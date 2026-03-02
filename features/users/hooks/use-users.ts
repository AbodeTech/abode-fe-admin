import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { userKeys } from './query-keys';
import { UsersTableFragment } from '../components/all/UsersTable';

const GET_ALL_USERS_QUERY = graphql(`
  query GetAllUsers($page: Int!, $searchQuery: String, $limit: Int!, $hasReferral: Boolean, $hasAsset: Boolean, $referralStatus: String, $howDidYouHearAboutUs: String, $startDate: String, $endDate: String) {
    getAllUsers(page: $page, searchQuery: $searchQuery, limit: $limit, hasReferral: $hasReferral, hasAsset: $hasAsset, referralStatus: $referralStatus, howDidYouHearAboutUs: $howDidYouHearAboutUs, startDate: $startDate, endDate: $endDate) {
      count
      data {
        ...UsersTableFragment
      }
    }
  }
`);

const GET_USER_DETAILS_QUERY = graphql(`
  query GetUserDetailsByAdmin($getUserDetailsByAdminId: ID!) {
    getUserDetailsByAdmin(id: $getUserDetailsByAdminId) {
      Networth
      virtual_networth
      virtual_subscriptions
      _id
      address
      amount_paid
      amount_payable
      balance_payable
      referral_status
      country
      date_of_birth
      email
      last_login
      default_status
      employment_status
      firstName
      gender
      lastName
      marital_status
      occupation
      phoneNumber
      is_suspended
      profile_pic
      referral {
        lastName
        firstName
        email
      }
      kyc {
        tin
      }
      subscriptions
      transaction {
        _id
        time_of_transaction
        amount
        type
        status
        description
        transaction_type
        paystack_reference
        transfer_reference
        transfer_file {
          file
        }
      }
      wallet {
        balance
      }
      units_purchased
      userName
      next_date_of_payment
    }
  }
`);

const GET_SYSTEM_USERS_OVERVIEW_QUERY = graphql(`
  query Metrics($startDate: String, $endDate: String) {
    getSystemUsersOverview(startDate: $startDate, endDate: $endDate) {
      metrics {
        totalUsers
        referralStatusCounts {
          user
          associate
          associatePro
        }
        noReferralUsers
        users_with_assets
        flexSubscribers
        fullOwnershipSubscribers
        defaultUsers
        overdueUsers
        active_associate
        active_associate_pro
      }
    }
  }
`);

// Keep fragment import referenced for codegen fragment registration.
void UsersTableFragment;

interface UseUsersParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  hasReferral?: boolean;
  hasAsset?: boolean;
  referralStatus?: string;
  howDidYouHearAboutUs?: string;
  startDate?: string;
  endDate?: string;
}

export const useUsers = (params?: UseUsersParams) => {
  const { page = 1, limit = 10, ...filters } = params ?? {};

  return useQuery({
    queryKey: userKeys.list({ page, limit, ...filters }),
    queryFn: () =>
      execute(GET_ALL_USERS_QUERY, { page, limit, ...filters }),
    select: (data) => data.getAllUsers,
  });
};

export const useUserDetails = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () =>
      execute(GET_USER_DETAILS_QUERY, { getUserDetailsByAdminId: id }),
    select: (data) => {
      const user = data.getUserDetailsByAdmin;
      if (!user) return user;

      const transactions = (user.transaction || [])
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .map(t => ({
          ...t,
          amount: t.amount ? parseFloat(String(t.amount).replace(/[^0-9.-]+/g, "")) : 0
        }));

      const wallet = user.wallet ? {
        ...user.wallet,
        balance: user.wallet.balance ? parseFloat(String(user.wallet.balance).replace(/[^0-9.-]+/g, "")) : 0
      } : undefined;

      return {
        ...user,
        transaction: transactions,
        wallet
      };
    },
    enabled: !!id,
  });
};

interface UseSystemUsersOverviewParams {
  startDate?: string;
  endDate?: string;
}

export const useSystemUsersOverview = (params?: UseSystemUsersOverviewParams) => {
  const { startDate, endDate } = params ?? {};

  return useQuery({
    queryKey: [...userKeys.overview(), { startDate, endDate }],
    queryFn: () =>
      execute(GET_SYSTEM_USERS_OVERVIEW_QUERY, { startDate, endDate }),
    select: (data) => data.getSystemUsersOverview?.metrics,
  });
};

export type UsersData = NonNullable<ReturnType<typeof useUsers>['data']>;
export type UserDetailsData = NonNullable<ReturnType<typeof useUserDetails>['data']>;
export type SystemUsersOverviewData = NonNullable<ReturnType<typeof useSystemUsersOverview>['data']>;
