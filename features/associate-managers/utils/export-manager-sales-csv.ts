import { format } from "date-fns";
import { exportToCsv } from "@/features/users/utils/export-csv";
import {
  derivePaymentStatus,
  outstandingBalance,
} from "@/features/sales/lib/payment-status";

type SalesExportRow = {
  user_firstName?: string | null;
  user_lastName?: string | null;
  email?: string | null;
  user_phone?: string | null;
  referrer_name?: string | null;
  referrer_email?: string | null;
  referrer_phone?: string | null;
  asset_name?: string | null;
  asset_type?: string | null;
  no_of_units?: number | null;
  size?: number | null;
  price?: number | null;
  amount_paid?: number | null;
  amount_payable?: number | null;
  balance?: number | null;
  default_amount?: number | null;
  is_suspended?: boolean | null;
  start_date?: string | null;
  next_date?: string | null;
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};

export const exportManagerSalesToCsv = (
  rows: SalesExportRow[],
  filenamePrefix = "team-sales"
) => {
  exportToCsv(
    rows,
    [
      {
        header: "Buyer First Name",
        accessor: (r) => r.user_firstName ?? "",
      },
      {
        header: "Buyer Last Name",
        accessor: (r) => r.user_lastName ?? "",
      },
      { header: "Buyer Email", accessor: (r) => r.email ?? "" },
      { header: "Buyer Phone", accessor: (r) => r.user_phone ?? "" },
      { header: "Referrer", accessor: (r) => r.referrer_name ?? "" },
      { header: "Referrer Email", accessor: (r) => r.referrer_email ?? "" },
      { header: "Referrer Phone", accessor: (r) => r.referrer_phone ?? "" },
      { header: "Asset", accessor: (r) => r.asset_name ?? "" },
      { header: "Asset Type", accessor: (r) => r.asset_type ?? "" },
      { header: "Units", accessor: (r) => r.no_of_units ?? "" },
      { header: "Size", accessor: (r) => r.size ?? "" },
      { header: "Price", accessor: (r) => r.price ?? "" },
      { header: "Amount Paid", accessor: (r) => r.amount_paid ?? "" },
      { header: "Amount Payable", accessor: (r) => r.amount_payable ?? "" },
      { header: "Balance", accessor: (r) => outstandingBalance(r) },
      { header: "Default Amount", accessor: (r) => r.default_amount ?? "" },
      {
        header: "Suspended",
        accessor: (r) => (r.is_suspended ? "Yes" : "No"),
      },
      {
        header: "Payment Status",
        accessor: (r) => derivePaymentStatus(r),
      },
      { header: "Start Date", accessor: (r) => formatDate(r.start_date) },
      { header: "Next Payment", accessor: (r) => formatDate(r.next_date) },
    ],
    `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
  );
};
