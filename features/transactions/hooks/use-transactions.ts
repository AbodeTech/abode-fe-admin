import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
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

const GET_DOCUMENT_TRANSACTION_QUERY = graphql(`
  query GetDocumentTransaction($page: Int!, $limit: Int!, $status: String, $startDate: Date, $endDate: Date, $search: String) {
    getDocumentTransaction(page: $page, limit: $limit, status: $status, startDate: $startDate, endDate: $endDate, search: $search) {
      data {
        ...DocumentTransactionsTable_data
      }
      count
    }
  }
`);

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

interface UseDocumentTransactionsParams {
  page?: number;
  limit?: number;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
}

export const useDocumentTransactions = (params?: UseDocumentTransactionsParams) => {
  const { page = 1, limit = 10, status = null, startDate = null, endDate = null, search = null } = params ?? {};

  return useQuery({
    queryKey: transactionKeys.documentList({ page, limit, status, startDate, endDate, search }),
    queryFn: () =>
      execute(GET_DOCUMENT_TRANSACTION_QUERY, { page, limit, status, startDate, endDate, search }),
    select: (data) => data.getDocumentTransaction,
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

// Export types for consumers
export type TopupTransactionsData = NonNullable<ReturnType<typeof useTopupTransactions>['data']>;
export type DocumentTransactionsData = NonNullable<ReturnType<typeof useDocumentTransactions>['data']>;
