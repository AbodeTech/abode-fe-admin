import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ManagerDashboardFilterInput } from "@/lib/gql/graphql";
import { exportManagerProsToCsv } from "../utils/export-manager-pros-csv";

const EXPORT_MANAGER_DASHBOARD_PROS_QUERY = graphql(`
  query ExportManagerDashboardPros(
    $managerId: ID
    $filter: ManagerDashboardFilterInput
  ) {
    exportManagerDashboardPros(managerId: $managerId, filter: $filter) {
      id
      firstName
      lastName
      email
      phoneNumber
      status
      dateRecruited
      totalSales
      revenueGenerated
      lastLogin
      onboardedAt
    }
  }
`);

export interface ExportManagerProsInput {
  managerId?: string | null;
  filter: ManagerDashboardFilterInput;
  filenamePrefix?: string;
}

export const useExportManagerDashboardPros = () => {
  return useMutation({
    mutationFn: async ({
      managerId,
      filter,
      filenamePrefix,
    }: ExportManagerProsInput) => {
      const data = await execute(EXPORT_MANAGER_DASHBOARD_PROS_QUERY, {
        managerId: managerId ?? null,
        filter,
      });
      const rows = data.exportManagerDashboardPros ?? [];
      if (rows.length === 0) {
        throw new Error("No roster rows to export for the current filters.");
      }
      exportManagerProsToCsv(rows, filenamePrefix);
      return rows;
    },
  });
};
