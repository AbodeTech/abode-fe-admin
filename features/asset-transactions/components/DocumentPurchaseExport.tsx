"use client";

import { saveAs } from "file-saver";
import { DownloadIcon, Loader2 } from "lucide-react";
// @ts-expect-error - json2csv ESM typings are incomplete in this setup.
import { Parser } from "json2csv";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useDocumentPurchaseExport } from "../hooks/use-document-purchase-export";
import type { DocumentPurchaseListFilters } from "../hooks/query-keys";
import {
  adminStatusForBadge,
  buyerEmail,
  payerDisplayName,
  plotSizeSqm,
  propertyNameDisplay,
  referrerName,
  transactionMethodLabel,
} from "../schemas/purchase.schema";

/**
 * Downloads the document ledger the current filters describe. The columns are
 * the ones the BE actually populates — see `use-document-purchase-export`.
 */
export function DocumentPurchaseExport({ filters }: { filters: DocumentPurchaseListFilters }) {
  const { mutateAsync: exportDocuments, isPending } = useDocumentPurchaseExport();

  const handleExport = async () => {
    try {
      const rows = await exportDocuments(filters);

      if (!rows.length) {
        toast.info("No document transactions to export");
        return;
      }

      const csvRows = rows.map((row) => ({
        date: row.createdAt ?? "N/A",
        payer: payerDisplayName(row),
        email: buyerEmail(row.user) ?? "N/A",
        referrer: referrerName(row.user) ?? "No Referrer",
        property: propertyNameDisplay(row),
        plotSize: plotSizeSqm(row) ?? "N/A",
        amount: row.amount,
        paymentMethod: transactionMethodLabel(row),
        status: adminStatusForBadge(row),
      }));

      const csv = new Parser().parse(csvRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "document-transactions.csv");
      toast.success("Document transactions exported");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to export document transactions";
      toast.error(message);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full shrink-0 sm:w-auto"
      onClick={handleExport}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Transactions
        </>
      )}
    </Button>
  );
}
