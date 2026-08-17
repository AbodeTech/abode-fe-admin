import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { transactionKeys } from "./query-keys";

const EXPORT_DOCUMENT_TRANSACTIONS_QUERY = graphql(`
  query ExportDocumentTransactions(
    $page: Int!
    $limit: Int!
    $status: String
    $transactionType: String
    $assetType: String
    $salesType: String
    $startDate: Date
    $endDate: Date
    $search: String
  ) {
    getDocumentTransaction(
      page: $page
      limit: $limit
      status: $status
      transactionType: $transactionType
      assetType: $assetType
      salesType: $salesType
      startDate: $startDate
      endDate: $endDate
      search: $search
    ) {
      count
      data {
        _id
        amount
        description
        admin_status
        plot_size
        asset_type
        referral
        transaction_type
        user {
          firstName
          lastName
          email
          phoneNumber
          referral_status
          _id
        }
        time_of_transaction
      }
    }
  }
`);

interface DocumentExportParams {
  status?: string | null;
  transactionType?: string | null;
  assetType?: string | null;
  salesType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
  limit?: number;
}

export const useDocumentExport = () =>
  useMutation({
    mutationKey: transactionKeys.documentList({ page: 1, limit: 1_000_000 }),
    mutationFn: ({
      status,
      transactionType,
      assetType,
      salesType,
      startDate,
      endDate,
      search,
      limit = 1_000_000,
    }: DocumentExportParams) =>
      execute(EXPORT_DOCUMENT_TRANSACTIONS_QUERY, {
        page: 1,
        limit,
        status: status ?? null,
        transactionType: transactionType ?? null,
        assetType: assetType ?? null,
        salesType: salesType ?? null,
        startDate: startDate ?? null,
        endDate: endDate ?? null,
        search: search ?? null,
      }),
  });
