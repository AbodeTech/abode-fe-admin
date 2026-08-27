"use client";

import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * GET /admin/purchase-confirmations/export — @SkipTransform, streamed CSV.
 * Bypasses apiGet's envelope handling the same way useExportFlexLeads does,
 * and refuses cleanly in mock mode rather than faking a file.
 */
export const useExportConfirmations = () =>
  useMutation({
    mutationFn: async (filters: { status?: string; product?: string; q?: string }) => {
      if (isMockApiEnabled()) {
        throw new Error("Export is unavailable in mock mode — point the app at a real backend.");
      }

      const response = await apiClient.get("/admin/purchase-confirmations/export", {
        params: {
          status: filters.status === "all" ? undefined : filters.status,
          product: filters.product === "all" ? undefined : filters.product,
          q: filters.q || undefined,
        },
        responseType: "blob",
      });

      const disposition = String(response.headers["content-disposition"] ?? "");
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "purchase-confirmations.csv";

      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);

      return { filename };
    },
  });
