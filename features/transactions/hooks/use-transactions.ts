import { useQuery } from '@tanstack/react-query';
import { execute, executeRaw } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { transactionKeys } from './query-keys';
type TransactionType = "credit" | "debit" | "asset" | "commission" | "document";

// --- Queries ---

const GET_TOPUP_TRANSACTION_QUERY = graphql(`
  query GetTopupTransaction($page: Int!, $limit: Int!) {
    getTopupTransaction(page: $page, limit: $limit) {
      count
      data {
        ...TopupTransactionsTable_data
      }
    }
  }
`);

const GET_WITHDRAWAL_TRANSACTION_QUERY = graphql(`
  query GetWithdrawalTransaction($page: Int!, $limit: Int!, $status: String, $search: String) {
    getWithdrawalTransaction(page: $page, limit: $limit, status: $status, search: $search) {
      count
      data {
        ...WithdrawalTransactionsTable_data
      }
    }
  }
`);

const GET_DOCUMENT_TRANSACTION_QUERY = graphql(`
  query GetDocumentTransaction($page: Int!, $limit: Int!, $status: String, $assetType: String, $salesType: String, $startDate: Date, $endDate: Date, $search: String) {
    getDocumentTransaction(page: $page, limit: $limit, status: $status, assetType: $assetType, salesType: $salesType, startDate: $startDate, endDate: $endDate, search: $search) {
      data {
        ...DocumentTransactionsTable_data
      }
      count
    }
  }
`);

const GET_COMMISSION_TRANSACTIONS_QUERY = `
  query GetCommissionTransactions($page: Int!, $limit: Int!, $startDate: String, $endDate: String, $commissionSource: String) {
    getCommissionTransactions(
      page: $page,
      startDate: $startDate,
      endDate: $endDate,
      limit: $limit,
      commissionSource: $commissionSource
    ) {
      count
      data {
        _id
        tin
        admin_status
        amount
        asset_type
        description
        user {
          _id
          firstName
          lastName
          referrer
          referral_status
          email
          tin
        }
        plot_size
        status
        referral
        transaction_type
        time_of_transaction
      }
    }
  }
`;

const GET_TRANSACTION_DATA_POINTS_QUERY = graphql(`
  query AdminTransactionDataPoint($dataPointInput: DataPointInput!) {
    adminTransactionDataPoint(dataPointInput: $dataPointInput) {
      pending_transaction
      approved_transaction
      rejected_transaction
      commission_transaction
      users_wallet_balance
      auto_approved_transaction
      auto_failed_transaction
    }
  }
`);

// --- Hooks ---

interface UseTopupTransactionsParams {
  page?: number;
  limit?: number;
}

export const useTopupTransactions = (params?: UseTopupTransactionsParams) => {
  const { page = 1, limit = 10 } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.topupList({ page, limit }),
    queryFn: () =>
      execute(GET_TOPUP_TRANSACTION_QUERY, { page, limit }),
    select: (data) => data.getTopupTransaction,
  });
};

interface UseWithdrawalTransactionsParams {
  page?: number;
  limit?: number;
  status?: string | null;
  search?: string | null;
}

export const useWithdrawalTransactions = (params?: UseWithdrawalTransactionsParams) => {
  const { page = 1, limit = 10, status = null, search = null } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.withdrawalList({ page, limit, status, search }),
    queryFn: () =>
      execute(GET_WITHDRAWAL_TRANSACTION_QUERY, { page, limit, status, search }),
    select: (data) => data.getWithdrawalTransaction,
  });
};

interface UseDocumentTransactionsParams {
  page?: number;
  limit?: number;
  status?: string | null;
  /** Asset type filter (e.g. "flex" | "full-ownership") — BE addition. */
  assetType?: string | null;
  /** Sales type filter — BE addition. */
  salesType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
}

export const useDocumentTransactions = (params?: UseDocumentTransactionsParams) => {
  const {
    page = 1,
    limit = 10,
    status = null,
    assetType = null,
    salesType = null,
    startDate = null,
    endDate = null,
    search = null,
  } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.documentList({
      page,
      limit,
      status,
      assetType,
      salesType,
      startDate,
      endDate,
      search,
    }),
    queryFn: () =>
      execute(GET_DOCUMENT_TRANSACTION_QUERY, {
        page,
        limit,
        status,
        assetType,
        salesType,
        startDate,
        endDate,
        search,
      }),
    select: (data) => data.getDocumentTransaction,
  });
};

interface UseCommissionTransactionsParams {
  page?: number;
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
  commissionSource?: string | null;
}

export const useCommissionTransactions = (params?: UseCommissionTransactionsParams) => {
  const { page = 1, limit = 10, startDate = null, endDate = null, commissionSource = null } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.commissionList({ page, limit, startDate, endDate, commissionSource }),
    queryFn: () =>
      executeRaw(GET_COMMISSION_TRANSACTIONS_QUERY, { page, limit, startDate, endDate, commissionSource }),
    select: (data: any) => data.getCommissionTransactions,
  });
};

export const useTransactionDataPoints = (type: TransactionType) => {
  return useQuery({
    queryKey: transactionKeys.dataPoints(type),
    queryFn: () =>
      execute(GET_TRANSACTION_DATA_POINTS_QUERY, { dataPointInput: { type } }),
    select: (data) => data.adminTransactionDataPoint,
  });
};

// --- Asset Transactions ---

const GET_ASSET_TRANSACTION_QUERY = graphql(`
  query GetAssetTransaction($assetType: String, $transactionType: String, $status: String, $startDate: Date, $endDate: Date, $salesType: String, $page: Int!, $limit: Int!, $search: String) {
    getAssetTransaction(assetType: $assetType, transactionType: $transactionType, status: $status, startDate: $startDate, endDate: $endDate, salesType: $salesType, page: $page, limit: $limit, search: $search) {
      data {
        ...AssetTransactionsTable_data
      }
      count
    }
  }
`);

const GET_ASSET_TRANSACTION_STATS_QUERY = graphql(`
  query GetAssetTransactionsStatistics($filters: AssetTransactionFilters) {
    getAssetTransactionData(filters: $filters) {
      statistics {
        totalTransactions
        approvedTransactions
        totalApprovedAmount
        pendingTransactions
        totalPendingAmount
        declinedTransactions
        totalDeclinedAmount
        new_sales
        total_new_sales
        flexTransactions
        totalFlexAmount
        new_flex_sales
        flex_recurring_sales
        total_flex_recurring_sales
        fullOwnershipTransactions
        totalFullOwnershipAmount
        new_fullOwnership_sales
        total_new_fullOwnership_sales
        fullOwnership_recurring_sales
        total_fullOwnership_recurring_sales
      }
    }
  }
`);

import type { AssetTransactionFilters } from '@/lib/gql/graphql';

interface UseAssetTransactionsParams {
  page?: number;
  limit?: number;
  transactionType?: string | null;
  assetType?: string | null;
  salesType?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
}

export const useAssetTransactions = (params?: UseAssetTransactionsParams) => {
  const {
    page = 1,
    limit = 10,
    transactionType = null,
    assetType = null,
    salesType = null,
    status = null,
    startDate = null,
    endDate = null,
    search = null,
  } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.assetList({ page, limit, transactionType, assetType, salesType, status, startDate, endDate, search }),
    queryFn: () =>
      execute(GET_ASSET_TRANSACTION_QUERY, { page, limit, transactionType, assetType, salesType, status, startDate, endDate, search }),
    select: (data) => data.getAssetTransaction,
  });
};



export const useAssetTransactionStats = (params?: AssetTransactionFilters) => {
  const filters = params ?? {};

  return useQuery({
    queryKey: transactionKeys.assetStats(filters),
    queryFn: () =>
      execute(GET_ASSET_TRANSACTION_STATS_QUERY, { filters }),
    select: (data) => data.getAssetTransactionData?.statistics,
  });
};

// Export types for consumers
export type TopupTransactionsData = NonNullable<ReturnType<typeof useTopupTransactions>['data']>;
export type WithdrawalTransactionsData = NonNullable<ReturnType<typeof useWithdrawalTransactions>['data']>;
export type DocumentTransactionsData = NonNullable<ReturnType<typeof useDocumentTransactions>['data']>;
export type CommissionTransactionsData = NonNullable<ReturnType<typeof useCommissionTransactions>['data']>;
export type AssetTransactionsData = NonNullable<ReturnType<typeof useAssetTransactions>['data']>;
