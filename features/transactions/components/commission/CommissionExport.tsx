"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useCommissionExport } from "../../hooks/use-commission-export";

export function CommissionExport() {
  const searchParams = useSearchParams();
  const from = searchParams.get("start_date") || null;
  const to = searchParams.get("end_date") || null;
  const sourceType = searchParams.get("commissionsource") || null;

  const { mutateAsync: exportCommission, isPending } = useCommissionExport();

  const handleExport = async () => {
    try {
      const result = await exportCommission({
        from,
        to,
        source_type: sourceType === "all" ? null : sourceType,
      });
      toast.success(`Downloaded ${result.filename}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to export commission data";
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
        "Download Commission Data"
      )}
    </Button>
  );
}
