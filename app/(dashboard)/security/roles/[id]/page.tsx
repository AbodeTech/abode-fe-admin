"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAdminWithRole } from "@/features/roles-permissions";
import { AdminDetailHeader } from "@/features/roles-permissions/components/AdminDetailHeader";
import { AdminLogsTable, DEFAULT_ADMIN_LOGS_LIMIT, useAdminLogs } from "@/features/admin-logs";
import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader, SuspensePageFallback } from "@/components/shared/page-content-loader";

function AdminDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const adminId = params?.id as string;
  const page = Number(searchParams.get("page")) || 1;

  const { data: admin, isLoading: loadingAdmin, error: adminError } = useAdminWithRole(adminId);

  // Filtered by the id in the URL, so it never asks for everyone's logs while
  // the admin record is still loading.
  const { data: logsData, isLoading: loadingLogs, error: logsError } = useAdminLogs(
    { page, limit: DEFAULT_ADMIN_LOGS_LIMIT, adminId },
    Boolean(adminId)
  );

  if (adminError) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-400 px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading admin</h3>
          <p>{(adminError as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  if (loadingAdmin) {
    return (
      <div className="mx-auto mt-4 w-full min-w-0 max-w-400 px-3 sm:px-4">
        <PageContentLoader label="Loading admin details…" />
      </div>
    );
  }

  const total = logsData?.total ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-400 space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <AdminDetailHeader admin={admin} logs={logsData?.items ?? []} isLoadingLogs={loadingLogs} />

      <div className="min-w-0 space-y-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold">Activity History</h3>
          {!loadingLogs && !logsError && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {total.toLocaleString()} total activities
            </span>
          )}
        </div>

        {logsError ? (
          <div className="text-sm text-red-500">Failed to load activity history.</div>
        ) : (
          <AdminLogsTable logs={logsData?.items} isLoading={loadingLogs} />
        )}

        {total > 0 && <Pagination count={total} currentIdx={page} limit={DEFAULT_ADMIN_LOGS_LIMIT} />}
      </div>
    </div>
  );
}

export default function AdminDetailPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <AdminDetailContent />
    </Suspense>
  );
}
