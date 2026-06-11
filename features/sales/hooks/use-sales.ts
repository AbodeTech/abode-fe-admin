import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { salesKeys } from './query-keys';
import { derivePaymentStatus } from '../lib/payment-status';

const GET_SALES_RECORD_QUERY = graphql(`
  query GetSalesRecord($filters: SalesRecordFilters, $limit: Int!, $page: Int!) {
    getSalesRecord(filters: $filters, limit: $limit, page: $page) {
      data {
        ...SalesRowFragment
      }
      count
    }
  }
`);

const GET_SALES_DASHBOARD_QUERY = graphql(`
  query GetSalesDashboard($startDate: String, $endDate: String) {
    getSalesDashboard(startDate: $startDate, endDate: $endDate) {
      ...SummaryCards_dashboard
    }
  }
`);

export interface SalesFilters {
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  assetType?: string | null;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export const DEFAULT_SALES_LIMIT = 25;

export const useSalesRecords = (filters: SalesFilters) => {
  const { page = 1, limit = DEFAULT_SALES_LIMIT, search, startDate, endDate, assetType } = filters;

  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: () =>
      execute(GET_SALES_RECORD_QUERY, {
        page,
        limit,
        filters: {
          search,
          startDate,
          endDate,
          assetType,
        },
      }),
    select: (data) => data.getSalesRecord,
  });
};

const GET_SALES_STATUS_COUNTS_QUERY = graphql(`
  query GetSalesStatusCounts($filters: SalesRecordFilters, $limit: Int!, $page: Int!) {
    getSalesRecord(filters: $filters, limit: $limit, page: $page) {
      count
      data {
        amount_paid
        amount_payable
        balance
        price
      }
    }
  }
`);

export interface SalesStatusCounts {
  total: number;
  paid: number;
  stillPaying: number;
  unpaid: number;
}

export const useSalesStatusCounts = (
  filters: Pick<SalesFilters, 'search' | 'startDate' | 'endDate' | 'assetType'>
) => {
  const { search, startDate, endDate, assetType } = filters;

  return useQuery({
    queryKey: salesKeys.statusCounts({ search, startDate, endDate, assetType }),
    queryFn: () =>
      execute(GET_SALES_STATUS_COUNTS_QUERY, {
        page: 1,
        limit: 1_000_000,
        filters: {
          search,
          startDate,
          endDate,
          assetType,
        },
      }),
    staleTime: 5 * 60 * 1000,
    select: (data): SalesStatusCounts => {
      const records = data.getSalesRecord?.data || [];
      const counts: SalesStatusCounts = {
        total: data.getSalesRecord?.count || records.length,
        paid: 0,
        stillPaying: 0,
        unpaid: 0,
      };
      for (const record of records) {
        if (!record) continue;
        const status = derivePaymentStatus(record);
        if (status === 'Paid') counts.paid += 1;
        else if (status === 'Still Paying') counts.stillPaying += 1;
        else counts.unpaid += 1;
      }
      return counts;
    },
  });
};

export const useSalesSummary = (filters?: { startDate?: string | null; endDate?: string | null }) => {
  const { startDate = null, endDate = null } = filters || {};
  return useQuery({
    queryKey: salesKeys.summary({ startDate, endDate }),
    queryFn: () => {
      const variables: { startDate?: string; endDate?: string } = {};
      if (startDate) variables.startDate = startDate;
      if (endDate) variables.endDate = endDate;
      return execute(GET_SALES_DASHBOARD_QUERY, variables);
    },
    select: (data) => data.getSalesDashboard,
  });
};
