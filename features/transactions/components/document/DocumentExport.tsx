"use client";

import { useSearchParams } from "next/navigation";
import { saveAs } from "file-saver";
import { DownloadIcon, Loader2 } from "lucide-react";
// @ts-expect-error - json2csv ESM typings are incomplete in this setup.
import { Parser } from "json2csv";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDocumentExport } from "../../hooks/use-document-export";

export function DocumentExport() {
  const searchParams = useSearchParams();
  const status = searchParams.get("transactionstatus") || null;
  const transactionType = searchParams.get("transactiontype") || null;
  const assetType = searchParams.get("assettype") || null;
  const salesType = searchParams.get("salestype") || null;
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const search = searchParams.get("search") || null;

  const { mutateAsync: exportDocuments, isPending } = useDocumentExport();

  const handleExport = async () => {
    try {
      const response = await exportDocuments({
        status,
        transactionType,
        assetType,
        salesType,
        startDate,
        endDate,
        search,
      });
      const rows = response.getDocumentTransaction?.data ?? [];

      if (!rows.length) {
        toast.info("No document transactions to export");
        return;
      }

      const csvRows = rows
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .filter((row) => row.admin_status === "pending")
        .map((row) => ({
          time: row.time_of_transaction ?? "N/A",
          name: row.user?.firstName ?? "N/A",
          email: row.user?.email ?? "N/A",
          PhoneNumber: row.user?.phoneNumber ? `'${row.user.phoneNumber}` : "No Phone Number",
          status: row.user?.referral_status ?? "No Referral",
          referrer: row.referral || "No Referrer",
          assetName: row.description || "N/A",
          plotSize: row.plot_size || "N/A",
          amount: row.amount ?? 0,
        }));

      if (!csvRows.length) {
        toast.info("No pending document transactions to export");
        return;
      }

      const parser = new Parser();
      const csv = parser.parse(csvRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "document-transactions.csv");
      toast.success("Document transactions exported");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export document transactions";
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
          Download Transactions
        </>
      )}
    </Button>
  );
}
