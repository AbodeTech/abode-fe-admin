import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { SalesRecordFilters } from "@/lib/gql/graphql";
import { exportManagerSalesToCsv } from "../utils/export-manager-sales-csv";

const EXPORT_MANAGER_SALES_RECORD_QUERY = graphql(`
  query ExportManagerSalesRecord(
    $managerId: ID
    $filters: SalesRecordFilters
  ) {
    exportManagerSalesRecord(managerId: $managerId, filters: $filters) {
      data {
        user_firstName
        user_lastName
        email
        user_phone
        referrer_name
        referrer_email
        referrer_phone
        asset_name
        asset_type
        no_of_units
        size
        price
        amount_paid
        amount_payable
        balance
        default_amount
        is_suspended
        start_date
        next_date
      }
    }
  }
`);

export interface ExportManagerSalesInput {
  managerId?: string | null;
  filters?: SalesRecordFilters | null;
  filenamePrefix?: string;
}

export const useExportManagerSalesRecord = () => {
  return useMutation({
    mutationFn: async ({
      managerId,
      filters,
      filenamePrefix,
    }: ExportManagerSalesInput) => {
      const data = await execute(EXPORT_MANAGER_SALES_RECORD_QUERY, {
        managerId: managerId ?? null,
        filters: filters ?? null,
      });
      const rows = (data.exportManagerSalesRecord?.data ?? []).filter(
        (r): r is NonNullable<typeof r> => r != null
      );
      if (rows.length === 0) {
        throw new Error("No sales records to export for the current filters.");
      }
      exportManagerSalesToCsv(rows, filenamePrefix);
      return rows;
    },
  });
};
