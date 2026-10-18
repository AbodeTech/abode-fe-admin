"use client";

import { toast } from "sonner";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useDownloadTicketPdf } from "../hooks/use-download-ticket-pdf";

export function DownloadTicketPdfButton({ rewardId }: { rewardId: string }) {
  const canExport = useAdminPermissions().has("export_campaigns");
  const { mutateAsync: download, isPending } = useDownloadTicketPdf();

  if (!canExport) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={async () => {
        try {
          await download(rewardId);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Couldn't download ticket. Please try again or contact support."
          );
        }
      }}
    >
      <Download className="mr-1 h-3.5 w-3.5" />
      PDF
    </Button>
  );
}
