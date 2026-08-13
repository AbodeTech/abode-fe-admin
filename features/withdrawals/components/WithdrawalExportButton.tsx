"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useWithdrawalExport } from "../hooks/use-withdrawal-export";
import type { WithdrawalListFilters } from "../hooks/query-keys";

/** Exports what the current filters select, not the whole queue. */
export function WithdrawalExportButton({ filters }: { filters: WithdrawalListFilters }) {
  const exportWithdrawals = useWithdrawalExport();

  const run = () => {
    exportWithdrawals.mutate(filters, {
      onSuccess: ({ rows, total, truncated }) => {
        if (rows === 0) {
          toast.info("Nothing to export — no withdrawals match these filters");
          return;
        }
        if (truncated) {
          toast.warning(
            `Exported the first ${rows.toLocaleString()} of ${total?.toLocaleString() ?? "many"} rows — the file is incomplete. Narrow the filters and export again.`
          );
          return;
        }
        toast.success(`Exported ${rows.toLocaleString()} withdrawal${rows === 1 ? "" : "s"}`);
      },
      onError: (error) => toast.error(error.message || "Export failed"),
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full shrink-0 sm:w-auto"
      onClick={run}
      disabled={exportWithdrawals.isPending}
    >
      {exportWithdrawals.isPending ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      {exportWithdrawals.isPending ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
