import { useMutation } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";
import { transactionKeys } from "./query-keys";

const EXPORT_WITHDRAWAL_TRANSACTIONS_QUERY = `
  query ExportWithdrawalTransactions($page: Int!, $limit: Int!, $status: String, $search: String) {
    getWithdrawalTransaction(page: $page, limit: $limit, status: $status, search: $search) {
      count
      data {
        _id
        admin_status
        amount
        time_of_transaction
        processing_type
        tin
        bank_details {
          accountNumber
          bankName
          name
        }
        user {
          firstName
          lastName
          _id
        }
      }
    }
  }
`;

interface WithdrawalExportParams {
  status?: string | null;
  search?: string | null;
  limit?: number;
}

interface WithdrawalExportResponse {
  getWithdrawalTransaction?: {
    count?: number | null;
    data?: Array<{
      _id?: string | null;
      admin_status?: string | null;
      amount?: number | null;
      time_of_transaction?: string | null;
      processing_type?: string | null;
      tin?: string | null;
      bank_details?: {
        accountNumber?: string | null;
        bankName?: string | null;
        name?: string | null;
      } | null;
      user?: {
        firstName?: string | null;
        lastName?: string | null;
        _id?: string | null;
      } | null;
    } | null> | null;
  } | null;
}

export const useWithdrawalExport = () =>
  useMutation({
    mutationKey: transactionKeys.withdrawalList({ page: 1, limit: 1_000_000 }),
    mutationFn: ({ status, search, limit = 1_000_000 }: WithdrawalExportParams) =>
      executeRaw<WithdrawalExportResponse>(EXPORT_WITHDRAWAL_TRANSACTIONS_QUERY, {
        page: 1,
        limit,
        status: status ?? null,
        search: search ?? null,
      }),
  });
