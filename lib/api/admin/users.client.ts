import { fetchGraphql } from "@/lib/graphql-client";
import { GetAllUsersResponse, GetUserDetailsResponse, SystemUsersOverviewResponse } from "./users.types";

export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  searchQuery?: string,
  hasReferral?: boolean,
  hasAsset?: boolean,
  referralStatus?: string,
  howDidYouHearAboutUs?: string
) => {
  const query = `
    query GetAllUsers($page: Int!, $searchQuery: String, $limit: Int!, $hasReferral: Boolean, $hasAsset: Boolean, $referralStatus: String, $howDidYouHearAboutUs: String) {
      getAllUsers(page: $page, searchQuery: $searchQuery, limit: $limit, hasReferral: $hasReferral, hasAsset: $hasAsset, referralStatus: $referralStatus, howDidYouHearAboutUs: $howDidYouHearAboutUs) {
        count
        data {
          _id
          email
          firstName
          is_suspended
          referral_status
          lastName
          howYouHearAboutUs
          gender
          country
          createdAt
          subscriptions
          Networth
          virtual_networth
          virtual_subscriptions
          referrer
        }
      }
    }
  `;

  const variables = {
    page,
    limit,
    searchQuery,
    hasReferral,
    hasAsset,
    referralStatus,
    howDidYouHearAboutUs,
  };

  const response = await fetchGraphql<GetAllUsersResponse>(query, variables);
  return response.getAllUsers;
};

export const getUserDetailsByAdmin = async (id: string) => {
  const query = `
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
  `;

  const variables = {
    getUserDetailsByAdminId: id,
  };

  const response = await fetchGraphql<GetUserDetailsResponse>(query, variables);
  return response.getUserDetailsByAdmin;
};

export const getSystemUsersOverview = async () => {
  const query = `
    query Metrics {
      getSystemUsersOverview {
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
  `;

  const response = await fetchGraphql<SystemUsersOverviewResponse>(query);
  return response.getSystemUsersOverview.metrics;
};
