import { exportToCsv } from "@/features/users/utils/export-csv";
import type { ManagerDashboardProRow } from "@/lib/gql/graphql";

const formatDate = (iso: Date | string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const formatCurrency = (n: number) =>
  n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

export const exportManagerProsToCsv = (
  rows: ManagerDashboardProRow[],
  filenamePrefix = "associate-pros"
) => {
  exportToCsv(
    rows,
    [
      {
        header: "First Name",
        accessor: (r) => r.firstName ?? "",
      },
      {
        header: "Last Name",
        accessor: (r) => r.lastName ?? "",
      },
      { header: "Email", accessor: (r) => r.email ?? "" },
      { header: "Phone", accessor: (r) => r.phoneNumber ?? "" },
      { header: "Status", accessor: (r) => r.status },
      {
        header: "Date Recruited",
        accessor: (r) => formatDate(r.dateRecruited),
      },
      { header: "Total Sales", accessor: (r) => r.totalSales },
      {
        header: "Revenue Generated",
        accessor: (r) => formatCurrency(r.revenueGenerated),
      },
      {
        header: "Last Login",
        accessor: (r) => formatDate(r.lastLogin),
      },
      {
        header: "Onboarded At",
        accessor: (r) => formatDate(r.onboardedAt),
      },
    ],
    `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
  );
};
