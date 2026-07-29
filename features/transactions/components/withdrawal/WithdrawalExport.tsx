"use client";

import { useSearchParams } from "next/navigation";
import { saveAs } from "file-saver";
import { DownloadIcon, Loader2 } from "lucide-react";
// @ts-expect-error - json2csv ESM typings are incomplete in this setup.
import { Parser } from "json2csv";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWithdrawalExport } from "../../hooks/use-withdrawal-export";

export function WithdrawalExport() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("transactionstatus");
  const status = rawStatus === "all" ? null : rawStatus || null;
  const search = searchParams.get("search") || "";
  const { mutateAsync: exportWithdrawals, isPending } = useWithdrawalExport();

  const handleExport = async () => {
    try {
      const response = await exportWithdrawals({ status, search: search || null });
      const rows = response.getWithdrawalTransaction?.data ?? [];

      if (!rows.length) {
        toast.info("No withdrawal transactions to export");
        return;
      }

      const csvRows = rows
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .map((row) => ({
          payer: `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() || "N/A",
          tin: row.tin || "N/A",
          bankName: row.bank_details?.bankName || "N/A",
          accountNumber: row.bank_details?.accountNumber
            ? `'${row.bank_details.accountNumber}`
            : "N/A",
          accountName: row.bank_details?.name || "N/A",
          amount: row.amount ?? 0,
          date: row.time_of_transaction || "N/A",
          method: row.processing_type || "manual",
          status: row.admin_status || "N/A",
        }));

      if (!csvRows.length) {
        toast.info("No withdrawal transactions to export");
        return;
      }

      const parser = new Parser();
      const csv = parser.parse(csvRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "withdrawal-transactions.csv");
      toast.success("Withdrawal transactions exported");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to export withdrawal transactions";
      toast.error(message);
    }
  };

  return (
    <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={handleExport} disabled={isPending}>
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </>
      )}
    </Button>
  );
}
