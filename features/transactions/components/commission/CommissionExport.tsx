"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
// @ts-expect-error - json2csv ESM typings are incomplete in this setup.
import { Parser } from "json2csv";
import { Button } from "@/components/ui/button";
import { useCommissionExport } from "../../hooks/use-commission-export";
import { toast } from "sonner";

const parseCommissionDescription = (description: string) => {
  if (!description.startsWith("Commission:")) {
    return { assetType: null as string | null, clientName: null as string | null, taxAmount: null as string | null, balance: null as string | null };
  }

  const cleanDescription = description.substring("Commission: ".length);
  let assetType: string | null = "flex";
  let clientName: string | null = null;
  let taxAmount: string | null = null;
  let balance: string | null = null;

  if (cleanDescription.includes(" by ")) {
    assetType = cleanDescription.split(" by ")[0].trim();

    if (cleanDescription.includes(" with VAT: ") || cleanDescription.includes(" with WHT:")) {
      clientName = cleanDescription.split(" by ")[1].split(" with ")[0].trim();
      const vatMatch = description.match(/VAT: (\d+\.?\d*)/);
      const whtMatch = description.match(/WHT: (\d+\.?\d*)/);
      taxAmount = vatMatch ? vatMatch[1] : whtMatch ? whtMatch[1] : null;
      const balanceMatch = description.match(/Balance at Transaction: (\d+\.?\d*)/);
      balance = balanceMatch ? balanceMatch[1] : null;
    } else {
      clientName = cleanDescription.split(" by ")[1].trim();
    }
  }

  return { assetType, clientName, taxAmount, balance };
};

const formatDate = (input?: string | null) => {
  if (!input) return "N/A";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
};

export function CommissionExport() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date") || null;
  const endDate = searchParams.get("end_date") || null;
  const commissionSource = searchParams.get("commissionsource") || null;

  const { mutateAsync: exportCommission, isPending } = useCommissionExport();

  const handleExport = async () => {
    try {
      const response = await exportCommission({ startDate, endDate, commissionSource });
      const rows = response.getCommissionTransactions?.data ?? [];

      if (!rows.length) {
        toast.info("No commission data to export");
        return;
      }

      const csvRows = rows
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .map((row) => {
          const parsed = parseCommissionDescription(row.description ?? "");
          const amount = Number(row.amount ?? 0);
          const taxAmount = parsed.taxAmount ? Number(parsed.taxAmount) : null;
          const gross = taxAmount !== null ? taxAmount + amount : null;
          const percentageEarned =
            gross !== null && gross > 0
              ? (100 * (amount / (gross * 0.95)))
              : "N/A";
          const commission = amount > 0 ? (amount / 0.95) : "N/A";
          const whtTax = amount > 0 ? ((amount / 0.95) - amount) : "N/A";

          return {
            Date: formatDate(row.time_of_transaction),
            Client_name: parsed.clientName || "N/A",
            Transaction_amount: gross !== null ? gross : "N/A",
            Asset_type: parsed.assetType || row.asset_type || "N/A",
            Associate_name: `${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() || "N/A",
            Associate_status: row.user?.referral_status || "N/A",
            Percentage_earned: percentageEarned,
            Commission: commission,
            Tax_Payer_ID: row.tin || row.user?.tin || "N/A",
            WHT_tax: whtTax,
            Comission_earned: amount || "N/A",
            Commission_status: row.status || "N/A",
          };
        });

      const parser = new Parser();
      const csv = parser.parse(csvRows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "commissions.csv");
      toast.success("Commission data exported");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export commission data";
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
        "Download Commission Data"
      )}
    </Button>
  );
}
