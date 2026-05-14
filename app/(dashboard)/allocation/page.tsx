"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import {
  AllocationFilters,
  AllocationModal,
  AllocationModalMode,
  AllocationTable,
  AllocationTableRowFragment,
  DEFAULT_ALLOCATION_LIMIT,
  useAllocationAssets,
  useAllocationClients,
  useAllocationExport,
} from "@/features/allocation";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
// @ts-expect-error - json2csv does not ship complete ESM typings in this setup.
import { Parser } from "json2csv";
import { saveAs } from "file-saver";
import { toast } from "sonner";

const parsePercentage = (value?: string | null) => {
  if (!value) return null;
  const firstPart = value.split("-")[0];
  const parsed = Number(firstPart);
  return Number.isFinite(parsed) ? parsed : null;
};

function AllocationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const assetNameParam = searchParams.get("assetname");
  const percentageParam = searchParams.get("percentage");
  const searchParam = searchParams.get("search") || "";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AllocationModalMode>("send");
  const [modalClient, setModalClient] = useState<FragmentType<typeof AllocationTableRowFragment> | null>(null);

  const filters = {
    page,
    limit: DEFAULT_ALLOCATION_LIMIT,
    assetName: assetNameParam,
    percentage: parsePercentage(percentageParam),
    search: searchParam || null,
    startDate: startDateParam,
    endDate: endDateParam,
  };

  const { data, isLoading, error } = useAllocationClients(filters);
  const { data: assets } = useAllocationAssets();
  const { mutateAsync: exportAlloc, isPending: isExporting } = useAllocationExport();

  useEffect(() => {
    if (!modalOpen) setModalClient(null);
  }, [modalOpen]);

  const updateParams = useCallback(
    (next: Record<string, string | number | null | undefined>, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const query = params.toString();
      const url = query ? `?${query}` : "";
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== searchParam) {
        updateParams({ search: searchTerm || null, page: 1 }, { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchParam, updateParams]);

  const handleAssetChange = (value: string | null) => {
    updateParams({ assetname: value, page: 1 });
  };

  const handlePercentageChange = (value: string) => {
    updateParams({ percentage: value === "all" ? null : value, page: 1 });
  };

  const handleSend = (client: FragmentType<typeof AllocationTableRowFragment>) => {
    setModalMode("send");
    setModalClient(client);
    setModalOpen(true);
  };

  const handleResend = (client: FragmentType<typeof AllocationTableRowFragment>) => {
    setModalMode("resend");
    setModalClient(client);
    setModalOpen(true);
  };

  const handleDownload = async () => {
    try {
      const result = await exportAlloc({
        assetName: assetNameParam,
        percentage: parsePercentage(percentageParam),
        search: searchParam || null,
        startDate: startDateParam,
        endDate: endDateParam,
      });
      const exportRows = result?.eligibleClientsForLand?.data ?? [];
      if (!exportRows.length) {
        toast.info("No data to export");
        return;
      }
      const parsed = exportRows.map((row) => {
        const client = getFragmentData(AllocationTableRowFragment, row);
        return {
          clientName: `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim(),
          referrer: client.referral || "not added yet",
          assetName: client.assetType ? `${client.assetName} (${client.assetType})` : client.assetName,
          landSize: client.assetSize,
          units: client.unit,
          paymentPercentage: client.paymentPercentage,
          amountPaid: client.amountPaid,
          totalPrice: client.totalPrice,
          durationMonths: client.duration,
          location: client.location,
          boughtDate: client.end_date,
          allocationNumber: client.allocation || "Not assigned yet",
        };
      });
      const parser = new Parser();
      const csv = parser.parse(parsed);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "allocation-clients.csv");
      toast.success("Export ready");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export");
    }
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading allocation</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 pb-24 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Land Allocation System</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage and track allocations for eligible clients.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={handleDownload}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download
            </>
          )}
        </Button>
      </div>

      <AllocationFilters
        assets={assets}
        search={searchTerm}
        percentage={percentageParam || "all"}
        assetName={assetNameParam}
        onSearchChange={setSearchTerm}
        onPercentageChange={handlePercentageChange}
        onAssetNameChange={handleAssetChange}
      />

      <AllocationTable
        rows={data?.data}
        isLoading={isLoading}
        onSend={handleSend}
        onResend={handleResend}
      />

      <Pagination
        count={data?.count ?? 0}
        currentIdx={page}
        limit={DEFAULT_ALLOCATION_LIMIT}
      />

      <AllocationModal
        open={modalOpen}
        mode={modalMode}
        client={modalClient}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

export default function AllocationPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <AllocationContent />
    </Suspense>
  );
}
