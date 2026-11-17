"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { useAdminLogsExport } from "../hooks/use-admin-logs-export";
import type { AdminLogFilters } from "../hooks/use-admin-logs";
import { toast } from "sonner";

export function AdminLogsExport({ filters }: { filters: AdminLogFilters }) {
  const { mutateAsync, isPending } = useAdminLogsExport();

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      const result = await mutateAsync({ filters, format });
      if (result.truncated) {
        toast.warning(
          `Exported the newest ${result.exported.toLocaleString()} of ${result.total.toLocaleString()} logs. Narrow by admin or action to get the rest.`
        );
      } else {
        toast.success(`Exported ${result.exported.toLocaleString()} logs as ${format.toUpperCase()}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export logs");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" disabled={isPending}>
          <Download className="h-4 w-4 mr-2" /> {isPending ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="h-4 w-4 mr-2" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <File className="h-4 w-4 mr-2" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
