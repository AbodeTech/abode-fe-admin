import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { transactionKeys } from "./query-keys";

const EXPORT_COMMISSION_TRANSACTIONS_QUERY = graphql(`
  query ExportCommissionTransactions($page: Int!, $limit: Int!, $startDate: String, $endDate: String) {
    getCommissionTransactions(page: $page, startDate: $startDate, endDate: $endDate, limit: $limit) {
      count
      data {
        _id
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
`);

interface CommissionExportParams {
  startDate?: string | null;
  endDate?: string | null;
  limit?: number;
}

export const useCommissionExport = () =>
  useMutation({
    mutationKey: transactionKeys.commissionList({ page: 1, limit: 1_000_000 }),
    mutationFn: ({ startDate, endDate, limit = 1_000_000 }: CommissionExportParams) =>
      execute(EXPORT_COMMISSION_TRANSACTIONS_QUERY, {
        page: 1,
        limit,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      }),
  });

