"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContentLoader, SuspensePageFallback } from "@/components/shared/page-content-loader";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import {
  DEFAULT_UPGRADE_LIMIT,
  useUpgradeRequests,
  useApproveUpgrade,
  useDeclineUpgrade,
  CreateUpgradeTransactionDialog,
} from "@/features/associate-upgrade";
import {
  UpgradeFilters,
  UpgradeTable,
  UpgradeExportButton,
  ConfirmDialog,
  UpgradeRowFragment,
} from "@/features/associate-upgrade";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Pagination } from "@/components/shared/Pagination";

function AssociateUpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const statusParam = searchParams.get("adminStatus") ?? searchParams.get("status");
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

  // Search is handled server-side via the `search` query arg; just drop nulls.
  const upgradeRequests = useMemo(
    () =>
      (data?.upgradeRequests ?? []).filter(
        (item): item is NonNullable<typeof item> => item !== null
      ),
    [data?.upgradeRequests]
  );

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
      const nav = { scroll: false as const };
      if (options?.replace) {
        router.replace(url, nav);
      } else {
        router.push(url, nav);
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
    updateParams({ adminStatus: value, page: 1 });
  };

  const openConfirm = (mode: "approve" | "decline", row: FragmentType<typeof UpgradeRowFragment>) => {
    setConfirmMode(mode);
    setActiveRow(row);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!activeRow) return;
    const upgrade = getFragmentData(UpgradeRowFragment, activeRow);
    const id = upgrade.user?._id;
    const upgradeType = upgrade.user_upgrade_type;

    try {
      if (confirmMode === "approve") {
        if (!id) throw new Error("Invalid user ID for upgrade request");
        await approveUpgrade({ id, upgradeType });
        toast.success("Upgrade approved");
      } else {
        if (!id) throw new Error("Invalid user ID for upgrade request");
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
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading upgrade requests</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Associate Upgrade Requests</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Review and manage associate/associate-pro upgrade submissions.
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <UpgradeExportButton adminStatus={statusParam} search={searchParam} />
          <CreateUpgradeTransactionDialog />
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/associate-upgrade/coupons">Coupon Management</Link>
          </Button>
        </div>
      </div>

      <UpgradeFilters
        search={search}
        status={statusParam}
        onSearchChange={setSearch}
        onStatusChange={handleStatusChange}
      />

      {isLoading ? (
        <PageContentLoader label="Loading upgrade requests…" />
      ) : (
        <>
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
        </>
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
    <Suspense fallback={<SuspensePageFallback />}>
      <AssociateUpgradeContent />
    </Suspense>
  );
}
