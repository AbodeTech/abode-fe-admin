"use client";

import { fetchGraphql } from "@/lib/graphql-client";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type {
  TopupTransaction,
  WithdrawalTransaction,
  TransactionDataPoints,
  DocumentTransaction,
  CommissionTransaction,
  ProcessCommissionInput,
} from "./transactions.types";

// --- Topup Transactions ---

const GET_TOPUP_TRANSACTION_QUERY = `
  query GetTopupTransaction($page: Int!, $limit: Int!) {
    getTopupTransaction(page: $page, limit: $limit) {
      data {
        _id
        amount
        status
        admin_status
        time_of_transaction
        transaction_type
        transfer_file {
          file
        }
        user {
          firstName
          lastName
          _id
        }
      }
      count
    }
  }
`;

export const getTopupTransactions = async (
  page: number,
  limit: number,
  searchParams?: ReadonlyURLSearchParams
) => {
  const response = await fetchGraphql<{
    getTopupTransaction: { data: TopupTransaction[]; count: number };
  }>(GET_TOPUP_TRANSACTION_QUERY as any, { page, limit } as any);

  return response.getTopupTransaction;
};

// Topup Approve/Decline Mutations - uses approveTransaction / declineTransaction
const APPROVE_TRANSACTION_MUTATION = `
  mutation ApproveTransaction($approveTransactionId: ID!) {
    approveTransaction(id: $approveTransactionId)
  }
`;

const DECLINE_TRANSACTION_MUTATION = `
  mutation DeclineTransaction($declineTransactionInput: DeclineTransactionInput!) {
    declineTransaction(declineTransactionInput: $declineTransactionInput)
  }
`;

export const approveTopupTransaction = async (id: string) => {
  return fetchGraphql(APPROVE_TRANSACTION_MUTATION as any, { approveTransactionId: id });
};

export const declineTopupTransaction = async (id: string, message: string) => {
  return fetchGraphql(DECLINE_TRANSACTION_MUTATION as any, {
    declineTransactionInput: { transactionId: id, message },
  });
};

// --- Withdrawal Transactions ---

const GET_WITHDRAWAL_TRANSACTION_QUERY = `
  query GetWithdrawalTransaction($page: Int!, $limit: Int!, $status: String) {
    getWithdrawalTransaction(page: $page, limit: $limit, status: $status) {
      data {
        _id
        admin_status
        amount
        time_of_transaction
        bank_details {
          accountNumber
          bankName
          name
        }
        user {
          firstName
          lastName
          _id
          tin
        }
        tin
      }
      count
    }
  }
`;

export const getWithdrawalTransactions = async (
  page: number,
  limit: number,
  searchParams?: ReadonlyURLSearchParams
) => {
  const status = searchParams?.get("transactionstatus") || null;

  const response = await fetchGraphql<{
    getWithdrawalTransaction: { data: WithdrawalTransaction[]; count: number };
  }>(GET_WITHDRAWAL_TRANSACTION_QUERY as any, { page, limit, status } as any);

  return response.getWithdrawalTransaction;
};

// Withdrawal Approve/Decline Mutations - uses approvePaystackTransaction / declineTransaction
const APPROVE_PAYSTACK_TRANSACTION_MUTATION = `
  mutation ApprovePaystackTransaction($approvePaystackTransactionId: ID!) {
    approvePaystackTransaction(id: $approvePaystackTransactionId)
  }
`;

export const approveWithdrawalTransaction = async (id: string) => {
  return fetchGraphql(APPROVE_PAYSTACK_TRANSACTION_MUTATION as any, { approvePaystackTransactionId: id });
};

export const declineWithdrawalTransaction = async (id: string, message: string) => {
  // Withdrawal decline uses the same declineTransaction mutation
  return fetchGraphql(DECLINE_TRANSACTION_MUTATION as any, {
    declineTransactionInput: { transactionId: id, message },
  });
};

// --- Transaction Data Points (Stats) ---

const GET_TRANSACTION_DATA_POINTS_QUERY = `
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
`;

export const getTransactionDataPoints = async (
  type: "credit" | "debit" | "asset" | "commission" | "document"
) => {
  const response = await fetchGraphql<{
    adminTransactionDataPoint: TransactionDataPoints;
  }>(GET_TRANSACTION_DATA_POINTS_QUERY as any, {
    dataPointInput: { type },
  } as any);

  return response.adminTransactionDataPoint;
};

// --- Document Transactions ---

const GET_DOCUMENT_TRANSACTION_QUERY = `
  query GetDocumentTransaction($page: Int!, $limit: Int!, $status: String, $startDate: Date, $endDate: Date) {
    getDocumentTransaction(page: $page, limit: $limit, status: $status, startDate: $startDate, endDate: $endDate) {
      data {
        amount
        description
        admin_status
        plot_size
        asset_type
        referral
        transaction_type
        transfer_file {
          file
        }
        user {
          firstName
          lastName
          _id
        }
        type
        _id
        time_of_transaction
      }
      count
    }
  }
`;

export const getDocumentTransactions = async (
  page: number,
  limit: number,
  searchParams?: ReadonlyURLSearchParams
) => {
  const status = searchParams?.get("transactionstatus") || null;
  const startDate = searchParams?.get("start_date") || null;
  const endDate = searchParams?.get("end_date") || null;

  const response = await fetchGraphql<{
    getDocumentTransaction: { data: DocumentTransaction[]; count: number };
  }>(GET_DOCUMENT_TRANSACTION_QUERY as any, { page, limit, status, startDate, endDate } as any);

  return response.getDocumentTransaction;
};

// Document Approve uses approveAssetTransaction (same as asset)
const APPROVE_DOCUMENT_MUTATION = `
  mutation ApproveAssetTransaction($approveAssetTransactionId: ID!) {
    approveAssetTransaction(id: $approveAssetTransactionId)
  }
`;

const DECLINE_DOCUMENT_MUTATION = `
  mutation DeclineDocumentTransaction($declineTransactionInput: DeclineTransactionInput!) {
    declineDocumentTransaction(declineTransactionInput: $declineTransactionInput)
  }
`;

export const approveDocumentTransaction = async (id: string) => {
  return fetchGraphql(APPROVE_DOCUMENT_MUTATION as any, { approveAssetTransactionId: id });
};

export const declineDocumentTransaction = async (id: string, message: string) => {
  return fetchGraphql(DECLINE_DOCUMENT_MUTATION as any, {
    declineTransactionInput: { transactionId: id, message },
  });
};

// --- Commission Transactions ---

const GET_COMMISSION_TRANSACTION_QUERY = `
  query GetCommissionTransactions($page: Int!, $limit: Int!, $startDate: String, $endDate: String) {
    getCommissionTransactions(page: $page, startDate: $startDate, endDate: $endDate, limit: $limit) {
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
        }
        plot_size
        status
        referral
        transaction_type
        time_of_transaction
        type
      }
    }
  }
`;

export const getCommissionTransactions = async (
  page: number,
  limit: number,
  searchParams?: ReadonlyURLSearchParams
) => {
  const startDate = searchParams?.get("start_date") || null;
  const endDate = searchParams?.get("end_date") || null;

  const response = await fetchGraphql<{
    getCommissionTransactions: { data: CommissionTransaction[]; count: number };
  }>(GET_COMMISSION_TRANSACTION_QUERY as any, { page, limit, startDate, endDate } as any);

  return response.getCommissionTransactions;
};

// --- Transaction Actions (Reprocess & Receipt) ---

export const processComissionTransaction = async (data: ProcessCommissionInput) => {
  const responseData = await fetchGraphql<{ processCommission: boolean }>(
    `
      mutation ProcessCommission($processCommissionInput: ProcessCommissionInput!) {
        processCommission(processCommissionInput: $processCommissionInput)
      }
    `,
    {
      processCommissionInput: data
    }
  )

  return responseData?.processCommission
}

export const sendReceiptEmail = async (transactionId: string) => {
  const responseData = await fetchGraphql<{ processReceipt: boolean }>(
    `
      mutation ProcessReceipt($processReceiptInput: ProcessReceiptInput!) {
        processReceipt(processReceiptInput: $processReceiptInput)
      }
    `,
    {
      processReceiptInput: {
        transactionId
      }
    }
  )

  return responseData?.processReceipt
}

