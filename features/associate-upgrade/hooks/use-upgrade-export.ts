import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { AdminStatus, type ExportUpgradeRequestsQuery } from "@/lib/gql/graphql";
import { exportToCsv } from "../utils/export-csv";

// Flat query (no fragment masking) so the export can read fields directly.
const EXPORT_UPGRADE_REQUESTS = graphql(`
  query ExportUpgradeRequests($page: Int!, $limit: Int!, $adminStatus: AdminStatus, $search: String) {
    getAllUpgradeRequests(page: $page, limit: $limit, adminStatus: $adminStatus, search: $search) {
      upgradeRequests {
        _id
        admin_status
        createdAt
        fee_amount
        transaction_type
        user_upgrade_type
        file_Url
        user {
          firstName
          lastName
          email
          phoneNumber
        }
        associate {
          firstName
          lastName
          email
          phoneNumber
        }
      }
      pagination {
        currentPage
        limit
        totalCount
        totalPages
      }
    }
  }
`);

type ExportRow = NonNullable<
  ExportUpgradeRequestsQuery["getAllUpgradeRequests"]["upgradeRequests"][number]
>;

const EXPORT_PAGE_SIZE = 200;

export interface UpgradeExportFilters {
  adminStatus?: string | null;
  search?: string | null;
}

async function fetchAllUpgradeRequests(
  adminStatus?: string | null,
  search?: string | null
): Promise<ExportRow[]> {
  const variables = {
    limit: EXPORT_PAGE_SIZE,
    adminStatus: (adminStatus || undefined) as AdminStatus | undefined,
    search: search ?? null,
  };

  const first = await execute(EXPORT_UPGRADE_REQUESTS, { ...variables, page: 1 });
  const firstRows = (first.getAllUpgradeRequests.upgradeRequests ?? []).filter(
    (r): r is ExportRow => r !== null
  );
  const totalPages = first.getAllUpgradeRequests.pagination.totalPages ?? 1;

  if (totalPages <= 1) return firstRows;

  const restPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const restResults = await Promise.all(
    restPages.map((page) => execute(EXPORT_UPGRADE_REQUESTS, { ...variables, page }))
  );

  const restRows = restResults.flatMap((res) =>
    (res.getAllUpgradeRequests.upgradeRequests ?? []).filter((r): r is ExportRow => r !== null)
  );

  return [...firstRows, ...restRows];
}

export const useUpgradeExport = (filters: UpgradeExportFilters) => {
  const mutation = useMutation({
    mutationFn: () => fetchAllUpgradeRequests(filters.adminStatus, filters.search),
    onSuccess: (rows) => {
      if (rows.length === 0) {
        toast.info("No upgrade requests to export for the current filters.");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      exportToCsv(
        rows,
        [
          { header: "User First Name", accessor: (r) => r.user?.firstName },
          { header: "User Last Name", accessor: (r) => r.user?.lastName },
          { header: "User Email", accessor: (r) => r.user?.email },
          { header: "User Phone", accessor: (r) => r.user?.phoneNumber },
          { header: "Referral First Name", accessor: (r) => r.associate?.firstName },
          { header: "Referral Last Name", accessor: (r) => r.associate?.lastName },
          { header: "Referral Email", accessor: (r) => r.associate?.email },
          { header: "Referral Phone", accessor: (r) => r.associate?.phoneNumber },
          { header: "Upgrade Type", accessor: (r) => r.user_upgrade_type },
          { header: "Transaction Type", accessor: (r) => r.transaction_type },
          { header: "Amount", accessor: (r) => r.fee_amount },
          { header: "Status", accessor: (r) => r.admin_status },
          {
            header: "Created At",
            accessor: (r) => (r.createdAt ? new Date(r.createdAt).toISOString() : ""),
          },
          { header: "Evidence File", accessor: (r) => r.file_Url },
        ],
        `associate-upgrade-requests-${stamp}.csv`
      );
      toast.success(`Exported ${rows.length} upgrade request${rows.length === 1 ? "" : "s"}.`);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to export upgrade requests.");
    },
  });

  return {
    exportCsv: mutation.mutate,
    isExporting: mutation.isPending,
    exportedCount: mutation.data?.length ?? 0,
  };
};
