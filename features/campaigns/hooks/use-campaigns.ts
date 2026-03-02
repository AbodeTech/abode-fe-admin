import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';


const GET_RAFFLE_CAMPAIGN = graphql(`
  query ViewAssetRaffledrawPerformance {
    viewAssetRaffledrawPerformance {
      salesMetrics {
        ...RaffleSalesMetrics
      }
      financialMetrics {
        ...RaffleFinancialMetrics
      }
      assetBreakdown {
        ...RaffleAssetBreakdown
      }
      usersWithTickets {
        ...RaffleUserTicket
      }
    }
  }
`);

const GET_HAMPER_CAMPAIGN = graphql(`
  query ViewAssetHamperPerformance {
    viewAssetHamperPerformance {
      assetBreakdown {
        ...HamperAssetBreakdown
      }
      financialMetrics {
        ...HamperFinancialMetrics
      }
      salesMetrics {
        ...HamperSalesMetrics
      }
      referrersWithHampers {
        ...HamperReferrer
      }
    }
  }
`);

const GET_ASSOCIATE_PRO_CAMPAIGN = graphql(`
  query Campaign2000Dashboard {
    getCampaignDashboard {
      ...AssociateProMetricsSection_dashboard
    }
    getAssociateProUpgrades {
      total
      upgrades {
        ...AssociateProUpgradeDetail
      }
    }
    getReferralAnalytics {
      ...AssociateProReferralAnalytics
      ticketHolders {
        tickets {
          ...AssociateProTicketHolder
        }
      }
    }
  }
`);

export const useRaffleCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'raffle'],
    queryFn: () => execute(GET_RAFFLE_CAMPAIGN, {}),
    select: (data) => data.viewAssetRaffledrawPerformance,
  });

export const useHamperCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'hamper'],
    queryFn: () => execute(GET_HAMPER_CAMPAIGN, {}),
    select: (data) => data.viewAssetHamperPerformance,
  });

const GET_ASSOCIATE_RECRUITMENT = graphql(`
  query GetAssociateRecruitmentAnalytics($page: Int!, $limit: Int!, $hasReferral: Boolean, $referralStatus: String, $searchQuery: String) {
    getAllUsersWithFilters(page: $page, limit: $limit, hasReferral: $hasReferral, referralStatus: $referralStatus, searchQuery: $searchQuery) {
      count
      data {
        ...AssociateProRecruitmentUser
      }
    }
  }
`);

export const useAssociateProCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'associate-pro'],
    queryFn: () => execute(GET_ASSOCIATE_PRO_CAMPAIGN, {}),
  });

interface AssociateRecruitmentParams {
  page: number;
  limit: number;
  hasReferral?: boolean;
  referralStatus?: string;
  searchQuery?: string;
}

export const useAssociateRecruitmentAnalytics = (params: AssociateRecruitmentParams) =>
  useQuery({
    queryKey: ['campaigns', 'associate-pro', 'recruitment', params],
    queryFn: () =>
      execute(GET_ASSOCIATE_RECRUITMENT, {
        page: params.page,
        limit: params.limit,
        hasReferral: params.hasReferral,
        referralStatus: params.referralStatus ?? null,
        searchQuery: params.searchQuery ?? null,
      }),
    select: (data) => data.getAllUsersWithFilters,
  });

const GET_CAMPAIGN_PAYMENT_PLANS = graphql(`
  query GetCampaignPaymentPlans($page: Int!, $limit: Int!) {
    getCampaignPaymentPlans(page: $page, limit: $limit) {
      count
      data {
        assetName
        dateStarted
        documentAmountPaid
        documentPrice
        email
        landAmountPaid
        landPrice
        monthsOfSubscription
        nextDateOfPayment
        name
        size
        unit
        userId
      }
    }
  }
`);

export const useCampaignPaymentPlans = (params: { page: number; limit: number }) =>
  useQuery({
    queryKey: ['campaigns', 'raffle', 'payment-plans', params.page, params.limit],
    queryFn: () => execute(GET_CAMPAIGN_PAYMENT_PLANS, params),
    select: (data) => data.getCampaignPaymentPlans,
  });

const GET_RAFFLE_TICKETS = graphql(`
  query GetRaffleTickets($ticketType: TicketTypeFilter) {
    getRaffleTickets(ticketType: $ticketType) {
      data {
        referral_ticket {
          ticket_id
          user_id {
            firstName
            lastName
            email
            phoneNumber
          }
        }
        user_id {
          firstName
          lastName
          email
          phoneNumber
        }
        asset_name
        ticket_id
        total_size
        units_purchased
        size_purchased
        created_date
      }
    }
  }
`);

export const useRaffleTickets = (ticketType: "USER" | "REFERRAL" | "ALL") =>
  useQuery({
    queryKey: ['campaigns', 'raffle', 'tickets', ticketType],
    queryFn: () => execute(GET_RAFFLE_TICKETS, { ticketType: ticketType as any }), // Assuming TicketTypeFilter maps to these strings in generated types
    select: (data) => data.getRaffleTickets,
    enabled: false, // For manual fetching
  });

const GET_HAMPER_TRANSACTIONS = graphql(`
  query GetHamperTransactions($page: Int!, $limit: Int!) {
    getCampaignPaymentPlans(page: $page, limit: $limit) {
      count
      data {
        assetName
        dateStarted
        documentAmountPaid
        documentPrice
        email
        landAmountPaid
        landPrice
        monthsOfSubscription
        nextDateOfPayment
        name
        size
        unit
        userId
      }
    }
  }
`);

export const useHamperTransactions = (params: { page: number; limit: number }) =>
  useQuery({
    queryKey: ['campaigns', 'hamper', 'transactions', params.page, params.limit],
    queryFn: () => execute(GET_HAMPER_TRANSACTIONS, params),
    select: (data) => data.getCampaignPaymentPlans,
  });

const GET_HAMPER_LEADERBOARD = graphql(`
  query GetHamperLeaderboard($startDate: String, $endDate: String) {
    getHamperLeaderboard(startDate: $startDate, endDate: $endDate) {
      email
      hamperCount
      name
      numberOfReferredUsers
      phoneNumber
      referrerId
      totalAmountPaid
      totalAssetValue
      totalBalance
      totalLandPrice
      totalSqmSold
    }
  }
`);

export const useHamperLeaderboard = (params?: { startDate?: string; endDate?: string }) =>
  useQuery({
    queryKey: ['campaigns', 'hamper', 'leaderboard', params?.startDate, params?.endDate],
    queryFn: () => execute(GET_HAMPER_LEADERBOARD, { startDate: params?.startDate, endDate: params?.endDate }),
    select: (data) => data.getHamperLeaderboard,
  });
