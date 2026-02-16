import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { salesKeys } from './query-keys';

import { SalesRowFragment } from '../components/SalesTable';

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
  query GetSalesDashboard {
    getSalesDashboard {
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
          nextDate: endDate,
          assetType,
        },
      }),
    select: (data) => data.getSalesRecord,
  });
};

export const useSalesSummary = () => {
  return useQuery({
    queryKey: salesKeys.summary(),
    queryFn: () => execute(GET_SALES_DASHBOARD_QUERY, {}),
    select: (data) => data.getSalesDashboard,
  });
};
