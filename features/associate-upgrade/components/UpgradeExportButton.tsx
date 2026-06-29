"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpgradeExport, type UpgradeExportFilters } from "../hooks/use-upgrade-export";

interface UpgradeExportButtonProps {
  adminStatus?: string | null;
  search?: string | null;
}

export function UpgradeExportButton({ adminStatus, search }: UpgradeExportButtonProps) {
  const filters: UpgradeExportFilters = { adminStatus, search };
  const { exportCsv, isExporting } = useUpgradeExport(filters);

  return (
    <Button
      variant="outline"
      className="w-full shrink-0 sm:w-auto"
      onClick={() => exportCsv()}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1 h-4 w-4" />
      )}
      {isExporting ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
