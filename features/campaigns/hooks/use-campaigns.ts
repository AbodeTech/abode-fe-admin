import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { RaffleSalesMetricsFragment, RaffleFinancialMetricsFragment, RaffleAssetBreakdownFragment, RaffleUserTicketFragment } from '../components/RaffleComponents';
import { HamperSalesMetricsFragment, HamperFinancialMetricsFragment, HamperAssetBreakdownFragment, HamperReferrerFragment } from '../components/HamperComponents';
import { AssociateProProgressFragment, AssociateProRevenueMetricsFragment, AssociateProTicketMetricsFragment, AssociateProConversionMetricsFragment, AssociateProUpgradeDetailFragment, AssociateProTopReferrerFragment } from '../components/AssociateProComponents';


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
      associateProProgress {
        ...AssociateProProgress
      }
      revenueMetrics {
        ...AssociateProRevenueMetrics
      }
      ticketMetrics {
        ...AssociateProTicketMetrics
      }
      conversionMetrics {
        ...AssociateProConversionMetrics
      }
    }
    getAssociateProUpgrades {
      total
      upgrades {
        ...AssociateProUpgradeDetail
      }
    }
    getReferralAnalytics {
      topReferrers {
        topReferrers {
          ...AssociateProTopReferrer
        }
      }
    }
  }
`);

export const useRaffleCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'raffle'],
    queryFn: () => execute(GET_RAFFLE_CAMPAIGN as any, {}),
    select: (data: any) => data.viewAssetRaffledrawPerformance,
  });

export const useHamperCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'hamper'],
    queryFn: () => execute(GET_HAMPER_CAMPAIGN as any, {}),
    select: (data: any) => data.viewAssetHamperPerformance,
  });

export const useAssociateProCampaign = () =>
  useQuery({
    queryKey: ['campaigns', 'associate-pro'],
    queryFn: () => execute(GET_ASSOCIATE_PRO_CAMPAIGN as any, {}),
  });
