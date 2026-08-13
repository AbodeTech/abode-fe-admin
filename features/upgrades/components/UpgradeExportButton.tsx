"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useUpgradeExport } from "../hooks/use-upgrade-export";
import type { UpgradeListFilters } from "../hooks/query-keys";

/**
 * Exports what the current filters select, not the whole table — the header says
 * so, because an admin who has filtered to `pending` and clicks Export is
 * entitled to know which of the two they are getting.
 */
export function UpgradeExportButton({ filters }: { filters: UpgradeListFilters }) {
  const exportUpgrades = useUpgradeExport();

  const run = () => {
    exportUpgrades.mutate(filters, {
      onSuccess: ({ rows, total, truncated }) => {
        if (rows === 0) {
          toast.info("Nothing to export — no upgrades match these filters");
          return;
        }
        if (truncated) {
          toast.warning(
            `Exported the first ${rows.toLocaleString()} of ${total?.toLocaleString() ?? "many"} rows — the file is incomplete. Narrow the filters and export again.`
          );
          return;
        }
        toast.success(`Exported ${rows.toLocaleString()} upgrade${rows === 1 ? "" : "s"}`);
      },
      onError: (error) => toast.error(error.message || "Export failed"),
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full shrink-0 sm:w-auto"
      onClick={run}
      disabled={exportUpgrades.isPending}
    >
      {exportUpgrades.isPending ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      {exportUpgrades.isPending ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
