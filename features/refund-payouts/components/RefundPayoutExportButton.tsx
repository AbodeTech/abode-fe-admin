"use client";

import { useMutation } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportToCsv, type CsvColumn } from "@/lib/utils/export-csv";

import { fetchAllRefundPayouts, type RefundPayoutListFilters } from "../hooks/use-refund-payouts";
import { REFUND_PAYOUT_STATUS_LABELS, type RefundPayout } from "../schemas/refund-payout.schema";

/** For reconciling against the bank statement: one row per refund, with its references. */
const COLUMNS: CsvColumn<RefundPayout>[] = [
  { header: "Approved", accessor: (r) => r.approved_at },
  { header: "Customer", accessor: (r) => r.customer_name ?? "" },
  { header: "Email", accessor: (r) => r.customer_email ?? "" },
  { header: "User ID", accessor: (r) => r.user_id },
  { header: "Estate", accessor: (r) => r.asset_name ?? "" },
  { header: "Size (sqm)", accessor: (r) => r.size_sqm ?? "" },
  { header: "Plan ID", accessor: (r) => r.plan_id },
  { header: "Ended", accessor: (r) => (r.ended_early ? "Early, by the customer" : "Window ran out") },
  { header: "Amount (NGN)", accessor: (r) => r.amount },
  { header: "Status", accessor: (r) => REFUND_PAYOUT_STATUS_LABELS[r.status] },
  { header: "Paid by", accessor: (r) => (r.method === "manual" ? "Hand" : r.method === "paystack" ? "Paystack" : "") },
  { header: "Bank", accessor: (r) => r.bank?.bank_name ?? "" },
  { header: "Account number", accessor: (r) => r.bank?.account_number ?? "" },
  { header: "Account name", accessor: (r) => r.bank?.account_name ?? "" },
  { header: "Our reference", accessor: (r) => r.reference ?? "" },
  { header: "Paystack transfer code", accessor: (r) => r.provider_transfer_reference ?? "" },
  { header: "Manual reference", accessor: (r) => r.manual_reference ?? "" },
  { header: "Sent at", accessor: (r) => r.sent_at ?? "" },
  { header: "Paid at", accessor: (r) => r.paid_at ?? "" },
  { header: "Failed tries", accessor: (r) => r.attempts.filter((a) => a.outcome !== "sent").length },
  { header: "Last error", accessor: (r) => r.last_error ?? "" },
  { header: "Refund ID", accessor: (r) => r.id },
  { header: "Recovery record ID", accessor: (r) => r.recovery_window_id },
];

export function RefundPayoutExportButton({ filters }: { filters: RefundPayoutListFilters }) {
  const exporter = useMutation({
    mutationFn: async () => {
      const { rows, total, truncated } = await fetchAllRefundPayouts(filters);
      if (rows.length) exportToCsv(rows, COLUMNS, `refunds-${new Date().toISOString().slice(0, 10)}.csv`);
      return { rows: rows.length, total, truncated };
    },
  });

  const run = () =>
    exporter.mutate(undefined, {
      onSuccess: ({ rows, total, truncated }) => {
        if (rows === 0) return void toast.info("Nothing to export — no refunds match these filters");
        if (truncated) {
          return void toast.warning(
            `Exported the first ${rows.toLocaleString()} of ${total?.toLocaleString() ?? "many"} rows — the file is incomplete. Narrow the filters and export again.`
          );
        }
        toast.success(`Exported ${rows.toLocaleString()} refund${rows === 1 ? "" : "s"}`);
      },
      onError: (error) => toast.error(error.message || "Export failed"),
    });

  return (
    <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={run} disabled={exporter.isPending}>
      {exporter.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
      {exporter.isPending ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
