import { useMutation } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql, useFragment as getFragmentData } from "@/lib/gql";
import { exportToCsv } from "@/features/users/utils/export-csv";

import { CompleteAssetPaymentsFragment } from "../components/complete/CompleteAssetPaymentsTable";

const EXPORT_LIMIT = 1_000_000;

// Reuse the already-typed query used by `useCompleteAssetTransactions` to avoid `graphql(...)` returning `unknown`.
const GET_USERS_WITH_ZERO_BALANCE_QUERY = graphql(`
  query GetUsersWithZeroBalance($page: Int!, $limit: Int!) {
    getUsersWithZeroBalance(page: $page, limit: $limit) {
      count
      data {
        ...CompleteAssetPaymentsTable_data
      }
    }
  }
`);

// Keep formatting consistent with other exports in this codebase:
// explicitly prefix the Naira symbol so it doesn't depend on Intl currency rendering.
const formatCurrency = (value?: number | null) =>
  `₦${Number(value ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export const useExportCompleteAssetPayments = () => {
  return useMutation({
    mutationFn: () =>
      execute(GET_USERS_WITH_ZERO_BALANCE_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
      }),
    onSuccess: (data) => {
      const paymentsRaw = data.getUsersWithZeroBalance?.data ?? [];
      const nonNullPayments = paymentsRaw.filter(
        (payment): payment is NonNullable<typeof payment> => payment !== null && payment !== undefined
      );

      const rows = nonNullPayments.map((payment) =>
        getFragmentData(CompleteAssetPaymentsFragment, payment)
      );

      if (!rows.length) return;

      exportToCsv(
        rows,
        [
          { header: "Name", accessor: (r) => r.name || "-" },
          { header: "Email", accessor: (r) => r.email || "-" },
          { header: "Phone Number", accessor: (r) => r.phone_number || "-" },
          { header: "Sales Person", accessor: (r) => r.sales_person || "-" },
          { header: "Asset Name", accessor: (r) => r.asset_name || "-" },
          { header: "Unit", accessor: (r) => r.unit ?? "-" },
          { header: "Size", accessor: (r) => r.size ?? "-" },
          { header: "Price", accessor: (r) => formatCurrency(r.price) },
          { header: "Amount Paid", accessor: (r) => formatCurrency(r.amount_paid) },
          {
            header: "Month Subscription",
            accessor: (r) =>
              r.month_subscription !== null && r.month_subscription !== undefined
                ? `${r.month_subscription} months`
                : "-",
          },
          { header: "Start Date", accessor: (r) => formatDate(r.start_date) },
          { header: "Next Payment Date", accessor: (r) => formatDate(r.next_payment_date) },
        ],
        "completed-asset-payments.csv"
      );
    },
  });
};

