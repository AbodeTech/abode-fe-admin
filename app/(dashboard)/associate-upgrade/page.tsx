"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_UPGRADE_LIMIT,
  useUpgradeRequests,
  useApproveUpgrade,
  useDeclineUpgrade,
} from "@/features/associate-upgrade";
import {
  UpgradeFilters,
  UpgradeTable,
  ConfirmDialog,
  UpgradeRowFragment,
} from "@/features/associate-upgrade";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Pagination } from "@/components/shared/Pagination";

function AssociateUpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") || "";

  const [search, setSearch] = useState(searchParam);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"approve" | "decline">("approve");
  const [activeRow, setActiveRow] = useState<FragmentType<typeof UpgradeRowFragment> | null>(null);

  const { data, isLoading, error } = useUpgradeRequests({
    page,
    limit: DEFAULT_UPGRADE_LIMIT,
    adminStatus: statusParam,
    search: searchParam || null,
  });

  const { mutateAsync: approveUpgrade, isPending: approving } = useApproveUpgrade();
  const { mutateAsync: declineUpgrade, isPending: declining } = useDeclineUpgrade();

  // No client-side filtering needed as the API handles it via searchParam
  const upgradeRequests = useMemo(() => {
    return (data?.upgradeRequests ?? []).filter(
      (item): item is NonNullable<typeof item> => item !== null
    );
  }, [data?.upgradeRequests]);

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

  // debounce search syncing to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchParam) {
        updateParams({ search: search || null, page: 1 }, { replace: true });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, searchParam, updateParams]);

  const handleStatusChange = (value: string | null) => {
    updateParams({ status: value, page: 1 });
  };

  const openConfirm = (mode: "approve" | "decline", row: FragmentType<typeof UpgradeRowFragment>) => {
    setConfirmMode(mode);
    setActiveRow(row);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!activeRow) return;
    const upgrade = getFragmentData(UpgradeRowFragment, activeRow);
    const id = upgrade._id;
    const upgradeType = upgrade.user_upgrade_type;

    try {
      if (confirmMode === "approve") {
        if (!id) throw new Error("Invalid upgrade request ID");
        await approveUpgrade({ id, upgradeType });
        toast.success("Upgrade approved");
      } else {
        if (!id) throw new Error("Invalid upgrade request ID");
        await declineUpgrade(id);
        toast.success("Upgrade declined");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setConfirmOpen(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading upgrade requests</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associate Upgrade Requests</h1>
          <p className="text-muted-foreground">
            Review and manage associate/associate-pro upgrade submissions.
          </p>
        </div>
      </div>

      <UpgradeFilters
        search={search}
        status={statusParam}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
      />

      <UpgradeTable
        data={upgradeRequests}
        onApprove={(row) => openConfirm("approve", row)}
        onDecline={(row) => openConfirm("decline", row)}
      />

      <Pagination
        count={data?.pagination.totalCount ?? 0}
        currentIdx={data?.pagination.currentPage ?? page}
        limit={data?.pagination.limit ?? DEFAULT_UPGRADE_LIMIT}
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests...
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmMode === "approve" ? "Approve upgrade" : "Decline upgrade"}
        description="This action will update the user's upgrade request status."
        actionLabel={confirmMode === "approve" ? "Approve" : "Decline"}
        loading={confirmMode === "approve" ? approving : declining}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default function AssociateUpgradePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AssociateUpgradeContent />
    </Suspense>
  );
}
