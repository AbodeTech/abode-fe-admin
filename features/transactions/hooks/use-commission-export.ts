import { useMutation } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";
import { transactionKeys } from "./query-keys";

const EXPORT_COMMISSION_TRANSACTIONS_QUERY = `
  query ExportCommissionTransactions($page: Int!, $limit: Int!, $startDate: String, $endDate: String, $commissionSource: String) {
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

interface CommissionExportParams {
  startDate?: string | null;
  endDate?: string | null;
  commissionSource?: string | null;
  limit?: number;
}

interface ExportCommissionResponse {
  getCommissionTransactions?: {
    count?: number | null;
    data?: Array<{
      _id?: string | null;
      tin?: string | null;
      admin_status?: string | null;
      amount?: number | null;
      asset_type?: string | null;
      description?: string | null;
      user?: {
        _id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        referrer?: string | null;
        referral_status?: string | null;
        email?: string | null;
        tin?: string | null;
      } | null;
      plot_size?: string | null;
      status?: string | null;
      referral?: string | null;
      transaction_type?: string | null;
      time_of_transaction?: string | null;
    } | null> | null;
  } | null;
}

export const useCommissionExport = () =>
  useMutation({
    mutationKey: transactionKeys.commissionList({ page: 1, limit: 1_000_000 }),
    mutationFn: ({ startDate, endDate, commissionSource, limit = 1_000_000 }: CommissionExportParams) =>
      executeRaw<ExportCommissionResponse>(EXPORT_COMMISSION_TRANSACTIONS_QUERY, {
        page: 1,
        limit,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        commissionSource: commissionSource ?? null,
      }),
  });
