import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { salesAnalyticsKeys } from "./query-keys";

const GET_SALES_ANALYTICS_KPIS_QUERY = graphql(`
  query GetSalesAnalyticsKpis($startDate: String, $endDate: String, $assetType: String, $location: String) {
    getSalesAnalyticsKpis(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
      success
      data {
        totalSalesValue
        expectedAmount
        totalReceived
        outstandingBalance
        sqmSold
        uniqueBuyers
        uniqueSalesPersons
        completedPayments
        paymentHealth {
          completed
          defaulted
          terminated
        }
        activeTransactions
      }
    }
  }
`);

const GET_SALES_ASSET_BREAKDOWN_QUERY = graphql(`
  query GetSalesAssetBreakdown($startDate: String, $endDate: String, $assetType: String, $location: String) {
    getSalesAssetBreakdown(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
      success
      data {
        location
        assetType
        assetName
        expectedAmount
        totalReceived
        outstandingBalance
        sqmSold
        totalBuyers
        paymentHealth {
          completed
          defaulted
          terminated
        }
      }
    }
  }
`);

const GET_SALES_MONTHLY_TIMELINE_QUERY = graphql(`
  query GetSalesMonthlyTimeline($startDate: String, $endDate: String, $assetType: String, $location: String) {
    getSalesMonthlyTimeline(startDate: $startDate, endDate: $endDate, assetType: $assetType, location: $location) {
      success
      data {
        month
        expectedRevenue
        totalDue
        totalReceived
        activeTransactions
        missedPaymentCount
        defaultedCount
      }
    }
  }
`);

export interface SalesAnalyticsFilters {
  startDate?: string | null;
  endDate?: string | null;
  assetType?: string | null;
  location?: string | null;
}

const toOptional = (value?: string | null) => {
  if (!value || value === "all") return undefined;
  return value;
};

const normalizeFilters = (filters?: SalesAnalyticsFilters) => ({
  startDate: toOptional(filters?.startDate),
  endDate: toOptional(filters?.endDate),
  assetType: toOptional(filters?.assetType),
  location: toOptional(filters?.location),
});

export const useSalesAnalyticsKpis = (filters?: SalesAnalyticsFilters) => {
  const variables = normalizeFilters(filters);

  return useQuery({
    queryKey: salesAnalyticsKeys.kpis(variables),
    queryFn: () => execute(GET_SALES_ANALYTICS_KPIS_QUERY, variables),
    select: (data) => data.getSalesAnalyticsKpis?.data,
  });
};

export const useSalesAssetBreakdown = (filters?: SalesAnalyticsFilters) => {
  const variables = normalizeFilters(filters);

  return useQuery({
    queryKey: salesAnalyticsKeys.assetBreakdown(variables),
    queryFn: () => execute(GET_SALES_ASSET_BREAKDOWN_QUERY, variables),
    select: (data) => data.getSalesAssetBreakdown?.data,
  });
};

export const useSalesMonthlyTimeline = (filters?: SalesAnalyticsFilters) => {
  const variables = normalizeFilters(filters);

  return useQuery({
    queryKey: salesAnalyticsKeys.monthlyTimeline(variables),
    queryFn: () => execute(GET_SALES_MONTHLY_TIMELINE_QUERY, variables),
    select: (data) => data.getSalesMonthlyTimeline?.data,
  });
};
