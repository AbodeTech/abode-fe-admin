"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
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
  useAllocateLand,
  getClientAllocationStatus,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AllocationModalMode>("assign");
  const [modalClient, setModalClient] = useState<FragmentType<typeof AllocationTableRowFragment> | null>(null);
  const [isBulkAllocating, setIsBulkAllocating] = useState(false);

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
  const { mutateAsync: allocateLand } = useAllocateLand();

  const rows = useMemo(
    () => (data?.data ?? []).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [data?.data]
  );

  // Clear selection when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, assetNameParam, percentageParam, searchParam, startDateParam, endDateParam]);

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

  const handleSelectionChange = (paymentPlanId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(paymentPlanId);
      } else {
        next.delete(paymentPlanId);
      }
      return next;
    });
  };

  const handleAssign = (client: FragmentType<typeof AllocationTableRowFragment>) => {
    setModalMode("assign");
    setModalClient(client);
    setModalOpen(true);
  };

  const handleAllocate = (client: FragmentType<typeof AllocationTableRowFragment>) => {
    setModalMode("allocate");
    setModalClient(client);
    setModalOpen(true);
  };

  const handleResend = (client: FragmentType<typeof AllocationTableRowFragment>) => {
    setModalMode("resend");
    setModalClient(client);
    setModalOpen(true);
  };

  const handleBulkAllocate = async () => {
    const assignedRows = rows.filter((row) => {
      const client = getFragmentData(AllocationTableRowFragment, row);
      return (
        client.paymentPlan &&
        selectedIds.has(client.paymentPlan) &&
        getClientAllocationStatus(client) === "assigned"
      );
    });

    if (assignedRows.length === 0) return;

    setIsBulkAllocating(true);
    const results = await Promise.allSettled(
      assignedRows.map((row) => {
        const client = getFragmentData(AllocationTableRowFragment, row);
        const parts = (client.allocation ?? "").split(",").map((p) => p.trim());
        return allocateLand({
          paymentPlanId: client.paymentPlan!,
          block: parts[0] ?? "",
          plot: parts[1] ?? "",
        });
      })
    );
    setIsBulkAllocating(false);

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    if (failed === 0) {
      toast.success(`${succeeded} allocation${succeeded > 1 ? "s" : ""} sent successfully`);
    } else {
      toast.warning(`${succeeded} sent, ${failed} failed`);
    }

    setSelectedIds(new Set());
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
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Land Allocation System</h1>
          <p className="text-muted-foreground">
            Manage and track allocations for eligible clients.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isExporting}>
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
        rows={rows}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onAssign={handleAssign}
        onAllocate={handleAllocate}
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

      {/* Bulk allocation bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl border bg-background px-6 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} client{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <Button
            size="sm"
            onClick={handleBulkAllocate}
            disabled={isBulkAllocating}
            className="flex items-center gap-2"
          >
            {isBulkAllocating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Allocate {selectedIds.size > 1 ? `All ${selectedIds.size}` : ""}
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            disabled={isBulkAllocating}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AllocationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AllocationContent />
    </Suspense>
  );
}
